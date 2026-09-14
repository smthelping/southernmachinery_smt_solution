/* ==========================================================================
 * config.js — 公司档案、默认设置、示例询盘、AI 提示词模板
 * 公司信息摘自本库历史方案文件的标准页眉 / 页脚，可直接对外使用。
 * ========================================================================== */
window.SM_CONFIG = {
  brand: 'SMThelp',

  company: {
    zh: '深圳南方机械销售服务有限公司',
    en: 'Shenzhen Southern Machinery Sales and Service Co., Ltd.',
    address_en: 'Rm 1806, Block 3, Jinyun COFCO, Qianjin 2nd Road, Xixiang, Baoan District, Shenzhen City, China',
    address_zh: '中国深圳市宝安区西乡前进二路中粮锦云 3 栋 1806 室',
    tel: '0755-83203237',
    fax: '0755-23240492',
    website: 'www.smthelp.com',
    email: 'info@smthelp.com',
    facebook: 'https://www.facebook.com/autoinsertion',
    linkedin: 'https://cn.linkedin.com/in/smtsupplier',
    youtube: 'https://www.youtube.com/c/Smthelping',
    positioning: 'Smart EMS factory partner — smart, ROI-driven assembly equipment solutions',
    founded: '2011',
    base: 'Shenzhen, China'
  },

  /* 对外服务承诺（历史方案页脚原文） */
  service: {
    zh: ['7×24 全球技术支持', '免费安装与培训', '备件 1 天交付', '1 个月定制方案周期'],
    en: ['7x24 Worldwide Support', 'Free Installation / Training', '1 day lead-time (spare parts)', '1 Month customize solution']
  },

  /* 营销话术锚点（已在库内验证，可直接复用） */
  anchors: {
    roi_zh: [
      '低成本：THT 整机约 US$50~70K，异形供料器仅约 US$5~8K。',
      '高 ROI：显著节省手工插件的人工成本。'
    ],
    roi_en: [
      'Low Cost: $50~70K for a THT machine VS $5~8K for the Odd form Feeder.',
      'High ROI: Save significantly the labor cost of manual insertion.'
    ],
    why_us_zh: [
      'SMT 与自动插件方案 20 年以上经验。',
      '现有客户包括 GE、Bosch、Philips、Flex、Jabil、Juki。',
      '异形供料器专利持有人：1 项发明专利 + 2 项实用新型（THT 径向供料器）。'
    ],
    why_us_en: [
      '20 yrs+ experience in SMT & Auto Insertion Solution.',
      'Existing Customers include GE, Bosch, Philips, Flex, Jabil, and Juki.',
      'Patent Owner of Odd form Feeder: 1 Invention Patent & 2 New Practical Patents for THT radial feeder.'
    ],
    cases_zh: [
      '美国 LED 显示屏厂商径向插件自动化（2022）：效率较人工提升 5 倍。',
      'Universal 自动插件机改造为 PCB 上下板系统（2014）：实现一人多机、在线全自动。',
      '2009 年至今海外销售 50+ 台自动插件机，覆盖巴西、印度、马来西亚、印尼、泰国、土耳其、沙特等。'
    ],
    cases_en: [
      'US LED display manufacturer radial insertion automation (2022): 5x efficiency vs. manual insertion.',
      'Universal insertion machine retrofitted into PCB loading/unloading system (2014): one operator for multiple machines, fully in-line automatic.',
      '50+ auto insertion machines exported since 2009, covering Brazil, India, Malaysia, Indonesia, Thailand, Turkey and Saudi Arabia.'
    ]
  },

  /* 默认 LLM 配置（OpenAI 兼容接口） */
  llm: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.4,
    timeoutMs: 180000,
    jsonMode: true
  },

  /* 方案文档默认设置 */
  doc: {
    genMode: 'sectioned',        // sectioned = 分章生成（长方案）| oneshot = 一次生成
    editor: 'Wayne Guo',
    language: 'both',            // both | en | zh
    includeRoi: true,
    includeCases: true,
    includeRisks: false,         // 风险提示默认仅内部可见
    includeCommercial: false,    // 价格 / 商务条款默认不写入对外方案
    validityDays: 30
  },

  /* 前置条件清单的标准模板（AI 不可用时的兜底，也可作为 AI 输出校验基线） */
  defaultCheckpoints: [
    { key: 'quantity',   zh: '年 / 月需求量与批量', en: 'Annual / monthly volume & batch size',
      why_zh: '决定机型数量、供料站数与产线节拍配置', why_en: 'Determines machine qty, feeder stations and line cycle time' },
    { key: 'component',  zh: '元件清单与包装方式（含规格书 / 图纸）', en: 'Component list & packaging (with datasheet / drawing)',
      why_zh: '异形插件必须逐料确认尺寸、跨距、包装与夹爪可行性', why_en: 'Odd form insertion requires per-part confirmation of size, span, packaging and gripper feasibility' },
    { key: 'pcb',        zh: 'PCB 尺寸、板厚、拼板方式与边缘工艺边', en: 'PCB size, thickness, panelization & edge clearance',
      why_zh: '影响轨道宽度、传送方式与夹具设计', why_en: 'Affects track width, transport and fixture design' },
    { key: 'accuracy',   zh: '插件精度 / CPK 与测试要求', en: 'Insertion accuracy / CPK & test requirements',
      why_zh: '确认是否需视觉定位与压力监控', why_en: 'Confirms whether vision alignment or force monitoring is required' },
    { key: 'certification', zh: '认证要求（CE / UL / ISO 等）', en: 'Certification requirements (CE / UL / ISO, etc.)',
      why_zh: '影响电气配置、出口与交付周期', why_en: 'Affects electrical configuration, export and lead time' },
    { key: 'utility',    zh: '现场电源 / 气源 / 场地与物流条件', en: 'Site power, air supply, space & logistics',
      why_zh: '确认电压、气压与进厂条件', why_en: 'Confirms voltage, air pressure and site entry conditions' },
    { key: 'line',       zh: '是否需要整线（上下板机、波峰焊、接驳台）', en: 'Whether a full line is needed (loader, wave solder, conveyor)',
      why_zh: '决定是单机方案还是整线方案', why_en: 'Determines single-machine vs. full-line scope' },
    { key: 'interface',  zh: '是否需要 SMEMA / MES 数据对接', en: 'SMEMA / MES data integration needed',
      why_zh: '影响控制系统与通讯配置', why_en: 'Affects control system and communication configuration' },
    { key: 'leadtime',   zh: '期望交货期与项目节点', en: 'Expected delivery time & project milestones',
      why_zh: '确认定制周期能否满足', why_en: 'Verifies whether customization lead time fits' },
    { key: 'budget',     zh: '预算范围与采购流程', en: 'Budget range & procurement process',
      why_zh: '用于配置取舍与商务策略', why_en: 'Used for configuration trade-offs and commercial strategy' },
    { key: 'sample',     zh: '可否提供样品 / PCB 板做插装打样测试', en: 'Samples / PCBs available for insertion trial',
      why_zh: '异形元件必须实测确认可行性', why_en: 'Odd form parts must be trialed to confirm feasibility' },
    { key: 'aftersale',  zh: '售后方式：现场安装 / 远程支持 / 代理商', en: 'After-sales mode: on-site / remote / local agent',
      why_zh: '影响服务成本与培训安排', why_en: 'Affects service cost and training plan' }
  ],

  /* 示例询盘，便于立即体验完整流程 */
  samples: [
    {
      title: '英文询盘示例（越南 EMS · 异形插件）',
      text: `From: Nguyen Van Minh <minh.nguyen@vinhphatvn.example>
Company: VINH PHAT ELECTRONIC JSC
Country: Vietnam (Ho Chi Minh City)
Subject: Inquiry - Odd form insertion for LED driver boards

Dear Sir,
We are an EMS factory in Vietnam producing LED driver boards and power supplies.
Our customers require connector, relay and large electrolytic capacitor insertion on mixed-technology boards.

Current situation: manual insertion of about 14 insertion points per board, 8,000 boards per month, 3 workers per shift.
Components: JST connectors (bulk), Omron relays (tube), 470uF/25V electrolytic capacitors (bulk), 0.25in tape terminals (taped).
PCB: 240 x 150 mm, thickness 1.6 mm, panel 2-up.
Requirement: insertion accuracy +/-0.05 mm, capacity target 1,500 boards per day.
Our line has a SMEMA conveyor and we want to connect the machine to our MES.

Please advise the suitable machine model, feeder configuration and price with delivery time to Ho Chi Minh (CIF).
We also need CE certification for the machine, and lead time should be within 3 months.
Payment term proposed: 30% deposit, 70% before shipment.

Best regards,
Nguyen Van Minh`
    },
    {
      title: '中文询盘示例（印度客户 · LED 整线）',
      text: `发件人：Rajesh Kumar <rajesh@smartsmtindia.in>
公司：Smart SMT India Pvt. Ltd.
国家：印度 班加罗尔
主题：咨询 LED 灯板贴片整线方案

您好，
我们是印度班加罗尔的电子制造服务商，主要生产 LED 灯泡与灯管驱动板。
现计划新建一条 LED 灯板贴片线，产能目标 12,000 颗/小时，产品为 600mm x 300mm 灯板，板厚 1.2mm。

需求包括：上板机、全自动印刷机、接驳台、贴片机、回流焊、下板机，整线长度希望控制在 15 米以内。
另外我们还需要 1 台异形元件插件机，用于连接器和保险丝端子的插装，月需求约 200 万点。

请提供整线配置方案、设备清单、交期和报价（CIF 班加罗尔），并说明是否需要 CE 认证。
我们希望 3 个月内完成设备验收，预算约 30 万美元。

此致
Rajesh Kumar`
    }
  ]
};

