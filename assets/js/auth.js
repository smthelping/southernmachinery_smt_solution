/* ==========================================================================
 * auth.js — 服务端认证与访问门禁（Supabase Auth + RLS）
 *
 * 门禁状态机（顺序即强制顺序）：
 *   local            未配置 Supabase → 本地模式（不登录，用本地 data/kb.js）
 *   signed_out       未登录
 *   must_change_password  首登强制改密（**默认已关闭**：见
 *                    supabase/migrations/20260915000003_password_change_optional.sql。
 *                    机制保留，管理员可对个别账号重新开启该标记）
 *   reset_request    申请「邮箱重置密码」（忘记密码入口）
 *   reset_password   已从邮件链接进入（recovery 会话），设置新密码
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
  let recoveryPending = false;
  let state = { stage: 'local', profile: null, session: null, error: '', factorId: null, notice: '' };

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
    if (/For security purposes.*after \d+ seconds/i.test(m)) return '发送过于频繁，请稍后再试（重置邮件有频率限制）';
    if (/Unable to validate email/i.test(m)) return '邮箱格式不正确';
    if (/Email link is invalid or has expired/i.test(m)) return '链接已失效或过期，请重新申请重置邮件';
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
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // 必须为 true，否则「邮箱重置密码」的回链无法生效：
        // 邮件链接形如 <站点>/#access_token=...&type=recovery，
        // 只有让 SDK 解析 URL 才能建立 recovery 会话并抛出 PASSWORD_RECOVERY 事件。
        detectSessionInUrl: true
      }
    });
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryPending = true;
        return set({ stage: 'reset_password', error: '', notice: '' });
      }
      resolve().catch(() => {});
    });
    return resolve();
  }

  /* --------------------------- 状态判定 --------------------------- */
  async function resolve() {
    if (!client) return init();

    const sessionRes = await client.auth.getSession();
    const session = sessionRes && sessionRes.data ? sessionRes.data.session : null;
    if (!session) return set({ stage: 'signed_out', session: null, profile: null, factorId: null, error: '' });

    // 从邮件链接进来（recovery 会话）：停在设置新密码页，不要因为已登录就放行。
    // 否则用户点开链接后被直接送进主界面，重置流程等于没走完。
    if (recoveryPending) {
      return set({ stage: 'reset_password', session, profile: null, factorId: null, error: '', notice: '' });
    }

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
    recoveryPending = false;
    return set({ stage: 'signed_out', session: null, profile: null, factorId: null, error: '', notice: '' });
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

  /* --------------------------- 邮箱重置密码 --------------------------- */
  /** 进入「申请重置密码」页 */
  function goResetRequest() { return set({ stage: 'reset_request', error: '', notice: '' }); }

  /** 返回登录页（若已建立会话——例如已点开重置链接——则回到正常判定，而非假装未登录） */
  function backToSignIn() {
    const hasSession = !!(state.session && state.session.user);
    return hasSession ? resolve() : set({ stage: 'signed_out', error: '', notice: '' });
  }

  /**
   * 发送重置密码邮件。
   * 回链地址优先取 auth-config.js 的 resetRedirectTo，未配置时用当前站点地址。
   * ⚠️ 该地址必须加入 Supabase 白名单（Auth → URL Configuration → Redirect URLs），
   *    否则 Supabase 会回落到它自己的 Site URL，链接会落到别处。
   * 出于防枚举考虑，服务端对「邮箱是否存在」一律返回成功，这里也不提示是否命中。
   */
  async function requestPasswordReset(email) {
    if (!client) throw new Error('未配置 Supabase，无法发送重置邮件');
    const to = CFG.resetRedirectTo || (location.origin + location.pathname);
    const { error } = await client.auth.resetPasswordForEmail(String(email).trim(), { redirectTo: to });
    if (error) throw new Error(translate(error.message));
    return set({
      stage: 'reset_request', error: '',
      notice: '若该邮箱已在系统中登记，重置邮件已发出。请查收（含垃圾邮件箱），点开链接即可设置新密码。'
    });
  }

  /**
   * 完成重置：设置新密码。
   * 走到这里说明已通过 recovery 会话证明「能控制该绑定邮箱」，设置成功后直接进入正常流程。
   */
  async function completePasswordReset(newPassword) {
    if (!client) throw new Error('未配置 Supabase');
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw new Error(translate(error.message));
    recoveryPending = false;
    // 清掉地址栏里的 recovery token，避免刷新后又被带回重置页
    if (/access_token=|type=recovery/.test(location.hash)) {
      history.replaceState(null, '', location.pathname + location.search);
    }
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
    goResetRequest, backToSignIn, requestPasswordReset, completePasswordReset,
    loadCorpus, passwordIssues,
    isReady: () => state.stage === 'ready',
    isAdmin: () => !!(state.profile && state.profile.role === 'admin')
  };
})();
