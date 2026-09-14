/* ==========================================================================
 * llm.js — OpenAI 兼容接口客户端
 * 支持任意 OpenAI Chat Completions 兼容网关（OpenAI / DeepSeek / Azure / 本地
 * Ollama、vLLM、One-API 等），密钥仅保存在浏览器 localStorage。
 * ========================================================================== */
window.LLM = (function () {
  const STORE_KEY = 'sm.llm.cfg';

  let cfg = Object.assign({}, SM_CONFIG.llm);

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) cfg = Object.assign(cfg, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return cfg;
  }
  function save(patch) {
    cfg = Object.assign(cfg, patch || {});
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cfg)); } catch (e) { /* ignore */ }
    return cfg;
  }
  function get() { return cfg; }
  function ready() { return !!(cfg.baseUrl && cfg.model && cfg.apiKey); }

  function endpoint() {
    let base = (cfg.baseUrl || '').trim().replace(/\/+$/, '');
    if (!/\/chat\/completions$/.test(base)) base += '/chat/completions';
    return base;
  }

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

  /** 连接测试：发一条极小请求 */
  async function test() {
    const t0 = Date.now();
    const out = await chat({
      messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      temperature: 0,
      maxTokens: 16
    });
    return { ok: true, ms: Date.now() - t0, reply: out.trim().slice(0, 60), model: cfg.model };
  }

  /** 列出可用模型（部分网关支持 /models） */
  async function listModels() {
    let base = (cfg.baseUrl || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '');
    const res = await fetch(base + '/models', { headers: { Authorization: 'Bearer ' + cfg.apiKey } });
    if (!res.ok) throw new Error('无法获取模型列表（HTTP ' + res.status + '）');
    const data = await res.json();
    return (data.data || []).map(m => m.id).sort();
  }

  return { load, save, get, ready, chat, chatJSON, test, listModels, extractJSON };
})();
