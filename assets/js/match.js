/* ==========================================================================
 * match.js — 产品匹配 / 产线配置 / ROI 测算 / 新品资料生成
 * 候选筛选与 ROI 测算为确定性算法（离线可用），AI 负责语义精排与配置建议。
 * ========================================================================== */
window.Match = (function () {

  const MANUAL_RATE = 800;        // 手工插件 800 点/小时（历史方案口径）
  const MACHINE_RATE = 3600;      // 异形插件机 3600 CPH（S-7040 实测口径）
  const HOURS_PER_DAY = 8;
  const DAYS_PER_MONTH = 22;
  const OPERATOR_ANNUAL_USD = 10000; // 历史方案口径：Anual salary $10K
  const MACHINE_PRICE_USD = 40000;   // 历史方案口径：ROI=$40000/1 Set

  function metrics() {
    return { MANUAL_RATE, MACHINE_RATE, HOURS_PER_DAY, DAYS_PER_MONTH, OPERATOR_ANNUAL_USD, MACHINE_PRICE_USD };
  }

  /* --------------------------- 候选产品打分 --------------------------- */
  function queryTerms(fields) {
    return KB.tokenize([
      (fields.products_requested || []).join(' '),
      (fields.component_types || []).join(' '),
      Object.keys(fields.key_specs || {}).join(' '),
      Object.values(fields.key_specs || {}).join(' '),
      fields.industry || '',
      fields.summary_en || '',
      fields.summary_zh || ''
    ].join(' '));
  }

  function productHaystack(p) {
    const cat = (SM_PRODUCTS.categories.find(c => c.id === p.category) || {});
    return {
      strong: [p.model].concat(p.aliases || []).join(' ').toLowerCase(),
      name: [p.zh, p.en, cat.zh, cat.en].join(' ').toLowerCase(),
      body: [p.summary_zh, p.summary_en,
        (p.highlights_zh || []).join(' '), (p.highlights_en || []).join(' '),
        Object.keys(p.specs || {}).join(' '), Object.values(p.specs || {}).join(' ')].join(' ').toLowerCase()
    };
  }

  /**
   * 本地候选筛选
   * @returns {Array<{product, score, fit, reasons, evidence}>}
   */
  function candidates(fields, opts) {
    const o = Object.assign({ limit: 12 }, opts || {});
    const terms = queryTerms(fields);
    const out = [];
    (SM_PRODUCTS.products || []).forEach(p => {
      const hs = productHaystack(p);
      // 组合型号（如 "SLD250 / SULD250"）拆成单个型号参与精确比对
      const modelKeys = String(p.model || '').split(/[\/,、;]|\s+/)
        .map(x => x.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(x => x && /\d/.test(x));
      let score = 0;
      const reasons = [];
      terms.forEach(term => {
        const tk = term.replace(/[^a-z0-9]/g, '');
        if (tk && modelKeys.indexOf(tk) >= 0) {
          score += 25; reasons.push(term);
        } else if (hs.strong.indexOf(term) >= 0) {
          score += 8; reasons.push(term);
        } else if (hs.name.indexOf(term) >= 0) {
          score += 4; reasons.push(term);
        } else if (hs.body.indexOf(term) >= 0) {
          score += 1.5; reasons.push(term);
        }
      });
      if (score <= 0) return;
      const evidence = KB.docsForModel(p.model).map(d => ({
        title: d.title, category: d.category, snippet: d.snippet
      })).slice(0, 3);
      if (evidence.length) score += 3;
      out.push({
        product: p,
        score: Math.round(score * 10) / 10,
        fit: score >= 14 ? 'excellent' : score >= 6 ? 'good' : 'partial',
        reasons: Array.from(new Set(reasons)).slice(0, 10),
        evidence
      });
    });
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, o.limit);
  }

  /* --------------------------- ROI 测算 --------------------------- */
  function num(s) { return s ? Number(String(s).replace(/[^0-9.]/g, '')) || 0 : 0; }

  function estimateRoi(rawText, fields) {
    const raw = String(rawText || '') + ' ' + (fields && fields.summary_en ? fields.summary_en : '');
    const mBoards = raw.match(/([0-9][0-9,\.]*)\s*(?:boards?|pcs|片|块)[^\n]{0,20}?(?:\/|per\s+|每\s*)(month|月)/i)
      || raw.match(/([0-9][0-9,\.]*)\s*(?:boards?|pcs|片|块)[^\n]{0,10}/i);
    const mPoints = raw.match(/([0-9][0-9,\.]*)\s*(?:insertion\s*)?(?:points?|点)\s*(?:\/|per\s+|每\s*)?\s*(?:board|板|片)?/i);
    const mOps = raw.match(/([0-9][0-9,\.]*)\s*(?:workers?|operators?|人|operator)/i);
    const mMonthRate = raw.match(/([0-9][0-9,\.]*)\s*(?:boards?|pcs|片|块)[^\n]{0,12}?(?:month|月)/i);

    const boards = num((mBoards || mMonthRate || [])[1]);
    const points = num((mPoints || [])[1]);
    const opsStated = num((mOps || [])[1]);

    const out = {
      known: false,
      boards_per_month: boards || 0,
      points_per_board: points || 0,
      operators_stated: opsStated || 0,
      manual_rate: MANUAL_RATE,
      machine_rate: MACHINE_RATE,
      assumptions_zh: [
        `手工插件效率按 ${MANUAL_RATE} 点/小时/人 计（历史方案口径）`,
        `异形插件机实际效率按 ${MACHINE_RATE} CPH 计（S-7040 实测口径）`,
        `班制按 ${HOURS_PER_DAY} 小时/天、${DAYS_PER_MONTH} 天/月 计`,
        `单台设备参考价 US$${MACHINE_PRICE_USD.toLocaleString()}、人工年成本 US$${OPERATOR_ANNUAL_USD.toLocaleString()}（历史方案口径）`
      ],
      assumptions_en: [
        `Manual insertion rate: ${MANUAL_RATE} points/hour/operator (from our historical solutions)`,
        `Odd form insertion machine actual speed: ${MACHINE_RATE} CPH (S-7040 measured)`,
        `Shift model: ${HOURS_PER_DAY} h/day, ${DAYS_PER_MONTH} days/month`,
        `Reference machine price US$${MACHINE_PRICE_USD.toLocaleString()}, operator cost US$${OPERATOR_ANNUAL_USD.toLocaleString()}/year (historical benchmark)`
      ]
    };

    if (!boards || !points) {
      out.note_zh = '询盘中未提供明确的需求量或单板插装点数，请补充后再做收益测算。';
      out.note_en = 'Volume or insertion points per board were not stated in the inquiry; confirm before finalizing the ROI table.';
      return out;
    }

    out.known = true;
    const monthlyPoints = boards * points;
    const manualCapacity = MANUAL_RATE * HOURS_PER_DAY * DAYS_PER_MONTH;
    const machineCapacity = MACHINE_RATE * HOURS_PER_DAY * DAYS_PER_MONTH;
    const opsCalculated = Math.max(1, Math.ceil(monthlyPoints / manualCapacity));
    // 优先采用客户自述的在岗人力作为手工基线，更贴近真实节省
    const opsManual = Math.max(opsCalculated, opsStated || 0);
    const machines = Math.max(1, Math.ceil(monthlyPoints / machineCapacity));
    const opsAfter = Math.max(1, Math.ceil(machines / 2));   // 一人多机
    const saved = Math.max(0, opsManual - opsAfter);
    const annualSaving = saved * OPERATOR_ANNUAL_USD;
    const invest = machines * MACHINE_PRICE_USD;

    if (opsStated && opsStated > opsCalculated) {
      out.assumptions_zh.push(`手工基线采用客户自述的 ${opsStated} 名操作工（按理论效率推算仅需 ${opsCalculated} 人）`);
      out.assumptions_en.push(`Manual baseline uses the ${opsStated} operators stated by the customer (theoretical requirement: ${opsCalculated})`);
    }

    Object.assign(out, {
      monthly_points: Math.round(monthlyPoints),
      operators_needed_manual: opsManual,
      operators_calculated: opsCalculated,
      operators_stated: opsStated || 0,
      machine_qty: machines,
      operators_after: opsAfter,
      workers_saved: saved,
      annual_saving_usd: annualSaving,
      invest_usd: invest,
      payback_years: annualSaving ? Math.round((invest / annualSaving) * 100) / 100 : 0
    });
    if (!saved) {
      out.note_zh = '按当前需求量，工程测算的手工人力已接近设备能力，节省空间有限；建议结合客户的扩产规划（未来 12–24 个月）重新评估机型数量。';
      out.note_en = 'At the current volume the labor saving is limited; recommend re-evaluating the machine quantity together with the customer expansion plan (next 12-24 months).';
    }
    return out;
  }

  function roiRows(roi) {
    if (!roi || !roi.known) return [];
    return [
      {
        item_zh: '月度插装点数', item_en: 'Monthly insertion points',
        manual: roi.monthly_points.toLocaleString() + ' 点',
        automatic: roi.monthly_points.toLocaleString() + ' 点',
        benefit_zh: '—', benefit_en: '—'
      },
      {
        item_zh: '所需人力', item_en: 'Operators required',
        manual: roi.operators_needed_manual + ' 人',
        automatic: roi.operators_after + ' 人',
        benefit_zh: roi.workers_saved ? `节省 ${roi.workers_saved} 人` : '需结合扩产规划评估',
        benefit_en: roi.workers_saved ? `Save ${roi.workers_saved} operators` : 'To be evaluated with expansion plan'
      },
      {
        item_zh: '设备投入', item_en: 'Equipment investment',
        manual: 'US$0',
        automatic: 'US$' + roi.invest_usd.toLocaleString(),
        benefit_zh: `${roi.machine_qty} 台自动插件机`, benefit_en: `${roi.machine_qty} insertion machine(s)`
      },
      {
        item_zh: '年度人工节省', item_en: 'Annual labor saving',
        manual: '—', automatic: '—',
        benefit_zh: 'US$' + roi.annual_saving_usd.toLocaleString(),
        benefit_en: 'US$' + roi.annual_saving_usd.toLocaleString()
      },
      {
        item_zh: '投资回收期', item_en: 'Payback period',
        manual: '—', automatic: '—',
        benefit_zh: roi.payback_years ? roi.payback_years + ' 年' : '待确认',
        benefit_en: roi.payback_years ? roi.payback_years + ' years' : 'TBC'
      }
    ];
  }

  function feederGuesses(fields) {
    const text = JSON.stringify(fields || {}).toLowerCase();
    const plan = [];
    const push = (component, packaging, feeder, note_zh, note_en) => {
      plan.push({ component, packaging, feeder_model: feeder, qty: '待确认 / TBC', note_zh, note_en });
    };
    if (/connector|连接器/.test(text)) push('Connector', 'Bulk / Tube', 'VF3000 / TF4000', '散装或管装连接器建议振动盘或管式供料', 'Bowl or tube feeder for bulk / tube connectors');
    if (/relay|继电器/.test(text)) push('Relay', 'Tube', 'TF4000', '管装继电器用管式供料器', 'Tube feeder for relays');
    if (/e-?cap|electrolytic|电解/.test(text)) push('E-cap', 'Bulk / Tape', 'RF1000 / Bowl', '编带用RF1000，散装用振动盘', 'RF1000 for taped, bowl feeder for bulk');
    if (/terminal|端子/.test(text)) push('Terminal', 'Tape', 'RF1000 / AF2000', '编带端子用编带供料器', 'Tape feeder for taped terminals');
    if (/transformer|变压器/.test(text)) push('Transformer', 'Tube / Bulk', 'TF4000', '大件管装用TF4000', 'TF4000 for large tube-packed parts');
    if (/fuse|保险丝/.test(text)) push('Fuse', 'Tape / Bulk', 'RF1000', '编带保险丝用RF1000', 'RF1000 for taped fuses');
    if (!plan.length) push('待客户提供元件清单', 'TBC', 'TBC', '需元件实物或规格书确认供料方式', 'Component list / samples required to confirm feeding method');
    return plan;
  }

  /** 离线兜底匹配结果 */
  function fallback(fields, cands, rawText) {
    const top = cands.slice(0, 3);
    const roi = estimateRoi(rawText, fields);
    return {
      matches: top.map(c => ({
        model: c.product.model,
        fit: c.fit,
        qty: '1（建议，待确认 / TBC）',
        reason_zh: `匹配依据：${c.reasons.join('、')}`,
        reason_en: `Matched on: ${c.reasons.join(', ')}`,
        source_doc: (c.evidence[0] && c.evidence[0].title) || ''
      })),
      line_config: top.map(c => ({
        step: c.product.en, model: c.product.model,
        note_zh: c.product.summary_zh, note_en: c.product.summary_en
      })),
      feeder_plan: feederGuesses(fields),
      roi_estimate: Object.assign({}, roi, { rows: roiRows(roi) }),
      gaps: cands.length ? [] : [{
        item_zh: '现有产品库中未找到直接匹配的机型',
        item_en: 'No direct match found in our current catalogue',
        action_zh: '需要在「产品匹配」中粘贴供应商资料，由 AI 生成公司风格的新产品资料，或安排工程可行性评估',
        action_en: 'Paste supplier material to generate a new catalogue item, or request an engineering feasibility study'
      }],
      confidence: top.length && top[0].fit === 'excellent' ? 'high' : top.length ? 'medium' : 'low',
      source: 'local'
    };
  }

  /** AI 精排（带本地候选约束） */
  async function aiMatch(fields, cands, kbContext) {
    const payload = cands.map(c => ({
      model: c.product.model,
      zh: c.product.zh, en: c.product.en,
      category: c.product.category,
      summary_en: c.product.summary_en,
      specs: c.product.specs,
      local_score: c.score,
      local_reason: c.reasons,
      archive_refs: c.evidence.map(e => e.title)
    }));
    const p = SM_PROMPTS.match(fields, payload, kbContext);
    const { data } = await LLM.chatJSON({ system: p.system, user: p.user });
    // 用本地 ROI 兜底 AI 未给出的部分
    const roi = estimateRoi('', fields);
    if (!data.roi_estimate || !Object.keys(data.roi_estimate).length) data.roi_estimate = {};
    data.roi_estimate.numbers = roi;
    data.roi_estimate.rows = roiRows(roi);
    data.source = 'ai';
    return data;
  }

  /**
   * 完整匹配流程（供 UI 调用）
   */
  async function run(fields, rawText) {
    const cands = candidates(fields, { limit: 12 });
    const query = [fields.customer_name, (fields.products_requested || []).join(' '),
      (fields.component_types || []).join(' '), fields.summary_en].join(' ');
    const hits = KB.search(query, { topK: 4 });
    const kbContext = KB.buildContext(hits, 6000);

    let result, note = '';
    if (LLM.ready() && cands.length) {
      try {
        result = await aiMatch(fields, cands, kbContext);
      } catch (err) {
        result = fallback(fields, cands, rawText);
        note = 'AI 精排失败，已使用本地匹配结果：' + err.message;
      }
    } else {
      result = fallback(fields, cands, rawText);
      note = cands.length
        ? (LLM.ready() ? '' : '未配置 LLM，使用本地关键词匹配 + 标准 ROI 测算。')
        : '本地知识库未匹配到合适机型，请使用「新产品资料生成」或人工选择。';
    }
    return { candidates: cands, kbHits: hits, kbContext, result, note };
  }

  /* --------------------------- 新品资料生成 --------------------------- */
  function fallbackProduct(supplierText, hints) {
    const text = String(supplierText || '');
    const firstLine = (text.split('\n').find(l => l.trim()) || 'New Product').trim().slice(0, 60);
    const model = (text.match(/\b([A-Z]{1,4}[-\s]?\d{2,5}[A-Z]{0,3})\b/) || [])[1] || firstLine.split(/\s+/)[0];
    const specs = {};
    text.split('\n').forEach(line => {
      const m = line.match(/^\s*([^:：]{2,40})\s*[:：]\s*(.+)$/);
      if (m) specs[m[1].trim()] = m[2].trim().slice(0, 120);
    });
    return {
      model: String(model).toUpperCase(),
      name_en: firstLine,
      name_zh: firstLine,
      category: /feeder|供料/i.test(text) ? 'feeder' : /radial|径向/i.test(text) ? 'radial' : 'oddform',
      aliases: [String(model)],
      summary_en: 'Draft product profile generated from supplier material — please complete and verify.',
      summary_zh: '由供应商资料生成的草稿产品资料，请补充并核对参数。',
      specs,
      highlights_en: [], highlights_zh: [],
      missing_info: ['请核对型号、适用元件范围、节拍、精度、尺寸、电源与气源配置'],
      source: 'local'
    };
  }

  async function newProduct(supplierText, hints) {
    if (!LLM.ready()) {
      return { product: fallbackProduct(supplierText, hints), note: '未配置 LLM，已生成草稿结构，请人工补充参数。' };
    }
    const p = SM_PROMPTS.newProduct(supplierText, hints);
    const { data } = await LLM.chatJSON({ system: p.system, user: p.user });
    data.source = 'ai';
    return { product: data };
  }

  /** 把新品加入本次会话的产品库（不写入内置文件） */
  function addProductToCatalogue(product) {
    const id = product.model || ('NEW-' + Date.now());
    product.id = id;
    SM_PRODUCTS.products.unshift(product);
    return product;
  }

  return {
    candidates, run, fallback, aiMatch, estimateRoi, roiRows,
    newProduct, fallbackProduct, addProductToCatalogue, metrics, feederGuesses
  };
})();
