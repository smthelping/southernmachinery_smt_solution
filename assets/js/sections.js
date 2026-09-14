/* ==========================================================================
 * sections.js — 长方案「分章受控生成」
 *
 * 借鉴开源项目 MMF 的思路：不把整篇长文档交给模型一次性输出，而是
 *   先定章节计划 → 逐章生成（每章独立提示词 + 独立契约校验）→ 检查点续写
 *   → 汇总后再跑一次全量契约校验。
 * 其中「关键规格参数」一章**完全由产品库确定性生成**，不经过模型，
 * 从根上杜绝参数被改写。
 * ========================================================================== */
window.Sections = (function () {

  const MAX_REPAIR_PER_SECTION = 1;

  /* ------------------------------ 章节计划 ------------------------------ */
  /**
   * 章节计划：顺序即文档顺序。
   * ai=false 的章节由代码生成（确定性）。
   */
  function plan() {
    return [
      {
        id: 'intro', ai: true, words: 260,
        label_zh: '摘要与需求理解', label_en: 'Summary & requirement understanding',
        hint: 'Executive summary of what the customer asked for, and a bullet list showing we understood their components, volume, PCB and line.'
      },
      {
        id: 'solution', ai: true, words: 440,
        label_zh: '方案概述与设备清单', label_en: 'Solution overview & equipment list',
        hint: 'Describe the proposed solution approach, then give the equipment list (one row per selected machine model).'
      },
      {
        id: 'specs', ai: false,
        label_zh: '关键规格参数（产品库直出）', label_en: 'Key specifications (from catalogue)'
      },
      {
        id: 'value', ai: true, words: 400,
        label_zh: '供料方案与 ROI 收益', label_en: 'Feeding plan & ROI',
        hint: 'Feeding configuration per component/packaging, and the labor-saving / ROI story using ONLY the pre-computed figures we supply.'
      },
      {
        id: 'closing', ai: true, words: 340,
        label_zh: '服务、待确认事项与下一步', label_en: 'Service, open items & next steps',
        hint: 'Our after-sales commitments (verbatim from company facts), the items still to be confirmed with the customer, and the next steps.'
      }
    ];
  }

  function planIds() { return plan().map(s => s.id); }

  /* --------------------------- 确定性章节：规格表 --------------------------- */
  function buildSpecs(state) {
    const prods = (state.selectedProducts && state.selectedProducts.length)
      ? state.selectedProducts
      : (SM_PRODUCTS.products || []).filter(p =>
        ((state.match && state.match.matches) || []).map(m => m.model).indexOf(p.model) >= 0);
    return DocGen.specGroupsFrom(prods);
  }

  /* ------------------------------ 提示词 ------------------------------ */
  function baseSystem() {
    const c = SM_CONFIG.company;
    return [
      'You are a senior pre-sales engineer at Southern Machinery (SMThelp), an SMT / THT auto insertion equipment manufacturer in Shenzhen, China.',
      `Company: ${c.en} (${c.zh}) | Website: ${c.website} | Founded ${c.founded} | ${c.positioning}`,
      `Service commitments (use verbatim when asked): ${SM_CONFIG.service.en.join('; ')}`,
      '',
      '★★★ FACT-SAFETY CONTRACT (violations are automatically rejected) ★★★',
      'A) Only use machine models listed in the PROVIDED PRODUCT SPECIFICATIONS block. Never invent a model number.',
      'B) Every technical figure (accuracy, speed, size, thickness, power, force, quantity, price) must be copied verbatim from the PROVIDED PRODUCT SPECIFICATIONS or the CUSTOMER REQUIREMENT.',
      'C) Your text will be machine-checked: every number you write must be traceable to the customer input, our product catalogue, our company facts, or the values we explicitly hand you below. Do NOT compute, extrapolate or round numbers yourself.',
      'D) If an honest figure is unavailable, write "To be confirmed with customer" instead of a number.',
      'E) Be concrete and customer-specific: use their company name, their components, their volumes, their PCB.',
      'Return STRICT JSON only — no markdown fence, no commentary.'
    ].join('\n');
  }

  function sharedContext(state) {
    const roi = (state.match && state.match.roi_estimate && state.match.roi_estimate.numbers) || Match.estimateRoi(state.rawInquiry, state.fields);
    return [
      `CUSTOMER REQUIREMENT:\n${JSON.stringify(state.fields, null, 1)}`,
      `CONFIRMED CHECKLIST / OPEN ITEMS:\n${JSON.stringify((state.checkpoints || []).map(c => ({ item: c.item_en || c.item_zh, known: c.known_value, confirmed: !!c.confirmed })), null, 1)}`,
      `SELECTED PRODUCTS & CONFIGURATION:\n${JSON.stringify({
        matches: (state.match && state.match.matches) || [],
        line_config: (state.match && state.match.line_config) || [],
        feeder_plan: (state.match && state.match.feeder_plan) || []
      }, null, 1)}`,
      `PRODUCT SPECIFICATIONS (authoritative — never contradict):\n${JSON.stringify((state.selectedProducts || []).map(p => ({ model: p.model, en: p.en, zh: p.zh, specs: p.specs, highlights_en: p.highlights_en, sources: p.sources })), null, 1)}`,
      `PRE-COMPUTED ROI FIGURES (authoritative — quote these, never recompute):\n${JSON.stringify(roi, null, 1)}`,
      `OUTPUT LANGUAGE: ${state.doc.language === 'both' ? 'provide English AND Chinese for every text field' : state.doc.language === 'zh' ? 'Chinese (technical terms may stay in English); still fill the _en fields with the same content in English' : 'English only (still fill the _zh fields, they will not be printed)'}`
    ].join('\n\n');
  }

  const SCHEMAS = {
    intro: {
      title_en: 'string', title_zh: 'string',
      summary_en: 'string (3-4 sentences)', summary_zh: 'string',
      understanding_en: ['string', '4-6 bullets'], understanding_zh: ['string']
    },
    solution: {
      solution_overview_en: 'string (2-3 paragraphs)', solution_overview_zh: 'string',
      line_items: [{ model: 'string (from catalogue)', name_en: 'string', name_zh: 'string', qty: 'string', role_en: 'string', role_zh: 'string' }]
    },
    value: {
      roi: {
        narrative_en: 'string', narrative_zh: 'string',
        assumptions_en: ['string'], assumptions_zh: ['string'],
        rows: [{ item_en: 'string', item_zh: 'string', manual: 'string', automatic: 'string', benefit_en: 'string', benefit_zh: 'string' }]
      },
      feeder_plan: [{ component: 'string', packaging: 'string', feeder_model: 'string (from catalogue or TBC)', qty: 'string', note_en: 'string', note_zh: 'string' }]
    },
    closing: {
      service_en: ['string'], service_zh: ['string'],
      confirm_items: [{ item_en: 'string', item_zh: 'string', why_en: 'string', why_zh: 'string' }],
      next_steps_en: ['string'], next_steps_zh: ['string'],
      internal_risks_en: ['string'], internal_risks_zh: ['string']
    }
  };

  function sectionPrompt(state, sec, priorParts) {
    const done = Object.keys(priorParts || {});
    const priorTitles = done.filter(k => priorParts[k] && priorParts[k].title_en)
      .map(k => priorParts[k].title_en).join(' | ');
    return {
      system: baseSystem(),
      user: [
        sharedContext(state),
        priorTitles ? `Already-written section titles (keep consistent, do not repeat them verbatim): ${priorTitles}` : '',
        `TASK: Write ONLY the section "${sec.label_en}" (${sec.label_zh}) — ${sec.hint}`,
        `Target length: about ${sec.words} words for the English text.`,
        'Do NOT write any other section. Do NOT include section numbering.',
        'Return STRICT JSON only, exactly this shape:',
        JSON.stringify(SCHEMAS[sec.id], null, 1)
      ].filter(Boolean).join('\n\n')
    };
  }

  function repairSectionPrompt(state, sec, problems, previous) {
    const list = problems.slice(0, 20).map((p, i) =>
      `${i + 1}. [${p.kind || 'number'}] ${p.message}${p.context ? `  ⟶ 原文片段: "${p.context}"` : ''}`).join('\n');
    return {
      system: [
        baseSystem(),
        '',
        '★★★ THIS IS A REPAIR PASS FOR ONE SECTION ★★★',
        'Rewrite ONLY the section listed below. Keep everything that was already correct, same JSON shape.',
        'Remove or replace every figure that violates the fact-safety contract; when in doubt write "To be confirmed with customer".'
      ].join('\n'),
      user: [
        sharedContext(state),
        `SECTION TO FIX: "${sec.label_en}" (${sec.label_zh})`,
        `YOUR PREVIOUS REPLY:\n${JSON.stringify(previous)}`,
        `CONTRACT VIOLATIONS:\n${list}`,
        'Return the corrected JSON for THIS SECTION only.'
      ].join('\n\n')
    };
  }

  /* ------------------------------ 汇总 ------------------------------ */
  /** 把各章零件拼成 DocGen 能消费的 aiContent 结构 */
  function mergeParts(state, parts) {
    const p = parts || {};
    const pick = (id, key, dflt) => (p[id] && p[id][key] !== undefined ? p[id][key] : dflt);
    const out = {
      title_en: pick('intro', 'title_en', ''),
      title_zh: pick('intro', 'title_zh', ''),
      summary_en: pick('intro', 'summary_en', ''),
      summary_zh: pick('intro', 'summary_zh', ''),
      understanding_en: pick('intro', 'understanding_en', []),
      understanding_zh: pick('intro', 'understanding_zh', []),
      solution_overview_en: pick('solution', 'solution_overview_en', ''),
      solution_overview_zh: pick('solution', 'solution_overview_zh', ''),
      line_items: pick('solution', 'line_items', []),
      spec_groups: pick('specs', 'groups', buildSpecs(state)),
      roi: pick('value', 'roi', {}),
      feeder_plan: pick('value', 'feeder_plan', []),
      service_en: pick('closing', 'service_en', []),
      service_zh: pick('closing', 'service_zh', []),
      confirm_items: pick('closing', 'confirm_items', []),
      next_steps_en: pick('closing', 'next_steps_en', []),
      next_steps_zh: pick('closing', 'next_steps_zh', []),
      internal_risks_en: pick('closing', 'internal_risks_en', []),
      internal_risks_zh: pick('closing', 'internal_risks_zh', [])
    };
    return out;
  }

  /* --------------------------- 单章校验与修复 --------------------------- */
  function checkSection(state, sec, data) {
    const allowed = Validate.sourcesText(state);
    const traced = Validate.traceNumbers(data, allowed, sec.id);
    const errors = traced.errors.map(e => Object.assign({ kind: 'number' }, e));
    const bogus = Validate.unknownModels(data);
    bogus.forEach(b => errors.push({ kind: 'model', message: `出现了产品库之外的型号 ${b.model}`, context: b.context }));
    return { errors, warnings: traced.warnings };
  }

  /* ------------------------------ 主流程 ------------------------------ */
  /**
   * 分章生成（带检查点，可中断续写）
   * @param {object} state 会话状态
   * @param {object} opts  { onProgress(sec, status, extra), resume:boolean, reset:boolean }
   * @returns {Promise<{parts, content, errors, stats}>}
   */
  async function run(state, opts) {
    const o = Object.assign({ onProgress: () => {}, resume: true, reset: false }, opts || {});
    const sections = plan();

    // 检查点：章节集合变化或显式 reset 时重来
    let ck = state.sectioned;
    const ids = sections.map(s => s.id).join(',');
    if (o.reset || !ck || ck.planIds !== ids) ck = { parts: {}, done: [], errors: [], planIds: ids };
    state.sectioned = ck;

    // 确定性章节先行
    ck.parts.specs = { groups: buildSpecs(state) };
    if (ck.done.indexOf('specs') < 0) ck.done.push('specs');

    const stats = { sections: sections.length, generated: 0, skipped: 0, repaired: 0, failed: 0 };

    for (const sec of sections) {
      if (!sec.ai) { o.onProgress(sec, 'ok', { note: 'product catalogue' }); continue; }

      if (o.resume && ck.done.indexOf(sec.id) >= 0 && ck.parts[sec.id]) {
        stats.skipped++;
        o.onProgress(sec, 'skip');
        continue;
      }

      o.onProgress(sec, 'running');
      let data = null;
      try {
        const p = sectionPrompt(state, sec, ck.parts);
        const res = await LLM.chatJSON({ system: p.system, user: p.user });
        data = res.data;
      } catch (err) {
        stats.failed++;
        ck.errors.push({ section: sec.id, kind: 'call', message: err.message });
        o.onProgress(sec, 'error', { message: err.message });
        continue;   // Fail-Soft：其它章节继续
      }

      let chk = checkSection(state, sec, data);
      if (chk.errors.length) {
        // 单章修复重试
        try {
          const rp = repairSectionPrompt(state, sec, chk.errors, data);
          const res2 = await LLM.chatJSON({ system: rp.system, user: rp.user });
          const chk2 = checkSection(state, sec, res2.data);
          stats.repaired++;
          if (chk2.errors.length < chk.errors.length) {
            data = res2.data;
            chk = chk2;
          } else if (chk2.errors.length > chk.errors.length) {
            stats.repaired--;
            o.onProgress(sec, 'fixed', { note: '修复未改善，保留首版' });
          } else {
            o.onProgress(sec, 'fixed', { note: '修复后仍有问题' });
          }
        } catch (err) {
          ck.errors.push({ section: sec.id, kind: 'repair', message: err.message });
        }
      }

      ck.parts[sec.id] = data;
      ck.done.push(sec.id);
      stats.generated++;
      if (chk.errors.length) {
        chk.errors.forEach(e => ck.errors.push({ section: sec.id, kind: e.kind || 'number', message: e.message, context: e.context }));
        o.onProgress(sec, 'warn', { errors: chk.errors });
      } else {
        o.onProgress(sec, 'ok');
      }
      ck.at = new Date().toISOString();
    }

    ck.errors = ck.errors.slice(-60);
    return { parts: ck.parts, content: mergeParts(state, ck.parts), errors: ck.errors, stats };
  }

  function progress(state) {
    const sections = plan();
    const ck = state.sectioned || { done: [], parts: {} };
    return {
      sections,
      doneIds: ck.done || [],
      total: sections.length,
      finished: sections.filter(s => (ck.done || []).indexOf(s.id) >= 0).length,
      at: ck.at || ''
    };
  }

  function reset(state) {
    state.sectioned = { parts: {}, done: [], errors: [], planIds: planIds() };
    return state.sectioned;
  }

  return {
    plan, planIds, buildSpecs, sectionPrompt, repairSectionPrompt,
    mergeParts, checkSection, run, progress, reset, SCHEMAS
  };
})();
