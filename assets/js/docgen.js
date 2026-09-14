/* ==========================================================================
 * docgen.js — 解决方案文档生成引擎
 * 把「客户字段 + 前置条件 + 产品匹配 + AI 内容」渲染成一份自包含的单 HTML 文档。
 * 导出的 HTML 不依赖任何外部资源，可直接邮件发送 / 打印为 PDF。
 * ========================================================================== */
window.DocGen = (function () {

  const CSS = `
:root{--sm-blue:#0b4f9e;--sm-blue-d:#073b78;--sm-orange:#e8611c;--sm-ink:#1c2733;--sm-mute:#64748b;--sm-line:#dbe4ef;--sm-bg:#f5f8fc;}
*{box-sizing:border-box;}
body{margin:0;padding:0;background:#eef2f7;font-family:"Segoe UI","Microsoft YaHei",Helvetica,Arial,sans-serif;color:#1c2733;line-height:1.65;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.sm-doc{max-width:900px;margin:24px auto;background:#fff;box-shadow:0 6px 28px rgba(11,79,158,.12);}
.sm-doc *{box-sizing:border-box;}
.sm-top{background:linear-gradient(115deg,#0b4f9e 0%,#0a3f7d 55%,#e8611c 190%);color:#fff;padding:26px 34px 22px;}
.sm-brand{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;}
.sm-logo{font-size:27px;font-weight:800;letter-spacing:.5px;}
.sm-logo span{color:#ffd7bd;}
.sm-slogan{font-size:12.5px;opacity:.92;margin-top:4px;}
.sm-docno{font-size:12.5px;text-align:right;line-height:1.8;opacity:.95;}
.sm-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:6px 24px;padding:16px 34px;background:var(--sm-bg);border-bottom:1px solid var(--sm-line);font-size:13px;}
.sm-meta b{color:var(--sm-blue-d);font-weight:600;display:inline-block;min-width:64px;}
.sm-body{padding:10px 34px 30px;}
h1.sm-title{font-size:22px;margin:22px 0 6px;color:var(--sm-blue-d);line-height:1.45;}
h1.sm-title .zh{display:block;font-size:16px;color:#44546a;font-weight:600;margin-top:6px;}
.sm-lead{background:#f3f8ff;border-left:4px solid var(--sm-blue);padding:12px 16px;border-radius:0 6px 6px 0;margin:14px 0 6px;font-size:14px;}
h2.sm-h2{font-size:16px;margin:26px 0 10px;padding-bottom:7px;border-bottom:2px solid var(--sm-blue);color:var(--sm-blue-d);display:flex;align-items:center;gap:9px;}
h2.sm-h2 .n{display:inline-flex;align-items:center;justify-content:center;width:23px;height:23px;border-radius:5px;background:var(--sm-blue);color:#fff;font-size:13px;}
h3.sm-h3{font-size:14px;margin:16px 0 6px;color:#243b53;}
p{margin:7px 0;font-size:13.5px;}
ul{margin:7px 0 7px 20px;padding:0;}
li{margin:4px 0;font-size:13.5px;}
.langzh{color:#3d4c5c;}
.langzh:before{content:"中文 · ";color:var(--sm-orange);font-weight:600;font-size:11px;letter-spacing:.5px;}
.sm-en{color:#1c2733;}
table.sm-t{width:100%;border-collapse:collapse;margin:10px 0 4px;font-size:13px;}
table.sm-t th{background:var(--sm-blue);color:#fff;text-align:left;padding:8px 10px;font-weight:600;font-size:12.5px;}
table.sm-t td{padding:8px 10px;border-bottom:1px solid var(--sm-line);vertical-align:top;}
table.sm-t tr:nth-child(even) td{background:#fafcff;}
table.sm-t td.k{color:#38506b;width:38%;}
.sm-tag{display:inline-block;padding:1px 8px;border-radius:20px;font-size:11px;background:#e8f1fd;color:var(--sm-blue-d);margin-right:6px;}
.sm-note{font-size:12px;color:var(--sm-mute);margin-top:6px;}
.sm-box{border:1px solid var(--sm-line);border-radius:8px;padding:12px 16px;margin:12px 0;background:#fcfdff;}
.sm-box.warn{background:#fff8f3;border-color:#f6d3bd;}
.sm-box.ok{background:#f4fbf6;border-color:#cbe9d6;}
.sm-kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px 22px;}
.sm-kv div{font-size:13px;}
.sm-foot{margin-top:28px;padding:22px 34px;background:var(--sm-blue-d);color:#dce9f8;font-size:13px;}
.sm-foot b{color:#fff;}
.sm-foot .row{display:flex;gap:28px;flex-wrap:wrap;margin-top:8px;}
.sm-foot a{color:#ffd7bd;text-decoration:none;}
.sm-internal{border:1px dashed #d98b5c;background:#fffaf5;border-radius:8px;padding:12px 16px;margin:18px 0;font-size:13px;color:#8a4b22;}
.sm-internal h3{margin:0 0 6px;color:#a4491a;font-size:13.5px;}
@page{size:A4;margin:12mm;}
@media print{body{background:#fff;}.sm-doc{box-shadow:none;margin:0;max-width:none;}h2.sm-h2{page-break-after:avoid;}table.sm-t{page-break-inside:auto;}tr{page-break-inside:avoid;}.sm-top{-webkit-print-color-adjust:exact;}}
`;

  /* ----------------------------- 工具 ----------------------------- */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function arr(v) { return Array.isArray(v) ? v.filter(x => x !== undefined && x !== null && String(x).trim() !== '') : (v ? [v] : []); }
  function nonEmpty(v) { return v !== undefined && v !== null && String(v).trim() !== ''; }
  function today() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())}`;
  }
  function compactDate() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate());
  }

  /** 生成方案编号：客户缩写 2 字母 + YYMMDD + 2 位序号 */
  function makeNo(customerName, seq) {
    const letters = (String(customerName || 'SM').toUpperCase().match(/[A-Z]/g) || ['S', 'M']);
    const abbr = (letters.slice(0, 2).join('') || 'SM').padEnd(2, 'X');
    return abbr + compactDate() + String(seq || 1).padStart(2, '0');
  }

  /**
   * 由产品库直接生成规格表分组（纯确定性，绝不交给 LLM 编造数字）。
   * 分章生成模式下「关键规格参数」章节即由本函数产出。
   */
  function specGroupsFrom(products) {
    const seen = {};
    const groups = [];
    (products || []).forEach(p => {
      if (!p || seen[p.id]) return;
      seen[p.id] = 1;
      const rows = Object.keys(p.specs || {}).map(k => {
        const parts = k.split(' / ');
        const firstIsZh = /[\u4e00-\u9fff]/.test(parts[0]);
        return {
          k_zh: firstIsZh ? parts[0] : (parts[1] || parts[0]),
          k_en: firstIsZh ? (parts[1] || parts[0]) : parts[0],
          v: p.specs[k]
        };
      });
      if (rows.length) groups.push({ group_en: p.model + ' — ' + p.en, group_zh: p.model + ' — ' + p.zh, rows });
    });
    return groups;
  }

  /* --------------------- 内容归一化（AI 优先，本地兜底） --------------------- */
  function normalizeContent(state) {
    const ai = state.aiContent || {};
    const m = state.match || {};
    const fields = state.fields || {};
    const cfg = SM_CONFIG;

    // 产线 / 设备清单
    let lineItems = arr(ai.line_items);
    if (!lineItems.length) {
      lineItems = arr(m.line_config).map(x => ({
        model: x.model, name_en: x.note_en ? (x.model + '') : x.model, name_zh: '',
        qty: x.qty || '1', role_en: x.step || '', role_zh: x.note_zh || ''
      }));
      if (!lineItems.length) {
        lineItems = arr(m.matches).map(x => ({ model: x.model, qty: x.qty || '1', name_en: '', name_zh: '', role_en: x.reason_en, role_zh: x.reason_zh }));
      }
    }

    // 规格分组
    let specGroups = arr(ai.spec_groups);
    specGroups = specGroups.map(g => ({
      group_en: g.group_en || '', group_zh: g.group_zh || '',
      rows: arr(g.rows).map(r => ({ k_en: r.k_en || '', k_zh: r.k_zh || '', v: r.v || '' }))
    })).filter(g => g.rows.length);
    if (!specGroups.length) {
      const models = arr(m.matches).map(x => x.model);
      const prods = (state.selectedProducts && state.selectedProducts.length ? state.selectedProducts : [])
        .concat(SM_PRODUCTS.products.filter(p => models.indexOf(p.model) >= 0));
      specGroups = specGroupsFrom(prods);
    }

    // ROI
    const roiNumbers = (m.roi_estimate && m.roi_estimate.numbers) || Match.estimateRoi(state.rawInquiry, fields);
    const roiAi = (ai.roi && Object.keys(ai.roi).length) ? ai.roi : {};
    const roi = {
      numbers: roiNumbers,
      assumptions_en: arr(roiAi.assumptions_en).length ? roiAi.assumptions_en : roiNumbers.assumptions_en,
      assumptions_zh: arr(roiAi.assumptions_zh).length ? roiAi.assumptions_zh : roiNumbers.assumptions_zh,
      rows: arr(roiAi.rows).length ? roiAi.rows : Match.roiRows(roiNumbers),
      narrative_en: roiAi.narrative_en || '', narrative_zh: roiAi.narrative_zh || ''
    };

    const serviceEn = arr(ai.service_en).length ? ai.service_en : cfg.service.en;
    const serviceZh = arr(ai.service_zh).length ? ai.service_zh : cfg.service.zh;

    let confirmItems = arr(ai.confirm_items);
    if (!confirmItems.length) {
      const all = arr(state.checkpoints);
      const open = all.filter(c => !c.confirmed);   // 已被客户确认的不再列入「待确认」
      confirmItems = (open.length ? open : all).map(c => ({
        item_en: c.item_en, item_zh: c.item_zh, why_en: c.why_en, why_zh: c.why_zh
      }));
    }

    const custName = fields.customer_name || fields.customer_name_zh || 'Customer';
    const title_en = ai.title_en || `Auto Insertion Solution for ${custName}`;
    const title_zh = ai.title_zh || `${custName} 自动插件解决方案`;

    return {
      title_en, title_zh,
      summary_en: ai.summary_en || '',
      summary_zh: ai.summary_zh || '',
      understanding_en: arr(ai.understanding_en),
      understanding_zh: arr(ai.understanding_zh),
      solution_overview_en: ai.solution_overview_en || '',
      solution_overview_zh: ai.solution_overview_zh || '',
      line_items: lineItems,
      spec_groups: specGroups,
      roi,
      feeder_plan: arr(ai.feeder_plan).length ? ai.feeder_plan : arr(m.feeder_plan),
      service_en: serviceEn, service_zh: serviceZh,
      confirm_items: confirmItems,
      next_steps_en: arr(ai.next_steps_en).length ? ai.next_steps_en : [
        'Confirm the items listed in the checking list above.',
        'Provide component samples / datasheets for insertion trial test.',
        'We finalize the technical proposal, layout drawing and official quotation.'
      ],
      next_steps_zh: arr(ai.next_steps_zh).length ? ai.next_steps_zh : [
        '确认上表待确认事项。',
        '提供元件样品 / 规格书，安排插装打样测试。',
        '我方出具最终技术方案、布局图与正式报价。'
      ],
      internal_risks_en: arr(ai.internal_risks_en),
      internal_risks_zh: arr(ai.internal_risks_zh),
      why_us_en: cfg.anchors.why_us_en, why_us_zh: cfg.anchors.why_us_zh,
      cases_en: cfg.anchors.cases_en, cases_zh: cfg.anchors.cases_zh
    };
  }

  /* --------------------------- 渲染片段 --------------------------- */
  function bi(en, zh, mode) {
    let out = '';
    if (mode !== 'zh' && nonEmpty(en)) out += `<p class="sm-en">${esc(en)}</p>`;
    if (mode !== 'en' && nonEmpty(zh)) out += `<p class="langzh">${esc(zh)}</p>`;
    return out;
  }
  function biList(en, zh, mode, cls) {
    let out = '';
    const e = arr(en), z = arr(zh);
    if (mode !== 'zh' && e.length) out += `<ul class="${cls || 'sm-en'}">${e.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (mode !== 'en' && z.length) out += `<ul class="langzh">${z.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return out;
  }
  function tableHead(cells) { return `<tr>${cells.map(c => `<th>${esc(c)}</th>`).join('')}</tr>`; }

  /* --------------------------- 主渲染 --------------------------- */
  function render(state) {
    const c = state.content || normalizeContent(state);
    const mode = (state.doc && state.doc.language) || 'both';
    const doc = state.doc || {};
    const fields = state.fields || {};
    const cfg = SM_CONFIG.company;

    const docNo = doc.no || makeNo(fields.customer_name || fields.customer_name_zh, 1);
    const docDate = doc.date || today();
    const editor = doc.editor || SM_CONFIG.doc.editor;

    const parts = [];
    parts.push('<div class="sm-doc">');

    /* 页眉 */
    parts.push(`<div class="sm-top">
      <div class="sm-brand">
        <div>
          <div class="sm-logo">SMT<span>help</span></div>
          <div class="sm-slogan">${esc(cfg.en)} · ${esc(cfg.positioning)}</div>
        </div>
        <div class="sm-docno">
          <div><b>NO:</b> ${esc(docNo)}</div>
          <div><b>Date:</b> ${esc(docDate)}</div>
          <div><b>Validity:</b> ${esc(doc.validityDays || SM_CONFIG.doc.validityDays)} days</div>
        </div>
      </div>
    </div>`);

    /* 客户信息 */
    const metaRows = [
      ['TO / 客户', fields.customer_name || fields.customer_name_zh],
      ['Country / 国家', fields.country],
      ['Contact / 联系人', [fields.contact_person, fields.contact_title].filter(Boolean).join(' · ')],
      ['Email / 邮箱', fields.email],
      ['Inquiry No. / 询盘号', fields.inquiry_no],
      ['Edit / 编制', editor],
      ['Product / 产品', arr(fields.products_requested).join(' · ')]
    ].filter(r => nonEmpty(r[1]));
    parts.push(`<div class="sm-meta">${metaRows.map(r => `<div><b>${esc(r[0])}:</b> ${esc(r[1])}</div>`).join('')}</div>`);

    parts.push('<div class="sm-body">');

    /* 标题 + 摘要 */
    parts.push(`<h1 class="sm-title">${esc(c.title_en)}${mode !== 'en' && c.title_zh ? `<span class="zh">${esc(c.title_zh)}</span>` : ''}</h1>`);
    if (nonEmpty(c.summary_en) || nonEmpty(c.summary_zh)) {
      parts.push('<div class="sm-lead">' + bi(c.summary_en, c.summary_zh, mode) + '</div>');
    }

    let n = 0;
    const sec = (title_en, title_zh, inner) => {
      n++;
      const t = mode === 'zh' ? (title_zh || title_en) : title_en;
      const sub = (mode === 'both' && title_zh) ? `<span style="font-size:13px;color:#64748b;font-weight:500">/ ${title_zh}</span>` : '';
      return `<h2 class="sm-h2"><span class="n">${n}</span>${esc(t)} ${sub}</h2>${inner}`;
    };

    /* 1. 需求理解 */
    if (c.understanding_en.length || c.understanding_zh.length) {
      parts.push(sec('Our Understanding of Your Requirement', '需求理解', biList(c.understanding_en, c.understanding_zh, mode)));
    }

    /* 2. 方案概述 */
    if (nonEmpty(c.solution_overview_en) || nonEmpty(c.solution_overview_zh)) {
      parts.push(sec('Proposed Solution', '方案概述', bi(c.solution_overview_en, c.solution_overview_zh, mode)));
    }

    /* 3. 设备清单 */
    if (c.line_items.length) {
      const rows = c.line_items.map(it => `<tr>
        <td><b>${esc(it.model || '')}</b></td>
        <td>${esc(mode === 'zh' ? (it.name_zh || it.name_en || '') : (it.name_en || it.name_zh || ''))}</td>
        <td>${esc(it.qty || '')}</td>
        <td>${esc(mode === 'zh' ? (it.role_zh || it.role_en || '') : (it.role_en || it.role_zh || ''))}</td>
      </tr>`).join('');
      parts.push(sec('Equipment List', '设备清单',
        `<table class="sm-t">${tableHead(['Model / 型号', 'Description / 名称', 'Qty / 数量', 'Function / 作用'])}${rows}</table>
         <div class="sm-note">Quantity shown is our recommendation and will be finalized after confirmation of the checking list. / 数量为建议配置，待前置条件确认后最终确定。</div>`));
    }

    /* 4. 关键规格 */
    if (c.spec_groups.length) {
      let inner = '';
      c.spec_groups.forEach(g => {
        const title = mode === 'zh' ? (g.group_zh || g.group_en) : (g.group_en || g.group_zh);
        inner += `<h3 class="sm-h3">${esc(title)}</h3><table class="sm-t">` +
          g.rows.map(r => `<tr><td class="k">${esc(mode === 'zh' ? (r.k_zh || r.k_en) : (r.k_en || r.k_zh))}</td><td>${esc(r.v)}</td></tr>`).join('') +
          '</table>';
      });
      parts.push(sec('Key Specifications', '关键规格参数', inner));
    }

    /* 5. 供料配置 */
    if (c.feeder_plan.length) {
      const rows = c.feeder_plan.map(f => `<tr>
        <td>${esc(f.component || '')}</td>
        <td>${esc(f.packaging || '')}</td>
        <td><b>${esc(f.feeder_model || '')}</b></td>
        <td>${esc(f.qty || '')}</td>
        <td>${esc(mode === 'zh' ? (f.note_zh || f.note_en || '') : (f.note_en || f.note_zh || ''))}</td>
      </tr>`).join('');
      parts.push(sec('Feeding Configuration', '供料配置',
        `<table class="sm-t">${tableHead(['Component / 元件', 'Packaging / 包装', 'Feeder / 供料器', 'Qty / 数量', 'Note / 说明'])}${rows}</table>`));
    }

    /* 6. ROI */
    const roiOn = doc.includeRoi !== false;
    if (roiOn && (c.roi.rows.length || nonEmpty(c.roi.narrative_en))) {
      let inner = '';
      if (nonEmpty(c.roi.narrative_en) || nonEmpty(c.roi.narrative_zh)) inner += bi(c.roi.narrative_en, c.roi.narrative_zh, mode);
      if (c.roi.rows.length) {
        const rows = c.roi.rows.map(r => `<tr>
          <td>${esc(mode === 'zh' ? (r.item_zh || r.item_en) : (r.item_en || r.item_zh))}</td>
          <td>${esc(r.manual || '')}</td>
          <td>${esc(r.automatic || '')}</td>
          <td><b style="color:#0b7a3d">${esc(mode === 'zh' ? (r.benefit_zh || r.benefit_en || '') : (r.benefit_en || r.benefit_zh || ''))}</b></td>
        </tr>`).join('');
        inner += `<table class="sm-t">${tableHead(['Item / 项目', 'Manual / 手工', 'Automatic / 自动', 'Benefit / 收益'])}${rows}</table>`;
      }
      if (arr(c.roi.assumptions_en).length || arr(c.roi.assumptions_zh).length) {
        inner += `<div class="sm-box ok"><b>Assumptions / 测算前提</b>${biList(c.roi.assumptions_en, c.roi.assumptions_zh, mode)}</div>`;
      }
      if (c.roi.numbers && !c.roi.numbers.known) {
        inner += `<div class="sm-box warn">${bi(c.roi.numbers.note_en, c.roi.numbers.note_zh, mode)}</div>`;
      }
      parts.push(sec('Labor Saving & ROI Assessment', '人工节省与投资回报测算', inner));
    }

    /* 7. 待确认事项 */
    if (c.confirm_items.length) {
      const rows = c.confirm_items.map((it, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(mode === 'zh' ? (it.item_zh || it.item_en) : (it.item_en || it.item_zh))}</td>
        <td>${esc(mode === 'zh' ? (it.why_zh || it.why_en || '') : (it.why_en || it.why_zh || ''))}</td>
      </tr>`).join('');
      parts.push(sec('Items to Be Confirmed', '待确认事项',
        `<table class="sm-t">${tableHead(['#', 'Item / 事项', 'Why it matters / 为什么重要'])}${rows}</table>`));
    }

    /* 8. 下一步 */
    if (c.next_steps_en.length || c.next_steps_zh.length) {
      parts.push(sec('Next Steps', '下一步', biList(c.next_steps_en, c.next_steps_zh, mode)));
    }

    /* 9. 服务承诺 */
    parts.push(sec('Service & Support', '服务与支持',
      `<div class="sm-box"><b>Best After-sales Service / 最佳售后服务</b>${biList(c.service_en, c.service_zh, mode)}</div>`));

    /* 10. 为什么选择我们 */
    if (doc.includeCases !== false) {
      let inner = biList(c.why_us_en, c.why_us_zh, mode);
      inner += `<h3 class="sm-h3">${mode === 'zh' ? '成功案例' : 'Successful Cases / 成功案例'}</h3>` + biList(c.cases_en, c.cases_zh, mode);
      parts.push(sec('Why Southern Machinery', '为什么选择南方机械', inner));
    }

    /* 商务条款（默认关闭） */
    if (doc.includeCommercial && state.commercial) {
      const com = state.commercial;
      parts.push(sec('Commercial Terms', '商务条款',
        `<div class="sm-kv">${Object.keys(com).map(k => `<div><b>${esc(k)}:</b> ${esc(com[k])}</div>`).join('')}</div>`));
    }

    /* 内部风险（默认关闭，仅内部） */
    if (doc.includeRisks && (c.internal_risks_en.length || c.internal_risks_zh.length)) {
      parts.push(`<div class="sm-internal"><h3>INTERNAL ONLY — Do not send to customer / 内部信息，请勿发送给客户</h3>` +
        biList(c.internal_risks_en, c.internal_risks_zh, mode) + '</div>');
    }

    parts.push('</div>'); // sm-body

    /* 页脚 */
    const back = state.background || {};
    const bgLine = (doc.includeBackground && nonEmpty(back.company_profile_en))
      ? `<div style="margin-top:14px"><b>About ${esc(fields.customer_name || 'your company')}</b> / 关于贵司<br>${esc(back.company_profile_en)}</div>` : '';
    parts.push(`<div class="sm-foot">
      <b>Welcome to our factory in Shenzhen, China · Welcome Inquiry</b>
      <div class="row">
        <div>Website: ${esc(cfg.website)}<br>Email: ${esc(cfg.email)}<br>TEL: ${esc(cfg.tel)}</div>
        <div>Facebook: ${esc(cfg.facebook)}<br>LinkedIn: ${esc(cfg.linkedin)}<br>YouTube: ${esc(cfg.youtube)}</div>
        <div>Add: ${esc(cfg.address_en)}</div>
      </div>
      ${bgLine}
      <div style="margin-top:12px;font-size:12px;opacity:.85">Generated by SMThelp Pre-sales Solution Generator · ${esc(docDate)}</div>
    </div>`);

    parts.push('</div>');
    return parts.join('\n');
  }

  /** 生成完整单 HTML 文件 */
  function exportHtml(bodyHtml, meta) {
    const m = meta || {};
    const title = m.title || 'Solution';
    return `<!DOCTYPE html>
<html lang="${m.lang === 'zh' ? 'zh-CN' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="generator" content="SMThelp Pre-sales Solution Generator">
<style>${CSS}</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
  }

  /** 导出 Markdown（便于二次编辑 / 归档） */
  function toMarkdown(state) {
    const c = state.content || normalizeContent(state);
    const mode = (state.doc && state.doc.language) || 'both';
    const L = [];
    const dump = (en, zh) => {
      if (mode !== 'zh' && nonEmpty(en)) L.push(String(en));
      if (mode !== 'en' && nonEmpty(zh)) L.push('> ' + String(zh));
    };
    const dumpList = (en, zh) => arr(mode === 'zh' ? zh : en).forEach(x => L.push('- ' + x));

    L.push(`# ${c.title_en}`);
    if (mode !== 'en') L.push(`## ${c.title_zh}`);
    L.push('');
    dump(c.summary_en, c.summary_zh);
    if (c.understanding_en.length) { L.push('', '## Our Understanding of Your Requirement / 需求理解'); dumpList(c.understanding_en, c.understanding_zh); }
    if (nonEmpty(c.solution_overview_en)) { L.push('', '## Proposed Solution / 方案概述'); dump(c.solution_overview_en, c.solution_overview_zh); }
    if (c.line_items.length) {
      L.push('', '## Equipment List / 设备清单', '', '| Model | Description | Qty | Function |', '|---|---|---|---|');
      c.line_items.forEach(i => L.push(`| ${i.model || ''} | ${mode === 'zh' ? (i.name_zh || i.name_en) : (i.name_en || i.name_zh) || ''} | ${i.qty || ''} | ${mode === 'zh' ? (i.role_zh || i.role_en) : (i.role_en || i.role_zh) || ''} |`));
    }
    c.spec_groups.forEach(g => {
      L.push('', `## ${mode === 'zh' ? (g.group_zh || g.group_en) : (g.group_en || g.group_zh)}`, '', '| Parameter | Value |', '|---|---|');
      g.rows.forEach(r => L.push(`| ${mode === 'zh' ? (r.k_zh || r.k_en) : (r.k_en || r.k_zh)} | ${r.v} |`));
    });
    if (state.doc.includeRoi !== false && c.roi.rows.length) {
      L.push('', '## Labor Saving & ROI / 人工节省与 ROI', '', '| Item | Manual | Automatic | Benefit |', '|---|---|---|---|');
      c.roi.rows.forEach(r => L.push(`| ${mode === 'zh' ? (r.item_zh || r.item_en) : (r.item_en || r.item_zh)} | ${r.manual || ''} | ${r.automatic || ''} | ${mode === 'zh' ? (r.benefit_zh || r.benefit_en) : (r.benefit_en || r.benefit_zh) || ''} |`));
      L.push('');
      dumpList(c.roi.assumptions_en, c.roi.assumptions_zh);
    }
    if (c.confirm_items.length) {
      L.push('', '## Items to Be Confirmed / 待确认事项');
      c.confirm_items.forEach((it, i) => L.push(`${i + 1}. ${mode === 'zh' ? (it.item_zh || it.item_en) : (it.item_en || it.item_zh)}`));
    }
    if (c.next_steps_en.length) { L.push('', '## Next Steps / 下一步'); dumpList(c.next_steps_en, c.next_steps_zh); }
    L.push('', '## Service & Support / 服务与支持'); dumpList(c.service_en, c.service_zh);
    if (state.doc.includeCases !== false) { L.push('', '## Why Southern Machinery / 为什么选择我们'); dumpList(c.why_us_en, c.why_us_zh); }
    const cfg = SM_CONFIG.company;
    L.push('', '---', `Website: ${cfg.website} | Email: ${cfg.email} | TEL: ${cfg.tel}`, cfg.address_en);
    return L.join('\n');
  }

  /** 从 DOM 预览中提取纯文本，用于方案内容自检 */
  function textOf(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  return { CSS, render, normalizeContent, specGroupsFrom, exportHtml, toMarkdown, makeNo, textOf, esc };
})();
