/* ==========================================================================
 * knowledge.js — 知识库层
 *  1) 内置语料：window.SM_KB（126 份历史解决方案 / 报价 / 产品册全文转录）
 *  2) 用户导入：本地上传的 txt / md / json / csv / pdf（PDF 依赖在线 pdf.js）
 * 提供分词检索、命中片段抽取、LLM 上下文打包。
 * ========================================================================== */
window.KB = (function () {
  const USER_KEY = 'sm.kb.user';
  const USER_LIMIT = 2.5 * 1024 * 1024; // localStorage 安全上限

  const STOP = new Set(('the a an and or of for to in on at by with is are was were be been this that these those we you our your it its as from can could should would will shall not no if then than so such do does did have has had all any each other more most some only own same too very s t just now our out up down over under again further once here there when where why how what which who whom and but nor if then because while during before after above below off about into through between both few many much').split(/\s+/));

  let docs = [];      // 全量文档（内置 + 用户）
  let userDocs = [];  // 仅用户导入，便于持久化与删除

  function normalizeDoc(d) {
    return {
      id: d.id,
      title: d.title,
      category: d.category || '99-Other 其他',
      origin: d.origin || 'builtin',
      chars: d.chars || (d.text || '').length,
      snippet: d.snippet || (d.text || '').slice(0, 180),
      text: d.text || ''
    };
  }

  function init() {
    const builtin = (window.SM_KB && window.SM_KB.docs) || [];
    docs = builtin.map(d => normalizeDoc(Object.assign({}, d, { origin: 'builtin' })));
    loadUser();
    docs = docs.concat(userDocs);
    return stats();
  }

  function loadUser() {
    userDocs = [];
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw) userDocs = JSON.parse(raw).map(normalizeDoc);
    } catch (e) { userDocs = []; }
  }

  function persistUser() {
    const payload = JSON.stringify(userDocs);
    if (payload.length > USER_LIMIT) {
      // 超出浏览器存储上限：仅保留在内存中，本次会话可用
      try { localStorage.removeItem(USER_KEY); } catch (e) { /* ignore */ }
      throw new Error('导入内容超过浏览器本地存储上限（约 2.5MB），已仅在本次会话中可用；重启浏览器后需重新导入。');
    }
    try { localStorage.setItem(USER_KEY, payload); } catch (e) {
      throw new Error('浏览器本地存储写入失败（可能空间不足或处于隐私模式），导入内容仅在本次会话可用。');
    }
  }

  /* ----------------------------- 分词 ----------------------------- */
  function tokenize(text) {
    if (!text) return [];
    const out = [];
    const lower = String(text).toLowerCase();
    // 拉丁字母 / 数字词
    const latin = lower.match(/[a-z][a-z0-9._+-]{1,}/g) || [];
    latin.forEach(w => { if (!STOP.has(w) && w.length > 1) out.push(w); });
    // 中文：二元切分
    const cjkRuns = lower.match(/[\u4e00-\u9fff]+/g) || [];
    cjkRuns.forEach(run => {
      if (run.length === 1) { out.push(run); return; }
      for (let i = 0; i < run.length - 1; i++) out.push(run.slice(i, i + 2));
      if (run.length <= 4) out.push(run);
    });
    return Array.from(new Set(out));
  }

  function countOccurrences(haystack, needle) {
    let n = 0, idx = 0;
    while (n < 8) {
      const p = haystack.indexOf(needle, idx);
      if (p < 0) break;
      n++; idx = p + needle.length;
    }
    return n;
  }

  /* ----------------------------- 检索 ----------------------------- */
  /**
   * @param {string} query 检索词（可中英混排）
   * @param {object} [opts] { topK, category, minScore }
   * @returns {Array<{doc, score, hits:[{line,text}]}>}
   */
  function search(query, opts) {
    const o = Object.assign({ topK: 6, category: null, minScore: 1 }, opts || {});
    const terms = tokenize(query);
    if (!terms.length) return [];

    const results = [];
    for (const doc of docs) {
      if (o.category && doc.category !== o.category) continue;
      const title = (doc.title || '').toLowerCase();
      const snippet = (doc.snippet || '').toLowerCase();
      const body = (doc.text || '').toLowerCase();
      let score = 0;
      const matched = [];
      for (const term of terms) {
        if (title.indexOf(term) >= 0) { score += 12; matched.push(term); continue; }
        if (snippet.indexOf(term) >= 0) { score += 4; matched.push(term); continue; }
        const n = countOccurrences(body, term);
        if (n > 0) { score += 1 + Math.log(n); matched.push(term); }
      }
      if (score <= 0) continue;
      score = score / (1 + doc.chars / 30000);  // 轻微长度归一，避免长文天然占优
      if (score < o.minScore) continue;
      results.push({ doc, score, hits: extractHits(doc, matched) });
    }
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, o.topK);
  }

  function extractHits(doc, terms, maxHits) {
    const limit = maxHits || 4;
    const lines = (doc.text || '').split('\n');
    const hits = [];
    for (let i = 0; i < lines.length && hits.length < limit; i++) {
      const l = lines[i].toLowerCase();
      if (!l.trim()) continue;
      if (terms.some(t => l.indexOf(t) >= 0)) {
        hits.push({ line: i + 1, text: lines[i].trim().slice(0, 260) });
      }
    }
    return hits;
  }

  /** 打包为 LLM 上下文，控制总长度 */
  function buildContext(results, maxChars) {
    const budget = maxChars || 9000;
    let used = 0, out = [];
    for (const r of results) {
      const head = `### ${r.doc.title}  [${r.doc.category}]`;
      const bodyParts = [];
      if (r.hits.length) {
        r.hits.forEach(h => bodyParts.push(`L${h.line}: ${h.text}`));
      } else if (r.doc.snippet) {
        bodyParts.push(r.doc.snippet);
      }
      let body = bodyParts.join('\n');
      const remain = budget - used - head.length;
      if (remain < 200) break;
      if (body.length > remain) body = body.slice(0, remain) + ' …';
      out.push(head + '\n' + body);
      used += head.length + body.length;
    }
    return out.join('\n\n');
  }

  /** 按产品型号找历史方案依据 */
  function docsForModel(model) {
    const key = String(model || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!key) return [];
    return docs.filter(d => (d.title + ' ' + d.text).toLowerCase().replace(/[^a-z0-9]/g, '').indexOf(key) >= 0)
               .sort((a, b) => b.chars - a.chars)
               .slice(0, 8);
  }

  /* ----------------------------- 增删 ----------------------------- */
  function addDoc(doc) {
    const nd = normalizeDoc(Object.assign({ origin: 'user' }, doc));
    nd.id = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    userDocs.push(nd);
    docs.push(nd);
    let warning = '';
    try { persistUser(); } catch (e) { warning = e.message; }
    return { doc: nd, warning };
  }

  function removeDoc(id) {
    userDocs = userDocs.filter(d => d.id !== id);
    docs = docs.filter(d => d.id !== id);
    try { persistUser(); } catch (e) { /* ignore */ }
  }

  function clearUser() {
    userDocs = [];
    docs = docs.filter(d => d.origin !== 'user');
    try { localStorage.removeItem(USER_KEY); } catch (e) { /* ignore */ }
  }

  /* ----------------------------- 导入 ----------------------------- */
  function readAsText(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => reject(new Error('读取失败：' + file.name));
      fr.readAsText(file, 'utf-8');
    });
  }

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      s.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        } else reject(new Error('pdf.js 加载失败'));
      };
      s.onerror = () => reject(new Error('无法加载 PDF 解析库（需要联网访问 CDN）。可先把 PDF 转成 txt 再导入。'));
      document.head.appendChild(s);
    });
  }

  async function readPdfText(file) {
    const pdfjs = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const parts = [];
    const pages = Math.min(pdf.numPages, 80);
    for (let p = 1; p <= pages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const line = content.items.map(it => it.str).join(' ');
      parts.push(`--- p${p} ---\n${line}`);
    }
    if (pdf.numPages > pages) parts.push(`… 仅解析前 ${pages} 页（共 ${pdf.numPages} 页）`);
    return parts.join('\n');
  }

  function stripMdNoise(text) {
    return String(text)
      .split('\n')
      .filter(l => !/^https?:\/\/lh3\.googleusercontent\.com/i.test(l))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * 导入本地文件（支持多选）
   * @returns {Promise<{added:Array, skipped:Array, warnings:Array}>}
   */
  async function ingestFiles(fileList, onProgress) {
    const added = [], skipped = [], warnings = [];
    const files = Array.from(fileList || []);
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (onProgress) onProgress({ index: i + 1, total: files.length, name: f.name });
      try {
        let text = '';
        if (['txt', 'md', 'markdown', 'csv', 'json', 'log', 'html', 'htm'].indexOf(ext) >= 0) {
          text = await readAsText(f);
        } else if (ext === 'pdf') {
          text = await readPdfText(f);
        } else if (['pptx', 'ppt', 'docx', 'doc', 'xlsx'].indexOf(ext) >= 0) {
          skipped.push({ name: f.name, reason: '浏览器无法直接解析 Office 文件，请先导出为 PDF 或 txt 后导入' });
          continue;
        } else {
          text = await readAsText(f);
        }
        text = stripMdNoise(text);
        if (text.replace(/\s/g, '').length < 40) {
          skipped.push({ name: f.name, reason: '未提取到有效文本（可能是纯图片扫描件，需先 OCR）' });
          continue;
        }
        const title = f.name.replace(/\.[^.]+$/, '');
        const res = addDoc({
          title,
          category: '99-Other 其他',
          snippet: text.replace(/\s+/g, ' ').slice(0, 180),
          chars: text.length,
          text
        });
        if (res.warning) warnings.push(res.warning);
        added.push({ name: f.name, chars: text.length });
      } catch (err) {
        skipped.push({ name: f.name, reason: (err && err.message) || String(err) });
      }
    }
    return { added, skipped, warnings: Array.from(new Set(warnings)) };
  }

  function stats() {
    const cats = {};
    docs.forEach(d => { cats[d.category] = (cats[d.category] || 0) + 1; });
    return {
      total: docs.length,
      builtin: docs.filter(d => d.origin === 'builtin').length,
      remote: docs.filter(d => d.origin === 'remote').length,
      user: docs.filter(d => d.origin === 'user').length,
      chars: docs.reduce((s, d) => s + (d.chars || 0), 0),
      categories: cats,
      generatedAt: (window.SM_KB && window.SM_KB.generatedAt) || ''
    };
  }

  function allDocs() { return docs; }

  /**
   * 用服务端资料库（Supabase，受 RLS 三重门禁保护）替换内置语料。
   * 用户手工导入的文档保留，便于与远端语料叠加使用。
   */
  function loadRemote(remoteDocs) {
    const remote = (remoteDocs || []).map(d =>
      normalizeDoc(Object.assign({ origin: 'remote' }, d, { id: 'remote-' + (d.id || d.title) })));
    docs = docs.filter(d => d.origin === 'user').concat(remote);
    return stats();
  }

  return {
    init, search, buildContext, docsForModel, addDoc, removeDoc, clearUser,
    ingestFiles, stats, allDocs, tokenize, loadRemote
  };
})();