/* ==========================================================================
 * 提示词模板 — 统一要求模型输出严格 JSON，便于程序渲染
 * ========================================================================== */
window.SM_PROMPTS = {
  companyContext() {
    const c = SM_CONFIG.company, a = SM_CONFIG.anchors;
    return [
      `Company: ${c.en} (${c.zh}), brand ${SM_CONFIG.brand}, founded ${c.founded}, based in ${c.base}.`,
      `Positioning: ${c.positioning}`,
      `Website: ${c.website} | Email: ${c.email}`,
      `Service commitments: ${SM_CONFIG.service.en.join('; ')}`,
      `Verified marketing anchors:\n- ${a.roi_en.join('\n- ')}\n- ${a.why_us_en.join('\n- ')}`,
      'NEVER invent machine specifications, prices, customer names or certifications that are not in the provided knowledge base.',
      'If a parameter is unknown, write it as "To be confirmed with customer" instead of guessing.'
    ].join('\n');
  },

  parseInquiry(inquiryText) {
    return {
      system: [
        'You are a senior pre-sales engineer at Southern Machinery (SMThelp), an SMT / THT auto insertion equipment maker in Shenzhen, China.',
        'You extract structured sales-opportunity data from customer inquiry emails. The email may be in English, Chinese, or mixed.',
        this.companyContext(),
        'Return STRICT JSON only, no markdown fence, no commentary, using exactly this schema:',
        JSON.stringify({
          customer_name: 'string (company legal name)',
          customer_name_zh: 'string (Chinese name if identifiable, else empty)',
          country: 'string',
          city: 'string',
          contact_person: 'string',
          contact_title: 'string',
          email: 'string',
          phone: 'string',
          inquiry_no: 'string (or empty)',
          inquiry_date: 'YYYY-MM-DD (or empty)',
          industry: 'string (e.g. EMS, LED lighting, automotive electronics)',
          products_requested: ['string — machine/products the customer asks for'],
          component_types: ['string — components to be inserted/placed, with packaging if stated'],
          key_specs: { 'parameter name': 'value as stated by customer' },
          quantity_per_period: 'string (volume, e.g. "8,000 boards/month")',
          pcb_spec: 'string (size / thickness / panel)',
          certifications: ['string'],
          lead_time_requested: 'string',
          budget: 'string (or empty)',
          payment_terms: 'string',
          incoterms: 'string',
          language: 'en | zh | mixed',
          urgency: 'high | medium | low',
          summary_zh: 'string — 3-5 sentence summary of the requirement in Chinese',
          summary_en: 'string — 3-5 sentence summary of the requirement in English',
          open_questions: ['string — information the customer did not provide but we need']
        }, null, 1)
      ].join('\n'),
      user: `Customer inquiry email:\n"""\n${inquiryText}\n"""\n\nExtract the fields and return JSON.`
    };
  },

  preConditions(fields, kbContext) {
    return {
      system: [
        'You are a pre-sales engineer at Southern Machinery. Before quoting an SMT / THT insertion solution you must confirm a checklist of pre-conditions with the customer.',
        this.companyContext(),
        kbContext ? `Relevant past project context (for reference only):\n${kbContext}` : '',
        'Return STRICT JSON only with this schema:',
        JSON.stringify({
          items: [{
            category: 'technical | commercial | logistics | qualification',
            item_zh: 'string — 需要向客户确认的事项',
            item_en: 'string — the same item in English',
            why_zh: 'string — 为什么必须确认，不确认会导致什么风险',
            why_en: 'string',
            priority: 'high | medium | low',
            ask_zh: 'string — 可以直接发给客户的问句（中文）',
            ask_en: 'string — ready-to-send question to the customer (English)',
            status: 'unknown | partially_known | known',
            known_value: 'string — 询盘中已有的信息，没有则空字符串'
          }],
          blocking_zh: ['string — 在得到哪些信息前无法给出正式报价'],
          blocking_en: ['string']
        }, null, 1)
      ].join('\n'),
      user: `Parsed customer requirement:\n${JSON.stringify(fields, null, 1)}\n\nGenerate 8-14 checklist items ordered by priority.`
    };
  },

  background(fields, extraNotes) {
    return {
      system: [
        'You are a B2B export risk & opportunity analyst for a Chinese SMT equipment manufacturer.',
        'Assess the customer company using general industry knowledge and the material provided. Never fabricate specific financial figures, registration numbers or news; if unsure, mark confidence as low and say what must be verified.',
        'Return STRICT JSON only with this schema:',
        JSON.stringify({
          company_profile_zh: 'string — 公司概况（业务模式、规模量级、产品方向），不确定处标注「待核实」',
          company_profile_en: 'string',
          positioning_zh: 'string — 在市场中的定位与采购动机',
          positioning_en: 'string',
          cooperation_advice_zh: ['string — 具体合作建议，3-5 条'],
          cooperation_advice_en: ['string'],
          risk_alerts: [{ level: 'high | medium | low', title_zh: 'string', title_en: 'string', detail_zh: 'string', detail_en: 'string', mitigation_zh: 'string', mitigation_en: 'string' }],
          match_strategy_zh: ['string — 与我方产品/方案能力的匹配策略，3-5 条'],
          match_strategy_en: ['string'],
          talking_points_zh: ['string — 首次沟通要点，3-5 条'],
          talking_points_en: ['string'],
          payment_risk: 'string — 付款与信用风险判断（低/中/高 + 建议条款）',
          confidence: 'high | medium | low',
          verify_checklist_zh: ['string — 建议人工核实的信息（官网、海关数据、LinkedIn 等）'],
          verify_checklist_en: ['string']
        }, null, 1)
      ].join('\n'),
      user: [
        `Customer: ${fields.customer_name || '(unknown)'} | Country: ${fields.country || '(unknown)'} | Industry: ${fields.industry || '(unknown)'}`,
        `Requirement: ${fields.summary_en || ''}`,
        extraNotes ? `Additional research material supplied by our sales rep:\n"""\n${extraNotes}\n"""` : 'No additional research material supplied — rely on general knowledge and mark uncertainty.',
        'Return the JSON assessment.'
      ].join('\n\n')
    };
  },

  match(fields, candidates, kbContext) {
    return {
      system: [
        'You are the solution architect at Southern Machinery. Select the best machine models from OUR product catalogue for the customer requirement, and design the line / feeder configuration.',
        this.companyContext(),
        'RULES: only use models present in the catalogue JSON below. Do not invent models. If no catalogue model fits a component, list it under "gaps" and suggest a custom engineering feasibility study.',
        'Return STRICT JSON only with this schema:',
        JSON.stringify({
          matches: [{
            model: 'string',
            fit: 'excellent | good | partial',
            qty: 'string',
            reason_zh: 'string',
            reason_en: 'string',
            source_doc: 'string — 依据的历史方案文件名（如无则空）'
          }],
          line_config: [{ step: 'string', model: 'string', note_zh: 'string', note_en: 'string' }],
          feeder_plan: [{ component: 'string', packaging: 'string', feeder_model: 'string', qty: 'string', note_zh: 'string', note_en: 'string' }],
          roi_estimate: { assumptions_zh: ['string'], assumptions_en: ['string'], manual_cost: 'string', machine_benefit: 'string', payback: 'string' },
          gaps: [{ item_zh: 'string', item_en: 'string', action_zh: 'string', action_en: 'string' }],
          confidence: 'high | medium | low'
        }, null, 1)
      ].join('\n'),
      user: [
        `Customer requirement:\n${JSON.stringify(fields, null, 1)}`,
        `Our product catalogue (JSON):\n${JSON.stringify(candidates, null, 1)}`,
        kbContext ? `Relevant historical solutions from our archive (reference for configuration and ROI wording):\n${kbContext}` : '',
        'Select models and return JSON.'
      ].join('\n\n')
    };
  },

  newProduct(supplierText, hints) {
    return {
      system: [
        'You are the product marketing engineer at Southern Machinery (SMThelp).',
        'A third-party / supplier product must be presented as a NEW catalogue item, written in OUR brand style (objective, parameter-first, ROI-oriented, bilingual EN/CN).',
        'Only use facts contained in the supplied material. Convert units where useful. Never invent certificates.',
        this.companyContext(),
        'Return STRICT JSON only with this schema:',
        JSON.stringify({
          model: 'string',
          name_en: 'string',
          name_zh: 'string',
          category: 'one of: oddform | radial | axial | terminal | feeder | smt | line | peripheral | inspection',
          aliases: ['string'],
          summary_en: 'string (2-3 sentences)',
          summary_zh: 'string',
          specs: { 'Bilingual label / Bilingual label': 'value' },
          highlights_en: ['string — 3-5 selling points'],
          highlights_zh: ['string'],
          missing_info: ['string — 参数缺口，需向供应商索取']
        }, null, 1)
      ].join('\n'),
      user: [
        hints ? `Positioning hints from our team: ${hints}` : '',
        `Supplier / third-party product material:\n"""\n${supplierText}\n"""`,
        'Rewrite it as a Southern Machinery catalogue item and return JSON.'
      ].join('\n\n')
    };
  },

  solution(state) {
    return {
      system: [
        'You are writing a CUSTOMER-FACING solution document for Southern Machinery (SMThelp).',
        this.companyContext(),
        'WRITING RULES:',
        '1) Everything must be specific to this customer: use their company name, their components, their volumes, their PCB, their line.',
        '2) Use only specifications that appear in the provided product catalogue / knowledge base for the selected models.',
        '3) Tone: professional equipment supplier, concise, benefit-driven, measurable. No marketing fluff without numbers.',
        '4) Provide both English and Chinese for every text field.',
        '5) Use "" (empty string) or empty array when information is genuinely unavailable, never fabricate.',
        '6) All ROI / labor-saving numbers must be derived from the customer numbers given (insertion points, boards per month, operators) and shown as assumptions.',
        'Return STRICT JSON only with this schema:',
        JSON.stringify({
          title_en: 'string', title_zh: 'string',
          summary_en: 'string (3-4 sentence executive summary)', summary_zh: 'string',
          understanding_en: ['string — our understanding of the customer requirement, 4-6 bullets'],
          understanding_zh: ['string'],
          solution_overview_en: 'string (2-3 paragraphs describing the proposed solution)', solution_overview_zh: 'string',
          line_items: [{ model: 'string', name_en: 'string', name_zh: 'string', qty: 'string', role_en: 'string', role_zh: 'string' }],
          spec_groups: [{ group_en: 'string', group_zh: 'string', rows: [{ k_en: 'string', k_zh: 'string', v: 'string' }] }],
          roi: { assumptions_en: ['string'], assumptions_zh: ['string'], rows: [{ item_en: 'string', item_zh: 'string', manual: 'string', automatic: 'string', benefit_en: 'string', benefit_zh: 'string' }] },
          feeder_plan: [{ component: 'string', packaging: 'string', feeder_model: 'string', qty: 'string', note_en: 'string', note_zh: 'string' }],
          service_en: ['string'], service_zh: ['string'],
          confirm_items: [{ item_en: 'string', item_zh: 'string', why_en: 'string', why_zh: 'string' }],
          next_steps_en: ['string'], next_steps_zh: ['string'],
          internal_risks_en: ['string'], internal_risks_zh: ['string']
        }, null, 1)
      ].join('\n'),
      user: [
        `CUSTOMER REQUIREMENT:\n${JSON.stringify(state.fields, null, 1)}`,
        `CONFIRMED CHECKLIST STATUS:\n${JSON.stringify(state.checkpoints || [], null, 1)}`,
        `SELECTED PRODUCTS & CONFIGURATION:\n${JSON.stringify(state.match, null, 1)}`,
        `PRODUCT SPECIFICATIONS (authoritative, do not contradict):\n${JSON.stringify(state.productData, null, 1)}`,
        state.kbContext ? `HISTORICAL SOLUTION REFERENCES:\n${state.kbContext}` : '',
        state.background ? `CUSTOMER BACKGROUND (may be used for tone and risk framing):\n${JSON.stringify(state.background, null, 1)}` : '',
        `OUTPUT LANGUAGE: ${state.language === 'both' ? 'English + Chinese' : state.language === 'zh' ? 'Chinese with English technical terms' : 'English only'}`,
        'Write the solution content and return JSON.'
      ].join('\n\n')
    };
  },

  /**
   * 契约修复：把校验器发现的问题回灌给模型，要求只改被指出的部分。
   * @param {object} state 与 solution() 相同的输入
   * @param {Array} problems Validate.contract() 产生的 errors
   * @param {object} previous 上一版回复
   */
  repairSolution(state, problems, previous) {
    const base = SM_PROMPTS.solution(state);
    const list = problems.slice(0, 25).map((p, i) => {
      const ctx = p.context ? `  ⟶ 原文片段: "${p.context}"` : '';
      return `${i + 1}. [${p.kind}] ${p.message}${ctx}`;
    }).join('\n');

    return {
      system: [
        base.system,
        '',
        '★★★ THIS IS A REPAIR PASS ★★★',
        'Your previous reply violated the fact-safety contract of our product catalogue.',
        'Fix ONLY the problems listed below. Keep every correct part of the previous reply unchanged (same wording, same structure, same JSON schema).',
        'Hard rules you MUST respect:',
        'A) Only use machine models that exist in the PROVIDED PRODUCT SPECIFICATIONS block. Never invent a model number.',
        'B) Every technical figure (accuracy, speed, size, power, force, quantity) must be copied verbatim from the PROVIDED PRODUCT SPECIFICATIONS or the CUSTOMER REQUIREMENT.',
        'C) Every number in your text must be traceable to the customer input, our product catalogue, or our company facts. Do NOT compute or round numbers yourself; use only the given ROI figures.',
        'D) If you cannot state a figure honestly, write "To be confirmed with customer" instead of a number.',
        'Return the COMPLETE corrected JSON with the same schema.'
      ].join('\n'),
      user: [
        base.user,
        `YOUR PREVIOUS REPLY (invalid):\n${JSON.stringify(previous)}`,
        `CONTRACT VIOLATIONS TO FIX:\n${list}`,
        'Return the complete corrected JSON now.'
      ].join('\n\n')
    };
  }
};
