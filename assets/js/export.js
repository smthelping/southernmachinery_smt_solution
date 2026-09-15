/* ==========================================================================
 * export.js — 导出：单 HTML / Markdown / 打印 / 复制
 * ========================================================================== */
window.Exporter = (function () {

  function safeName(s) {
    return String(s || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_').slice(0, 80);
  }

  function timestamp() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }

  function filename(state, ext) {
    const f = state.fields || {};
    const cust = f.customer_name || f.customer_name_zh || 'Customer';
    const model = (state.match && state.match.matches && state.match.matches[0] && state.match.matches[0].model) || 'Solution';
    return `Solution_${safeName(cust)}_${safeName(model)}_${timestamp()}.${ext}`;
  }

  function download(filename, content, mime) {
    const binary = /^(application\/pdf|application\/octet-stream|image\/)/.test(mime || '');
    const blob = new Blob([content], { type: (mime || 'text/plain') + (binary ? '' : ';charset=utf-8') });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
  }

  /** 导出单 HTML 方案（使用预览区中的最终内容，保留人工修改） */
  function html(state, bodyHtml) {
    const body = bodyHtml || state.previewHtml || DocGen.render(state);
    const full = DocGen.exportHtml(body, {
      title: (state.fields && (state.fields.customer_name || state.fields.customer_name_zh)) || 'Solution',
      lang: state.doc.language === 'zh' ? 'zh' : 'en'
    });
    download(filename(state, 'html'), full, 'text/html');
    return full;
  }

  function markdown(state) {
    const md = DocGen.toMarkdown(state);
    download(filename(state, 'md'), md, 'text/markdown');
    return md;
  }

  function draft(state) {
    download(`Draft_${safeName((state.fields && state.fields.customer_name) || 'SM')}_${timestamp()}.json`,
      JSON.stringify(state, null, 2), 'application/json');
  }

  /** 取承载方案文档的 iframe（app.js 传预览 iframe；未传则按 id 兜底查找） */
  function frameOf(el) {
    if (el && el.contentDocument) return el;
    return document.getElementById('docFrame') || null;
  }

  /**
   * 导出 PDF（矢量文字，质量最好）：直接打印预览 iframe。
   * 用 iframe 而非 window.open —— 避免被弹窗拦截，且打印内容与预览区（含手工修改）完全一致。
   */
  function printDoc(frameEl) {
    const frame = frameOf(frameEl);
    const w = frame && frame.contentWindow;
    if (!w) { window.print(); return false; }        // 兜底：打印主页面
    try {
      w.focus();
      w.print();
      return true;
    } catch (e) {
      window.print();
      return false;
    }
  }

  /** 按需从 CDN 加载 html2pdf（离线/被拦截时抛错，由调用方降级到打印方式） */
  function loadHtml2Pdf() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js';
      s.onload = () => window.html2pdf
        ? resolve(window.html2pdf)
        : reject(new Error('PDF 生成库加载后不可用'));
      s.onerror = () => reject(new Error('无法加载 PDF 生成库（需要联网访问 CDN）'));
      document.head.appendChild(s);
    });
  }

  /**
   * 一键下载 PDF（图片版）：无弹窗、无对话框，直接落盘。
   * 代价是文字不可选中、文件较大、中文以图像呈现 —— 需要可编辑/可检索的 PDF 请用 printDoc()。
   */
  async function pdf(frameEl, name) {
    const frame = frameOf(frameEl);
    const doc = frame && frame.contentDocument;
    const target = (doc && (doc.querySelector('.sm-doc') || doc.body)) || document.body;
    const h2p = await loadHtml2Pdf();
    const blob = await h2p().set({
      margin: [8, 8, 10, 8],
      filename: name || 'Solution.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 794 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).from(target).outputPdf('blob');
    download(name || 'Solution.pdf', blob, 'application/pdf');
    return blob;
  }

  function htmlToPlainText(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.innerText || tmp.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    }
  }

  return {
    download, html, markdown, draft, copyText, htmlToPlainText, filename, safeName,
    print: printDoc, printDoc, pdf
  };
})();
