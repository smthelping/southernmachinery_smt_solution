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
    const blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
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

  /** 打印 / 另存为 PDF */
  function print(bodyHtml, title) {
    const full = DocGen.exportHtml(bodyHtml, { title: title || 'Solution', lang: 'en' });
    const w = window.open('', '_blank');
    if (!w) { alert('浏览器阻止了弹出窗口，请允许弹窗后重试，或直接使用「导出单 HTML」。'); return; }
    w.document.open();
    w.document.write(full);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
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

  return { download, html, markdown, draft, print, copyText, htmlToPlainText, filename, safeName };
})();
