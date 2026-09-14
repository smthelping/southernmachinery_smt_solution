/* ==========================================================================
 * validate.js — LLM 输出契约校验 + 数字溯源 + 导出前检查
 *
 * 设计原则（借鉴开源项目 ai-proposal-generator 的 "LLM writes prose, code owns
 * every number"，并针对本书面资料库的合规要求加强）：
 *   1) 型号白名单：AI 只允许使用产品库中存在的机型，禁止编造型号；
 *   2) 参数溯源：规格值必须能在该机型的产品库条目中找到；
 *   3) 数字溯源：正文/表格中的数字必须能在「客户输入 + 产品库 + 本地 ROI 测算 +
 *      公司公开资料」中找到出处，否则视为凭空生成；
 *   4) 能确定性修复的（越界型号、无法溯源的规格行）就地修复并记录；
 *      不能修复的（正文里的凭空数字）如实上报，由人工处理 —— Fail-Soft。
 * ========================================================================== */
window.Validate = (function () {

  const NUM_RE = /\d[\d,]*(?:\.\d+)?/g;
  /* 型号样式：S-7040 / S7040 / RF1000 / AF2000 / VF3000 / TF4000 / SLD250 / TR-990 … */
  const MODEL_RE = /\b(?:S|RF|AF|VF|TF|TR|SLD|SULD|SBT|SFT|SAGV)[-‐]?\d{3,4}[A-Z]{0,3}\b/gi;

  /* ------------------------------ 数字工具 ------------------------------ */
  function canon(tok) { return String(tok).replace(/,/g, '').trim(); }

  function numbersIn(text) {
    const out = [];
    const m = String(text === undefined || text === null ? '' : text).match(NUM_RE);
    if (m) m.forEach(t => out.push(canon(t)));
    return out;
  }

  function numSet(text) {
    const s = new Set();
    numbersIn(text).forEach(n => s.add(n));
    return s;
  }

  /** 有效数字判定：带小数点的、或 ≥3 位整数的，视为「事实性数字」；1~99 的整数只报警告 */
  function isSignificant(tok) {
    if (tok.indexOf('.') >= 0) return true;
    return tok.replace(/[^0-9]/g, '').length >= 3;
  }

  /** 递归收集 JSON 中所有字符串，附带路径 */
  function walkStrings(value, path, cb) {
    if (value === null || value === undefined) return;
    if (typeof value === 'string') { cb(value, path); return; }
    if (typeof value === 'number' || typeof value === 'boolean') { cb(String(value), path); return; }
    if (Array.isArray(value)) { value.forEach((v, i) => walkStrings(v, path + '[' + i + ']', cb)); return; }
    if (typeof value === 'object') {
      Object.keys(value).forEach(k => walkStrings(value[k], path + '.' + k, cb));
    }
  }

  function snippetAround(text, token, pad) {
    const p = String(text).indexOf(token);
    if (p < 0) return String(text).slice(0, 80);
    const s = Math.max(0, p - (pad || 26));
    return (s > 0 ? '…' : '') + String(text).slice(s, p + token.length + (pad || 26)) + '…';
  }

  /* ------------------------------ 可溯源语料 ------------------------------ */
  /**
   * 汇总「允许出现的数字」的全部出处。
   * @param {object} state 会话状态
   */
  function sourcesText(state) {
    const parts = [];
    const push = v => { if (v !== undefined && v !== null) parts.push(typeof v === 'string' ? v : JSON.stringify(v)); };

    push(state.rawInquiry);                       // 客户原文（客户自己给的数量、板卡尺寸等）
    push(state.fields);                           // 结构化字段
    push(state.checkpoints);                      // 前置条件清单（含已知值）
    push(state.match);                            // 匹配结果与本地 ROI 测算
    push(state.selectedProducts);                 // 已选机型的全部参数
    push(state.background);                       // 背调结论（客户规模等）
    push(state.commercial);                       // 商务条款（用户手填才存在）
    push(SM_CONFIG.company);                      // 公司与联系方式（电话、传真、地址门牌等）
    push(SM_CONFIG.service);
    push(SM_CONFIG.anchors);                      // 公开话术锚点（20 yrs+、$50~70K、7x24 等）
    push(SM_CONFIG.doc);                          // 文档默认设置（有效期天数等）
    push(state.doc);                              // 本次文档设置（编号、日期、编制人、有效期）
    // 文档在 date / no 为空时会回退到「今天」与自动编号，这里同步纳入白名单
    const now = new Date();
    const p2 = n => String(n).padStart(2, '0');
    parts.push(`${now.getFullYear()}/${p2(now.getMonth() + 1)}/${p2(now.getDate())}`);
    if (window.DocGen && DocGen.makeNo) {
      try {
        const f = state.fields || {};
        parts.push(DocGen.makeNo(f.customer_name || f.customer_name_zh, 1));
      } catch (e) { /* ignore */ }
    }
    push(Match.metrics());                        // 本地测算口径常数
    return parts.join('\n');
  }

  /**
   * 数字溯源检查
   * @returns {{errors:Array, warnings:Array, allowed:number}}
   */
  function traceNumbers(value, allowedText, label) {
    const allowed = numSet(allowedText);
    const errors = [], warnings = [], seen = {};
    walkStrings(value, label || 'content', (str, path) => {
      numbersIn(str).forEach(n => {
        if (allowed.has(n)) return;
        const key = n + '@' + path;
        if (seen[key]) return;
        seen[key] = 1;
        const item = { number: n, path, context: snippetAround(str, n) };
        (isSignificant(n) ? errors : warnings).push(item);
      });
    });
    return { errors, warnings, allowed: allowed.size };
  }

  /* ------------------------------ 型号白名单 ------------------------------ */
  /**
   * 把型号字符串拆成可比较的键。
   * 产品库中不少条目是「组合型号」，如 "SLD250 / SULD250"、"S-1200 / S-1200SV"，
   * 需要拆成单个型号分别入表，否则 AI 只写其中一个会被误判为编造型号。
   */
  function modelKeys(model) {
    const out = [];
    String(model || '').split(/[\/,、;]|\s+/).forEach(part => {
      const k = part.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (k && /\d/.test(k)) out.push(k);
    });
    if (!out.length) {
      // 少数条目没有数字型号（如 "Conformal Coating AOI"），退化为整串比对
      const whole = String(model || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (whole) out.push(whole);
    }
    return out;
  }

  function catalogueModels() {
    const set = new Set();
    (SM_PRODUCTS.products || []).forEach(p => {
      modelKeys(p.model).forEach(k => set.add(k));
      (p.aliases || []).forEach(a => {
        if (/\d/.test(a)) modelKeys(a).forEach(k => set.add(k));
      });
    });
    return set;
  }

  function normalizeModel(m) {
    const keys = modelKeys(m);
    return keys.length ? keys[0] : String(m || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /** 型号是否命中白名单（组合型号任一组成部分命中即可） */
  function isKnownModel(model, known) {
    const keys = modelKeys(model);
    if (!keys.length) return false;
    return keys.some(k => known.has(k));
  }

  /** 型号是否属于本次已选机型 */
  function isAllowedModel(model, allowedKeys) {
    const keys = modelKeys(model);
    if (!keys.length) return false;
    return keys.some(k => allowedKeys.indexOf(k) >= 0);
  }

  function unknownModels(value) {
    const known = catalogueModels();
    const found = {}, out = [];
    walkStrings(value, 'content', (str, path) => {
      const m = str.match(MODEL_RE);
      if (!m) return;
      m.forEach(tok => {
        const key = tok.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (found[key]) return;
        found[key] = 1;
        if (!isKnownModel(tok, known)) out.push({ model: tok, path, context: snippetAround(str, tok) });
      });
    });
    return out;
  }

  /* ------------------------------ 规格行溯源 ------------------------------ */
  function productSpecText(products) {
    return products.map(p => JSON.stringify(p.specs || {}) + ' ' + (p.summary_en || '') + ' ' + (p.summary_zh || '') + ' ' +
      (p.highlights_en || []).join(' ') + ' ' + (p.highlights_zh || []).join(' ')).join('\n');
  }

  /* ------------------------------ 主校验入口 ------------------------------ */
  /**
   * 校验 AI 返回的方案内容。
   * @param {object} state 会话状态（fields / selectedProducts / match / rawInquiry …）
   * @param {object} ai    LLM 返回的 JSON
   * @returns {{ok:boolean, errors:Array, warnings:Array, fixes:Array, content:object}}
   */
  function contract(state, ai) {
    const errors = [], warnings = [], fixes = [];
    const content = JSON.parse(JSON.stringify(ai || {}));

    /* --- 0. 结构检查 --- */
    const need = ['line_items', 'spec_groups', 'roi', 'confirm_items'];
    need.forEach(k => {
      if (content[k] === undefined) warnings.push({ kind: 'structure', message: `缺少字段 ${k}，已按空值处理` });
    });
    ['line_items', 'spec_groups', 'roi', 'confirm_items', 'feeder_plan'].forEach(k => {
      if (content[k] !== undefined && !Array.isArray(content[k]) && typeof content[k] !== 'object') {
        warnings.push({ kind: 'structure', message: `${k} 结构异常，已忽略` });
        content[k] = Array.isArray(content[k]) ? content[k] : (k === 'roi' ? {} : []);
      }
    });

    /* --- 1. 型号白名单 --- */
    const known = catalogueModels();
    const allowedProducts = (state.selectedProducts && state.selectedProducts.length)
      ? state.selectedProducts
      : (SM_PRODUCTS.products || []).filter(p => ((state.match && state.match.matches) || []).map(m => m.model).indexOf(p.model) >= 0);
    const allowedModels = [];
    allowedProducts.forEach(p => modelKeys(p.model).forEach(k => allowedModels.push(k)));

    if (Array.isArray(content.line_items)) {
      const kept = [];
      content.line_items.forEach(it => {
        const model = it && it.model;
        if (!model) return;
        if (isKnownModel(model, known)) {
          kept.push(it);
          if (allowedModels.length && !isAllowedModel(model, allowedModels)) {
            warnings.push({ kind: 'model', message: `AI 额外补充了未勾选机型 ${model}（已保留，请确认是否需要）` });
          }
        } else {
          errors.push({ kind: 'model', message: `AI 使用了产品库中不存在的型号 ${model}`, fix: '已剔除该行' });
          fixes.push(`剔除非产品库型号：${model}`);
        }
      });
      content.line_items = kept;
      // 已勾选但 AI 漏写的机型：按产品库补齐
      allowedProducts.forEach(p => {
        const keys = modelKeys(p.model);
        if (!content.line_items.some(it => isAllowedModel(it.model, keys))) {
          content.line_items.push({
            model: p.model, name_en: p.en, name_zh: p.zh,
            qty: '1', role_en: p.summary_en, role_zh: p.summary_zh
          });
          fixes.push(`补齐 AI 漏写的机型：${p.model}`);
        }
      });
    }

    if (Array.isArray(content.feeder_plan)) {
      content.feeder_plan.forEach(f => {
        const fm = f && f.feeder_model;
        if (fm && !isKnownModel(fm, known) && !/^(TBC|TBD|待确认)$/i.test(String(fm).trim())) {
          errors.push({ kind: 'model', message: `供料方案引用了不存在的型号 ${f.feeder_model}`, fix: '已改为 TBC 待确认' });
          fixes.push(`供料器型号 ${f.feeder_model} → TBC`);
          f.feeder_model = 'TBC';
        }
      });
    }

    const bogus = unknownModels(content);
    if (bogus.length) {
      bogus.forEach(b => errors.push({
        kind: 'model',
        message: `正文出现产品库之外的型号 ${b.model}`,
        context: b.context
      }));
    }

    /* --- 2. 规格行溯源 --- */
    if (Array.isArray(content.spec_groups)) {
      const groups = [];
      content.spec_groups.forEach(g => {
        if (!g || !Array.isArray(g.rows)) return;
        const title = String(g.group_en || g.group_zh || '');
        const hit = allowedProducts.find(p => normalizeModel(p.model) && title.toUpperCase().indexOf(p.model.toUpperCase()) >= 0);
        const allowed = hit ? numSet(productSpecText([hit])) : numSet(productSpecText(allowedProducts));
        const rows = [];
        g.rows.forEach(r => {
          if (!r) return;
          const nums = numbersIn(r.v);
          const bad = nums.filter(n => !allowed.has(n));
          if (bad.length) {
            // 尝试用产品库中的同名参数替换
            let replaced = false;
            if (hit && r.k_en) {
              const keys = Object.keys(hit.specs || {});
              const matchKey = keys.find(k => {
                const kl = k.toLowerCase();
                const target = String(r.k_en).toLowerCase();
                return kl.indexOf(target) >= 0 || target.indexOf(kl) >= 0 ||
                  kl.split(' / ').some(x => target.indexOf(x.trim()) >= 0 && x.trim().length > 3);
              });
              if (matchKey) {
                errors.push({ kind: 'spec', message: `${hit.model} 的「${r.k_en}」数值 ${bad.join(', ')} 无法在产品库中溯源`, fix: '已替换为产品库原文数值' });
                fixes.push(`${hit.model} ${r.k_en}：${r.v} → ${hit.specs[matchKey]}`);
                r.v = hit.specs[matchKey];
                replaced = true;
              }
            }
            if (!replaced) {
              errors.push({ kind: 'spec', message: `${title || '规格表'} 中「${r.k_en || r.k_zh}」的数值 ${bad.join(', ')} 无法溯源，且产品库无同名参数`, fix: '已删除该行' });
              fixes.push(`删除无法溯源的规格行：${r.k_en || r.k_zh}`);
              return;
            }
          }
          rows.push(r);
        });
        if (rows.length) groups.push({ group_en: g.group_en, group_zh: g.group_zh, rows });
        else fixes.push(`删除空规格分组：${title}`);
      });
      content.spec_groups = groups;
    }

    /* --- 3. 数字溯源（正文与表格全文） --- */
    const allowedText = sourcesText(state) + '\n' + productSpecText(allowedProducts);
    const traced = traceNumbers(content, allowedText, 'content');
    traced.errors.forEach(e => errors.push({
      kind: 'number',
      message: `数字 ${e.number} 无法在客户输入 / 产品库 / 本地测算中找到出处`,
      context: e.context, path: e.path, number: e.number
    }));
    traced.warnings.forEach(w => warnings.push({
      kind: 'number-soft',
      message: `小整数 ${w.number} 未溯源（可能为序号或近似表达，请人工确认）`,
      context: w.context, path: w.path, number: w.number
    }));

    return {
      ok: errors.length === 0,
      errors, warnings, fixes,
      content,
      stats: {
        lineItems: (content.line_items || []).length,
        specGroups: (content.spec_groups || []).length,
        errorCount: errors.length,
        warningCount: warnings.length,
        fixCount: fixes.length
      }
    };
  }

  /* ------------------------------ 导出前检查 ------------------------------ */
  /**
   * 对即将导出的成品 HTML 做最后检查（渲染后校验）。
   * @param {string} html 预览区的最终 HTML
   * @param {object} state 会话状态
   */
  function exportCheck(html, state) {
    const errors = [], warnings = [], fixes = [];
    const body = String(html || '');

    if (body.length < 1500) errors.push({ kind: 'render', message: `文档内容过短（${body.length} 字符），可能渲染失败` });
    if (body.indexOf('sm-doc') < 0) errors.push({ kind: 'render', message: '未找到文档主体结构（.sm-doc），预览可能未生成' });

    ['undefined', 'NaN', '[object Object]', '&lt;%', '{{'].forEach(bad => {
      if (body.indexOf(bad) >= 0) errors.push({ kind: 'render', message: `文档中出现未替换的占位/异常值：${bad}` });
    });

    const sections = (body.match(/class="sm-h2"/g) || []).length;
    if (sections < 4) warnings.push({ kind: 'render', message: `文档章节仅 ${sections} 个，建议检查是否缺少内容` });

    const f = state.fields || {};
    const cust = f.customer_name || f.customer_name_zh;
    if (cust && body.indexOf(String(cust).slice(0, 10)) < 0) {
      warnings.push({ kind: 'render', message: `文档中未出现客户名称「${cust}」，请确认已正确带出` });
    }
    if (state.doc && state.doc.no && body.indexOf(state.doc.no) < 0) {
      warnings.push({ kind: 'render', message: `文档中未出现方案编号 ${state.doc.no}` });
    }
    if ((state.doc || {}).includeCommercial && state.doc.includeCommercial) {
      warnings.push({ kind: 'policy', message: '本次导出包含「商务条款」，请确认不含不应外发的内部信息' });
    }
    if ((state.doc || {}).includeRisks && state.doc.includeRisks) {
      errors.push({ kind: 'policy', message: '本次导出包含「内部风险提示」段落，该段落明确标注内部信息，不应发送给客户', fix: '请关闭该开关后重新导出' });
    }

    // 只对「文档正文」做数字溯源：剔除内联样式 / class / 样式块，
    // 否则 CSS 里的 900px、#0b4f9e、12.8px 会被误判为凭空数字。
    const visible = body
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<span class="n">\s*\d+\s*<\/span>/gi, ' ')   // 章节序号不算事实数字
      .replace(/\sstyle="[^"]*"/gi, ' ')
      .replace(/\sclass="[^"]*"/gi, ' ')
      .replace(/\sid="[^"]*"/gi, ' ');

    const traced = traceNumbers(visible, sourcesText(state), 'document');
    traced.errors.forEach(e => errors.push({
      kind: 'number',
      message: `文档中的数字 ${e.number} 无法溯源`,
      context: e.context
    }));
    traced.warnings.forEach(w => warnings.push({
      kind: 'number-soft',
      message: `小整数 ${w.number} 未溯源（可能为序号，请人工扫一眼）`,
      context: w.context
    }));

    return { ok: errors.length === 0, errors, warnings, fixes, sections };
  }

  return {
    contract, exportCheck, traceNumbers, numbersIn, numSet, isSignificant,
    sourcesText, unknownModels, catalogueModels, modelKeys, isKnownModel, isAllowedModel
  };
})();
