/* ==========================================================================
 * store.js — 会话状态与草稿持久化
 * 注意：API Key 不在此处保存（由 llm.js 单独管理）。
 * ========================================================================== */
window.Store = (function () {
  const KEY = 'sm.state.v1';
  const LIMIT = 1.5 * 1024 * 1024;

  function defaults() {
    return {
      version: 1,
      updatedAt: '',
      step: 'inquiry',
      rawInquiry: '',
      fields: null,
      checkpoints: [],
      checklistMeta: {},
      background: null,
      backgroundNotes: '',
      match: null,
      candidates: [],
      selectedModels: [],
      selectedProducts: [],
      content: null,
      aiContent: null,
      validation: null,
      sectioned: null,           // 分章生成的检查点（parts / done / errors）
      newProduct: null,
      kbMatchHits: [],
      previewHtml: '',
      previewDirty: false,
      previewEdited: false,
      doc: Object.assign({}, SM_CONFIG.doc, {
        no: '',
        date: '',
        includeBackground: false
      }),
      commercial: {
        'Price / 价格': '',
        'Payment / 付款方式': '',
        'Delivery / 交期': '',
        'Incoterms / 贸易条款': '',
        'Warranty / 质保': '12 months'
      }
    };
  }

  let state = defaults();
  const listeners = [];

  function get() { return state; }

  function set(patch, opts) {
    state = Object.assign({}, state, patch);
    if (!opts || opts.notify !== false) listeners.forEach(fn => { try { fn(state); } catch (e) { /* ignore */ } });
    return state;
  }

  function subscribe(fn) { listeners.push(fn); }

  function saveDraft() {
    state.updatedAt = new Date().toISOString();
    const payload = JSON.stringify(state);
    if (payload.length > LIMIT) return { ok: false, message: '草稿过大（含预览内容），本次未自动保存。' };
    try {
      localStorage.setItem(KEY, payload);
      return { ok: true, at: state.updatedAt };
    } catch (e) {
      return { ok: false, message: '草稿保存失败：' + e.message };
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      state = Object.assign(defaults(), data, { doc: Object.assign(defaults().doc, data.doc || {}) });
      return state;
    } catch (e) { return null; }
  }

  function clearDraft() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    state = defaults();
    listeners.forEach(fn => { try { fn(state); } catch (e) { /* ignore */ } });
  }

  function hasDraft() { return !!localStorage.getItem(KEY); }

  function draftInfo() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return {
        updatedAt: d.updatedAt,
        customer: (d.fields && (d.fields.customer_name || d.fields.customer_name_zh)) || '',
        step: d.step
      };
    } catch (e) { return null; }
  }

  return { get, set, subscribe, saveDraft, loadDraft, clearDraft, hasDraft, draftInfo, defaults };
})();
