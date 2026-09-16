/* ==========================================================================
 * llm.js — OpenAI 兼容接口客户端
 * 支持任意 OpenAI Chat Completions 兼容网关（OpenAI / DeepSeek / Azure / 本地
 * Ollama、vLLM、One-API 等），密钥仅保存在浏览器 localStorage。
 * ========================================================================== */
window.LLM = (function () {
  const STORE_KEY = 'sm.llm.cfg';        // 旧版：单配置（保留，仅用于一次性迁移）
  const LIST_KEY = 'sm.llm.profiles';    // 多配置列表
  const ACTIVE_KEY = 'sm.llm.active';    // 当前启用的配置 id
  const TEST_TIMEOUT_MS = 20000;         // 测试连接的短超时：失败要快，别让人干等（旧版会等到 180s）

  /* 常见网关预设：新增接口时一键带入，省去查 Base URL 与模型名 */
  const PRESETS = [
    { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', jsonMode: true },
    { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', jsonMode: true },
    { name: '通义千问（兼容模式）', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', jsonMode: true },
    { name: 'Kimi 月之暗面', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', jsonMode: true },
    { name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', jsonMode: true },
    { name: '本地 Ollama', baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5:7b', jsonMode: false },
    { name: '自定义（留空自己填）', baseUrl: '', model: '', jsonMode: true }
  ];

  let profiles = [];
  let activeId = null;
  let cfg = Object.assign({}, SM_CONFIG.llm);   // 当前生效配置（= 活动 profile 本体）

  const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function fromPreset(p, idx) {
    return Object.assign({
      id: newId(),
      name: p.name || ('接口 ' + (idx + 1)),
      apiKey: '',
      temperature: SM_CONFIG.llm.temperature,
      timeoutMs: SM_CONFIG.llm.timeoutMs
    }, p);
  }
  function persist() {
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_KEY, activeId || '');
    } catch (e) { /* 存储不可用时退化为内存态 */ }
  }
  /** 从 Base URL 猜一个名字，便于在列表里区分（如 api.deepseek.com → deepseek.com） */
  function guessName(baseUrl) {
    try { return String(baseUrl).replace(/^https?:\/\//, '').split('/')[0]; }
    catch (e) { return '接口'; }
  }

  /**
   * 载入配置。首次运行会把旧版单配置（sm.llm.cfg）迁移成一条 profile，
   * 因此老用户不用重新填 Key。
   */
  function load() {
    try { profiles = JSON.parse(localStorage.getItem(LIST_KEY) || '[]'); } catch (e) { profiles = []; }
    if (!Array.isArray(profiles) || !profiles.length) {
      let legacy = null;
      try { legacy = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { legacy = null; }
      const base = Object.assign({}, SM_CONFIG.llm, legacy || {});
      profiles = [Object.assign({
        id: newId(),
        name: guessName(base.baseUrl || '') || '默认接口'
      }, base)];
      activeId = profiles[0].id;
      persist();
    }
    activeId = localStorage.getItem(ACTIVE_KEY) || activeId;
    if (!profiles.some(p => p.id === activeId)) activeId = profiles[0].id;
    cfg = profiles.find(p => p.id === activeId);
    return cfg;
  }

  /* ------------------------- 多接口管理 ------------------------- */
  function list() { return profiles; }
  function active() { return cfg; }
  function use(id) {
    const p = profiles.find(x => x.id === id);
    if (!p) return cfg;
    activeId = id; cfg = p; persist();
    return cfg;
  }
  function add(presetIdx) {
    const p = fromPreset(PRESETS[presetIdx] || PRESETS[PRESETS.length - 1], profiles.length);
    profiles.push(p);
    activeId = p.id; cfg = p; persist();
    return cfg;
  }
  function remove(id) {
    if (profiles.length <= 1) return { ok: false, reason: '至少保留一个接口配置' };
    const i = profiles.findIndex(x => x.id === id);
    if (i < 0) return { ok: false, reason: '未找到该配置' };
    profiles.splice(i, 1);
    if (activeId === id) { activeId = profiles[0].id; cfg = profiles[0]; }
    persist();
    return { ok: true, active: cfg };
  }
  function save(patch) {
    Object.assign(cfg, patch || {});
    // 防止名称被清空后在列表里认不出来
    if (!String(cfg.name || '').trim()) cfg.name = guessName(cfg.baseUrl || '') || '接口';
    persist();
    return cfg;
  }
  function get() { return cfg; }
  function ready() { return !!(cfg.baseUrl && cfg.model && cfg.apiKey); }

  /** 由给定配置拼出 chat/completions 地址（不传则用当前生效配置） */
  function endpointOf(c) {
    let base = ((c || cfg).baseUrl || '').trim().replace(/\/+$/, '');
    if (!base) return '';
    if (!/\/chat\/completions$/.test(base)) base += '/chat/completions';
    return base;
  }
  function endpoint() { return endpointOf(cfg); }

  function explainError(status, bodyText) {
    const t = (bodyText || '').slice(0, 400);
    if (status === 401 || status === 403) return `鉴权失败（HTTP ${status}）：请检查 API Key 是否正确、是否有该模型权限。${t}`;
    if (status === 404) return `接口或模型不存在（HTTP 404）：请检查 Base URL（应形如 https://api.openai.com/v1）与模型名。${t}`;
    if (status === 429) return `请求过于频繁或额度不足（HTTP 429）：${t}`;
    if (status >= 500) return `服务端错误（HTTP ${status}）：${t}`;
    return `请求失败（HTTP ${status}）：${t}`;
  }

  /**
   * 调用对话补全。json=true 时要求模型返回 JSON 对象。
   * @returns {Promise<string>} 模型输出的文本内容
   */
  async function chat(opts) {
    const { system, user, messages, json = false, temperature, maxTokens, timeoutMs, signal } = opts || {};
    if (!cfg.baseUrl || !cfg.model) throw new Error('尚未配置 LLM：请先在「设置」中填写 Base URL 与模型名称。');
    if (!cfg.apiKey) throw new Error('尚未配置 API Key：请在「设置」中填写。');

    const msgs = messages || [];
    if (system) msgs.unshift({ role: 'system', content: system });
    if (user) msgs.push({ role: 'user', content: user });

    const body = {
      model: cfg.model,
      messages: msgs,
      temperature: typeof temperature === 'number' ? temperature : cfg.temperature
    };
    if (maxTokens) body.max_tokens = maxTokens;
    if (json && cfg.jsonMode) body.response_format = { type: 'json_object' };

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs || cfg.timeoutMs || 180000);
    if (signal) signal.addEventListener('abort', () => ctrl.abort());

    let res;
    try {
      res = await fetch(endpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + cfg.apiKey
        },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
    } catch (err) {
      clearTimeout(timer);
      if (err && err.name === 'AbortError') throw new Error('请求超时或被取消。可在「设置」中增大超时时间，或换用更快的模型。');
      throw new Error(
        '无法连接到 LLM 接口：' + (err && err.message ? err.message : err) +
        '\n常见原因：网络不可达、Base URL 错误，或该网关未开放浏览器跨域（CORS）。' +
        '\n若网关不支持 CORS，可改用支持浏览器直连的服务（如 OpenAI、DeepSeek 官方接口）或在本机架设反向代理。'
      );
    }

    if (!res.ok) {
      // 部分网关不支持 response_format，去掉后重试一次
      const text = await res.text().catch(() => '');
      if (json && cfg.jsonMode && (res.status === 400 || res.status === 422)) {
        clearTimeout(timer);
        const backup = cfg.jsonMode;
        cfg.jsonMode = false;   // 该网关不支持 response_format，降级为纯提示词约束
        try { return await chat(opts); } finally { cfg.jsonMode = backup; }
      }
      clearTimeout(timer);
      throw new Error(explainError(res.status, text));
    }

    const data = await res.json();
    clearTimeout(timer);
    const choice = (data.choices || [])[0] || {};
    const content = (choice.message && choice.message.content) || choice.text || '';
    if (!content) throw new Error('接口返回内容为空：' + JSON.stringify(data).slice(0, 300));
    return content;
  }

  /** 从可能带 markdown 围栏 / 前后缀的文本中提取 JSON */
  function extractJSON(text) {
    if (typeof text !== 'string') return text;
    let s = text.trim();
    s = s.replace(/^```(?:json|javascript)?\s*/i, '').replace(/```\s*$/, '').trim();
    try { return JSON.parse(s); } catch (e) { /* continue */ }
    const start = s.search(/[[{]/);
    if (start >= 0) {
      const open = s[start];
      const close = open === '{' ? '}' : ']';
      const end = s.lastIndexOf(close);
      if (end > start) {
        const slice = s.slice(start, end + 1);
        try { return JSON.parse(slice); } catch (e2) { /* continue */ }
        // 容错：去掉尾随逗号
        try { return JSON.parse(slice.replace(/,\s*([}\]])/g, '$1')); } catch (e3) { /* continue */ }
      }
    }
    throw new Error('模型返回的不是合法 JSON。原始内容前 500 字：\n' + text.slice(0, 500));
  }

  async function chatJSON(opts) {
    const raw = await chat(Object.assign({}, opts, { json: true }));
    return { data: extractJSON(raw), raw };
  }

  /** 可达性探针：no-cors 请求能完成 = 域名可达（拿不到内容，只看通不通） */
  async function probeReachable(base) {
    if (!base) return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      await fetch(base, { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal });
      return true;
    } catch (e) {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 连接测试。四个要点，都是踩过坑留下的：
   *   1) 用**传进来的表单值**（不传才回落到已保存配置）——旧版只测已保存配置，
   *      用户填完直接点「测试连接」其实测的是空配置，被误判成"连不通"；
   *   2) 只发最小请求体（model + messages）：temperature / max_tokens / response_format
   *      都可能被部分网关或推理模型拒绝，测通不通的阶段不该引入这些变量；
   *   3) 短超时（20s）：失败要快。旧版沿用 180s 业务超时，网关不通时会长时间挂住；
   *   4) 失败时区分「域名不可达」与「被浏览器跨域(CORS)拦下」，并回显实际请求地址。
   */
  async function test(override) {
    const c = Object.assign({}, cfg, override || {});
    const url = endpointOf(c);
    if (!url) throw new Error('请先填写 Base URL。');
    if (!c.model) throw new Error('请先填写模型名称。');
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(url);
    if (!c.apiKey && !isLocal) throw new Error('请先填写 API Key。');

    const t0 = Date.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TEST_TIMEOUT_MS);
    let res = null, netErr = null;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.apiKey },
        body: JSON.stringify({ model: c.model, messages: [{ role: 'user', content: 'ping' }] }),
        signal: ctrl.signal
      });
    } catch (e) {
      netErr = e;
    } finally {
      clearTimeout(timer);
    }

    if (netErr) {
      const ms = Date.now() - t0;
      const aborted = netErr.name === 'AbortError';
      const baseNoSlash = (c.baseUrl || '').trim().replace(/\/+$/, '');
      const reachable = aborted ? false : await probeReachable(baseNoSlash);
      const lines = [
        aborted
          ? `请求超时（${ms}ms，上限 ${TEST_TIMEOUT_MS}ms）：接口未在预期时间内响应。`
          : `无法完成请求（${ms}ms）：${netErr.message || netErr}`,
        '请求地址：' + url,
        '模型：' + c.model
      ];
      if (reachable) {
        // ⚠️ 只能说"最可能"：no-cors 探针能通只代表域名有响应，
        //    DNS 污染/网络劫持同样会让它误报（实测踩过），所以不把话说死。
        lines.push('诊断：域名有响应，但请求被浏览器拦下——**最可能是该网关未开放跨域（CORS）**。');
        lines.push('确认方法（免密钥，只做跨域预检）：');
        lines.push('  node tools/llm_check.mjs ' + (c.baseUrl || '<BaseURL>'));
      } else if (!aborted) {
        // 浏览器侧分不清"域名不可达"和"网关直接拒绝跨域请求"，别硬下结论——实测踩过：
        // 某个网关 Node 侧 HTTP 200 正常，但网页里 23ms 就失败，两者表现完全一样。
        lines.push('诊断：浏览器侧无法到达。常见原因有两个，**在网页里无法区分**：');
        lines.push('  ① 该网关不允许浏览器直连（CORS）——不少网关都这样（含 OpenAI 官方）；');
        lines.push('  ② Base URL 写错（多写/少写 /v1）或网络不通。');
      }
      lines.push('快速分辨（Node 侧不受跨域限制）：在项目目录执行');
      lines.push('  node tools/llm_check.mjs ' + (c.baseUrl || '<BaseURL>') + ' <APIKey> ' + (c.model || '<模型>'));
      lines.push('· 该命令能通 → 接口没问题，是跨域被拦：需要加一层转发（见 README「AI 接口设置」）；');
      lines.push('· 该命令也不通 → 是地址 / 密钥 / 模型名的问题。');
      throw new Error(lines.join('\n'));
    }

    const ms = Date.now() - t0;
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error([
        explainError(res.status, text).replace(/\n/g, ' '),
        '请求地址：' + url,
        '模型：' + c.model
      ].join('\n'));
    }

    let reply = '';
    try {
      const data = JSON.parse(text);
      const choice = (data.choices || [])[0] || {};
      reply = String((choice.message && choice.message.content) || choice.text || '').trim();
    } catch (e) { /* 网关返回非 JSON 也不影响"能连通"这个结论 */ }

    return { ok: true, ms, model: c.model, url, reply: reply.slice(0, 60) || '（空回复，但连接正常）' };
  }

  /** 列出可用模型（部分网关提供 /models；同样支持传入表单值） */
  async function listModels(override) {
    const c = Object.assign({}, cfg, override || {});
    let base = (c.baseUrl || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    if (!base) throw new Error('请先填写 Base URL。');
    const res = await fetch(base + '/models', { headers: { Authorization: 'Bearer ' + c.apiKey } });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error('无法获取模型列表（HTTP ' + res.status + '）：' + t.slice(0, 200)
        + '\n注：部分网关不提供 /models 接口，可手动填写模型名。');
    }
    const data = await res.json();
    return (data.data || []).map(m => m.id).sort();
  }

  return {
    load, save, get, ready, chat, chatJSON, test, listModels, extractJSON,
    list, active, use, add, remove, endpointOf, PRESETS
  };
})();
