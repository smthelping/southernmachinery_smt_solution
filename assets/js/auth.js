/* ==========================================================================
 * auth.js — 服务端认证与访问门禁（Supabase Auth + RLS）
 *
 * 门禁状态机（顺序即强制顺序）：
 *   local            未配置 Supabase → 本地模式（不登录，用本地 data/kb.js）
 *   signed_out       未登录
 *   must_change_password  首登强制改密（数据库触发器：改密才清除标记）
 *   mfa_enroll       强制注册 TOTP
 *   mfa_verify       已注册但本次会话未完成第二因子（aal1 → 需 aal2）
 *   ready            全部通过，可读取客户资料库
 *
 * ⚠️ 安全边界说明：本模块只负责**交互流程**；真正的拦截在数据库 RLS——
 *    未改密 / 未过 MFA 时，knowledge_docs 查询恒为空集，改前端也没用。
 * ========================================================================== */
window.Auth = (function () {
  const CFG = window.SM_AUTH_CONFIG || {};
  let client = null;
  let listeners = [];
  let state = { stage: 'local', profile: null, session: null, error: '', factorId: null };

  function configured() { return !!(CFG.supabaseUrl && CFG.supabaseAnonKey); }
  function sdkReady() { return !!(window.supabase && window.supabase.createClient); }
  function table() { return CFG.corpusTable || 'knowledge_docs'; }

  function set(patch) {
    state = Object.assign({}, state, patch);
    listeners.forEach(fn => { try { fn(state); } catch (e) { /* ignore */ } });
    return state;
  }

  function onChange(fn) { listeners.push(fn); }
  function get() { return state; }

  function translate(msg) {
    const m = String(msg || '');
    if (/Invalid login credentials/i.test(m)) return '邮箱或密码不正确';
    if (/Email not confirmed/i.test(m)) return '邮箱尚未确认，请联系管理员';
    if (/Password should be at least/i.test(m)) return '密码长度不足，请设置更长的密码';
    if (/same as the old password|should be different/i.test(m)) return '新密码不能与当前密码相同';
    if (/rate limit|too many/i.test(m)) return '尝试过于频繁，请稍后再试';
    if (/Invalid TOTP|invalid code/i.test(m)) return '验证码不正确，请核对后重试';
    if (/JWT|token/i.test(m)) return '登录状态已失效，请重新登录';
    return m || '操作失败';
  }

  /* --------------------------- 初始化 --------------------------- */
  function init() {
    if (!configured()) return set({ stage: 'local' });
    if (!sdkReady()) {
      return set({
        stage: 'error',
        error: '未加载 Supabase SDK（需要联网访问 CDN）。可改用本地模式，或检查网络后刷新。'
      });
    }
    client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    client.auth.onAuthStateChange(() => { resolve().catch(() => {}); });
    return resolve();
  }

  /* --------------------------- 状态判定 --------------------------- */
  async function resolve() {
    if (!client) return init();

    const sessionRes = await client.auth.getSession();
    const session = sessionRes && sessionRes.data ? sessionRes.data.session : null;
    if (!session) return set({ stage: 'signed_out', session: null, profile: null, factorId: null, error: '' });

    // 档案（RLS：仅本人可读）
    const profRes = await client.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (profRes.error) {
      return set({ stage: 'error', session, error: '读取档案失败：' + translate(profRes.error.message) });
    }
    const profile = profRes.data;
    if (!profile) {
      return set({ stage: 'error', session, error: '该账号在 profiles 中没有档案，请让管理员检查开通流程。' });
    }

    // 门禁 1：首登强制改密
    if (profile.must_change_password) {
      return set({ stage: 'must_change_password', session, profile, factorId: null, error: '' });
    }

    // 门禁 2：MFA —— 仅对 mfa_required 为 true 的账号强制。
    // 服务端 RLS 用同一个开关判定（public.mfa_required_for_me()），两边必须一致：
    // 若前端强制、服务端不强制，用户会被卡在 TOTP 页；反之则形同虚设。
    if (profile.mfa_required === false) {
      try { await client.rpc('touch_last_login'); } catch (e) { /* 非关键 */ }
      return set({ stage: 'ready', session, profile, factorId: null, error: '' });
    }

    let currentLevel = 'aal1';
    try {
      const aal = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.data) currentLevel = aal.data.currentLevel || 'aal1';
    } catch (e) { /* 忽略：按 aal1 处理 */ }

    let verified = [];
    try {
      const factors = await client.auth.mfa.listFactors();
      const totp = (factors && factors.data && factors.data.totp) || [];
      verified = totp.filter(f => f.status === 'verified');
    } catch (e) { /* ignore */ }

    if (!verified.length) {
      return set({ stage: 'mfa_enroll', session, profile, factorId: null, error: '' });
    }
    if (currentLevel !== 'aal2') {
      return set({ stage: 'mfa_verify', session, profile, factorId: verified[0].id, error: '' });
    }

    // 全部通过
    try { await client.rpc('touch_last_login'); } catch (e) { /* 非关键 */ }
    return set({ stage: 'ready', session, profile, factorId: (verified[0] || {}).id || null, error: '' });
  }

  /* --------------------------- 动作 --------------------------- */
  async function signIn(email, password) {
    if (!client) throw new Error('未配置 Supabase，无法登录');
    const { error } = await client.auth.signInWithPassword({ email: String(email).trim(), password });
    if (error) throw new Error(translate(error.message));
    return resolve();
  }

  async function signOut() {
    if (client) await client.auth.signOut();
    return set({ stage: 'signed_out', session: null, profile: null, factorId: null, error: '' });
  }

  async function changePassword(newPassword) {
    if (!client) throw new Error('未配置 Supabase');
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(translate(error.message));
    // 数据库触发器已把 must_change_password 置回 false，重新判定状态即可
    return resolve();
  }

  async function enrollTotp() {
    if (!client) throw new Error('未配置 Supabase');
    const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp' });
    if (error) throw new Error(translate(error.message));
    const totp = (data && data.totp) || {};
    return { factorId: data.id, qr: totp.qr_code, secret: totp.secret, uri: totp.uri };
  }

  async function verifyTotp(factorId, code) {
    if (!client) throw new Error('未配置 Supabase');
    const ch = await client.auth.mfa.challenge({ factorId });
    if (ch.error) throw new Error(translate(ch.error.message));
    const v = await client.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: String(code).trim() });
    if (v.error) throw new Error(translate(v.error.message));
    return resolve();
  }

  /* --------------------------- 客户资料库 --------------------------- */
  /**
   * 拉取客户方案资料库。
   * 无权限时 RLS 返回**空集**（而非报错），因此这里显式区分「无数据」与「无权限」。
   */
  async function loadCorpus() {
    if (!client) return { ok: false, reason: 'local' };
    const { data, error } = await client
      .from(table())
      .select('doc_key,title,category,chars,snippet,body');
    if (error) return { ok: false, reason: translate(error.message) };
    if (!data || !data.length) {
      return { ok: false, reason: 'no_access', hint: '需要完成 MFA 并修改初始密码后才能读取客户资料库（服务端 RLS 限制）。' };
    }
    return {
      ok: true,
      docs: data.map(d => ({
        id: d.doc_key, title: d.title, category: d.category || '99-Other 其他',
        chars: d.chars || (d.body || '').length, snippet: d.snippet || '', text: d.body || '',
        origin: 'remote'
      }))
    };
  }

  /* --------------------------- 密码强度（与服务端策略一致） --------------------------- */
  function passwordIssues(pwd, profile) {
    const min = CFG.minPasswordLength || 12;
    const issues = [];
    if (!pwd || pwd.length < min) issues.push(`至少 ${min} 位`);
    if (!/[a-z]/.test(pwd)) issues.push('含小写字母');
    if (!/[A-Z]/.test(pwd)) issues.push('含大写字母');
    if (!/[0-9]/.test(pwd)) issues.push('含数字');
    if (!/[^A-Za-z0-9]/.test(pwd)) issues.push('含符号');
    const login = String((profile && profile.email) || '').split('@')[0].toLowerCase();
    if (login && pwd.toLowerCase().indexOf(login) >= 0) issues.push('不能包含邮箱前缀');
    return issues;
  }

  return {
    init, resolve, get, onChange, configured,
    signIn, signOut, changePassword, enrollTotp, verifyTotp,
    loadCorpus, passwordIssues,
    isReady: () => state.stage === 'ready',
    isAdmin: () => !!(state.profile && state.profile.role === 'admin')
  };
})();
