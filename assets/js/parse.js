/* ==========================================================================
 * parse.js — 客户询盘解析 + 前置条件清单
 * 规则解析（离线可用）负责兜底与校验；LLM 解析负责语义字段。
 * 支持中文 / 英文 / 混排询盘。
 * ========================================================================== */
window.Parse = (function () {

  const COUNTRIES = [
    ['Vietnam', ['vietnam', 'viet nam', '越南', 'ho chi minh', 'hanoi', 'ha noi']],
    ['India', ['india', '印度', 'bangalore', 'bengaluru', 'pune', 'chennai', 'noida']],
    ['Indonesia', ['indonesia', '印度尼西亚', '印尼', 'jakarta', 'batam']],
    ['Malaysia', ['malaysia', '马来西亚', 'penang', 'kuala lumpur']],
    ['Thailand', ['thailand', '泰国', 'bangkok']],
    ['Turkey', ['turkey', 'türkiye', '土耳其', 'istanbul']],
    ['Brazil', ['brazil', 'brasil', '巴西', 'sorocaba', 'são paulo', 'sao paulo']],
    ['Mexico', ['mexico', '墨西哥', 'guadalajara', 'tijuana', 'monterrey']],
    ['USA', ['usa', 'u.s.a', 'united states', '美国', 'california', 'texas']],
    ['Germany', ['germany', 'deutschland', '德国']],
    ['Poland', ['poland', '波兰']],
    ['Italy', ['italy', '意大利']],
    ['Spain', ['spain', '西班牙']],
    ['Saudi Arabia', ['saudi', '沙特']],
    ['UAE', ['uae', 'dubai', '阿联酋', '迪拜']],
    ['Egypt', ['egypt', '埃及']],
    ['Philippines', ['philippines', '菲律宾', 'manila']],
    ['Korea', ['korea', '韩国', 'seoul']],
    ['Japan', ['japan', '日本', 'tokyo', 'osaka']],
    ['Singapore', ['singapore', '新加坡']],
    ['Ecuador', ['ecuador', '厄瓜多尔']],
    ['Colombia', ['colombia', '哥伦比亚']],
    ['Argentina', ['argentina', '阿根廷']],
    ['Russia', ['russia', '俄罗斯']],
    ['Israel', ['israel', '以色列']],
    ['South Africa', ['south africa', '南非']]
  ];

  const CERT_KEYS = [
    ['CE', /\bCE\b|CE\s*(认证|certification|mark)/i],
    ['UL', /\bUL\b|UL\s*(认证|certification)/i],
    ['ISO 9001', /ISO\s*9001/i],
    ['ISO 14001', /ISO\s*14001/i],
    ['IATF 16949', /IATF\s*16949/i],
    ['FCC', /\bFCC\b/i],
    ['RoHS', /RoHS/i],
    ['REACH', /REACH/i],
    ['CCC', /CCC/i],
    ['CSA', /\bCSA\b/i]
  ];

  const PACK_HINTS = [
    ['Tube / 管装', /tube|管装|管式/i],
    ['Tape / 编带', /tape|编带|载带|reel|卷装/i],
    ['Bulk / 散装', /bulk|散装|散料|tray|托盘/i],
    ['Bowl / 振动盘', /bowl|振动盘|振动供料/i]
  ];

  function uniq(arr) { return Array.from(new Set(arr.filter(Boolean))); }

  /* ---------------------- 规则解析（离线兜底） ---------------------- */
  function rules(text) {
    const raw = String(text || '');
    const t = raw.toLowerCase();
    const f = {
      customer_name: '', customer_name_zh: '', country: '', city: '',
      contact_person: '', contact_title: '', email: '', phone: '',
      inquiry_no: '', inquiry_date: '',
      industry: '', products_requested: [], component_types: [],
      key_specs: {}, quantity_per_period: '', pcb_spec: '',
      certifications: [], lead_time_requested: '', budget: '',
      payment_terms: '', incoterms: '',
      language: 'en', urgency: 'medium',
      summary_zh: '', summary_en: '', open_questions: []
    };

    // 邮箱
    const mEmail = raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
    if (mEmail) f.email = mEmail[0];

    // 电话
    const mPhone = raw.match(/(?:\+?\d[\d\s()-]{7,}\d)/);
    if (mPhone) f.phone = mPhone[0].trim();

    // 公司名
    let mCo = raw.match(/(?:^\s*(?:Company|COMPANY|公司|公司名|Company Name)\s*[:：]\s*)(.+)$/m);
    if (mCo) f.customer_name = mCo[1].trim().replace(/[，,。.]$/, '');
    if (!f.customer_name) {
      mCo = raw.match(/(?:from|发件人)\s*[:：]\s*([^\n<]+)/i);
      if (mCo) f.contact_person = mCo[1].trim();
    }
    if (/[\u4e00-\u9fff]/.test(f.customer_name)) { f.customer_name_zh = f.customer_name; }

    // 联系人
    const mPerson = raw.match(/(?:^\s*(?:Contact|Attn|Attention|联系人|姓名)\s*[:：]\s*)(.+)$/m);
    if (mPerson) f.contact_person = mPerson[1].trim();
    if (!f.contact_person && mEmail) {
      const local = mEmail[0].split('@')[0].replace(/[._-]+/g, ' ').trim();
      if (/^[a-z\s]+$/i.test(local)) f.contact_person = local.split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    }
    const mTitle = raw.match(/(?:^\s*(?:Title|Position|职位|职务)\s*[:：]\s*)(.+)$/m);
    if (mTitle) f.contact_title = mTitle[1].trim();

    // 国家 / 城市
    for (const [name, keys] of COUNTRIES) {
      if (keys.some(k => t.indexOf(k) >= 0)) { f.country = name; break; }
    }
    const mCity = raw.match(/(?:^\s*(?:City|城市)\s*[:：]\s*)(.+)$/m);
    if (mCity) f.city = mCity[1].trim();
    if (!f.city && f.country) {
      const known = { Vietnam: ['Ho Chi Minh', 'Hanoi'], India: ['Bangalore', 'Pune', 'Chennai', 'Noida'], China: ['Shenzhen'] };
      (known[f.country] || []).forEach(c => { if (t.indexOf(c.toLowerCase()) >= 0) f.city = c; });
    }

    // 语言
    const cjk = (raw.match(/[\u4e00-\u9fff]/g) || []).length;
    const latin = (raw.match(/[A-Za-z]/g) || []).length;
    f.language = cjk > 60 && latin < cjk ? 'zh' : (cjk > 20 ? 'mixed' : 'en');

    // 型号 / 产品
    const models = [];
    (window.SM_PRODUCTS ? SM_PRODUCTS.products : []).forEach(p => {
      const names = [p.model].concat(p.aliases || []);
      names.forEach(n => {
        const key = String(n).toLowerCase();
        if (key.length < 3) return;
        const re = new RegExp('(^|[^a-z0-9])' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)', 'i');
        if (re.test(raw)) models.push(p.model);
      });
    });
    if (models.length) f.products_requested = uniq(models);

    // 需求品类关键词（中英）
    const CAT_HINTS = [
      ['Odd form insertion / 异形元件插件', /odd\s*-?\s*form|异形|连接器插件|connector insertion|relay insertion/i],
      ['Radial insertion / 径向插件', /radial|径向|e-?cap|电解电容/i],
      ['Axial insertion / 轴向插件', /axial|轴向/i],
      ['Terminal / Eyelet insertion / 端子铆钉', /terminal|eyelet|铆钉|端子/i],
      ['Pick & Place / LED SMT', /pick\s*&?\s*place|mounter|贴片|led\s*(line|smt|bulb|tube)/i],
      ['Wave soldering / 波峰焊', /wave\s*solder|波峰焊/i],
      ['Board handling / 上下板机', /loader|unloader|conveyor|上板|下板|接驳/i],
      ['AOI / Coating / 检测涂覆', /\baoI\b|conformal|coating|三防漆/i],
      ['Feeder / 供料器', /feeder|供料器|供料/i]
    ];
    const prods = [];
    CAT_HINTS.forEach(([label, re]) => { if (re.test(raw)) prods.push(label); });
    f.products_requested = uniq(f.products_requested.concat(prods));

    // 元件与包装
    const comps = [];
    const COMP_RE = [
      ['Connector', /connector|连接器/i],
      ['Relay', /relay|继电器/i],
      ['Electrolytic capacitor', /e-?cap|electrolytic|电解电容|铝电解/i],
      ['Terminal', /terminal|端子/i],
      ['Transformer', /transformer|变压器/i],
      ['Inductor', /inductor|电感/i],
      ['Fuse / Fuse clip', /fuse|保险丝|fuse holder/i],
      ['LED', /\bLED\b|灯珠/i],
      ['Resistor', /resistor|电阻/i],
      ['Diode', /diode|二极管/i],
      ['IC', /\bIC\b|芯片/i],
      ['Tact switch', /tact\s*switch|轻触|按键/i],
      ['Eyelet pin', /eyelet|铆钉/i],
      ['Action pin', /action\s*pin|压接/i]
    ];
    COMP_RE.forEach(([label, re]) => {
      if (re.test(raw)) comps.push(label);
    });
    f.component_types = uniq(comps);
    // 逐个包装线索
    const packFound = PACK_HINTS.filter(([, re]) => re.test(raw)).map(([n]) => n);
    if (packFound.length) f.key_specs['Packaging / 包装方式'] = packFound.join('; ');

    // 数量
    const mQty = raw.match(/([0-9][0-9,\.]*)\s*(?:pcs|pieces|sets|units|台|套|颗)/i);
    const mRate = raw.match(/([0-9][0-9,\.]*)\s*(?:boards?|pcs|points?|点|片|块)\s*(?:\/|per\s+|每\s*)(month|year|day|shift|月|年|日|班)/i);
    if (mRate) f.quantity_per_period = `${mRate[1]} per ${mRate[2]}`;
    else if (mQty) f.key_specs['Quantity / 数量'] = mQty[0];

    // PCB
    const mPcb = raw.match(/(\d{2,4})\s*(?:x|×|\*)\s*(\d{2,4})\s*(?:mm|毫米)?/i);
    if (mPcb) f.pcb_spec = `${mPcb[1]} × ${mPcb[2]} mm`;
    const mThick = raw.match(/(?:thickness|板厚|厚)\s*[:：]?\s*([0-9.]+)\s*mm/i) || raw.match(/([0-9.]+)\s*mm\s*(?:thick|板厚)/i);
    if (mThick) f.pcb_spec = (f.pcb_spec ? f.pcb_spec + ', ' : '') + 'thickness ' + mThick[1] + 'mm';

    // 认证
    f.certifications = CERT_KEYS.filter(([, re]) => re.test(raw)).map(([n]) => n);

    // 贸易条款 / 付款 / 交期 / 预算
    const mInco = raw.match(/\b(CIF|FOB|CIP|EXW|DDP|DAP|CFR|FCA)\b/i);
    if (mInco) f.incoterms = mInco[1].toUpperCase();
    const mPay = raw.match(/(\d{1,3})\s*%\s*(?:deposit|定金)[^.\n]*/i);
    if (mPay) f.payment_terms = mPay[0].trim();
    const mLead = raw.match(/(?:lead\s*time|delivery|交期|交货)[^\n.]{0,60}/i);
    if (mLead) f.lead_time_requested = mLead[0].trim();
    const mBudget = raw.match(/(?:budget|预算)[^\n.,;]{0,60}/i);
    if (mBudget) f.budget = mBudget[0].trim();
    const mUsd = raw.match(/(?:USD|US\$|\$)\s?([0-9][0-9,\.]*)\s*(?:K|万|k)?/);
    if (mUsd && !f.budget) f.budget = mUsd[0].trim();

    // 紧急度
    f.urgency = /urgent|asap|immediately|尽快|紧急/i.test(raw) ? 'high' : 'medium';

    // 行业
    const IND = [
      ['EMS / Contract manufacturing', /EMS|contract\s*manufactur|代工|电子制造服务/i],
      ['LED lighting', /LED\s*(light|bulb|tube|lighting)|照明|灯具/i],
      ['Automotive electronics', /automotive|汽车电子|IATF/i],
      ['Power supply / Charger', /power\s*supply|charger|电源|充电器/i],
      ['Consumer electronics', /consumer|家电|小家电/i],
      ['Industrial control', /industrial|工控|工业控制/i]
    ];
    IND.forEach(([label, re]) => { if (!f.industry && re.test(raw)) f.industry = label; });

    // 摘要（规则版：取有效行）
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l && !/^(from|to|subject|发件人|收件人|主题)\s*[:：]/i.test(l));
    const digest = lines.slice(0, 6).join(' ').slice(0, 400);
    f.summary_en = digest;
    f.summary_zh = digest;

    return f;
  }

  /* ---------------------- 合并 AI 与规则结果 ---------------------- */
  function mergeFields(ai, rule) {
    const out = Object.assign({}, rule || {}, ai || {});
    // AI 为空时回退到规则结果
    Object.keys(rule || {}).forEach(k => {
      const v = out[k];
      const empty = v === undefined || v === null || v === '' ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
      if (empty) out[k] = rule[k];
    });
    ['certifications', 'products_requested', 'component_types', 'open_questions'].forEach(k => {
      out[k] = uniq([].concat(ai && ai[k] ? ai[k] : []).concat(rule && rule[k] ? rule[k] : []));
    });
    out.language = out.language || rule.language || 'en';
    return out;
  }

  /** 解析询盘：优先 LLM，失败自动降级为规则解析 */
  async function parse(text) {
    const ruleFields = rules(text);
    if (!LLM.ready()) {
      return { fields: ruleFields, source: 'rules', note: '未配置 LLM，使用规则解析；建议在「设置」中配置 API 以获得更准确的结构化解析。' };
    }
    const p = SM_PROMPTS.parseInquiry(text);
    const { data } = await LLM.chatJSON({ system: p.system, user: p.user });
    return { fields: mergeFields(data, ruleFields), source: 'ai', raw: data, ruleFields };
  }

  /** 关键字段缺失检查 */
  function missing(fields) {
    const checks = [
      ['customer_name', '客户公司名称'],
      ['country', '客户所在国家'],
      ['email', '客户邮箱'],
      ['products_requested', '需求产品 / 设备类型'],
      ['component_types', '待插装元件清单'],
      ['quantity_per_period', '需求量 / 产能目标']
    ];
    return checks.filter(([k]) => {
      const v = fields[k];
      return v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
    }).map(([k, label]) => ({ key: k, label }));
  }

  /* ---------------------- 前置条件清单 ---------------------- */
  /** 离线兜底：基于标准模板 + 询盘已填字段生成 */
  function fallbackChecklist(fields) {
    const known = {
      quantity: fields.quantity_per_period || '',
      component: (fields.component_types || []).join(', '),
      pcb: fields.pcb_spec || '',
      certification: (fields.certifications || []).join(', '),
      leadtime: fields.lead_time_requested || '',
      budget: fields.budget || '',
      interface: /smema/i.test(JSON.stringify(fields)) ? 'SMEMA requested' : '',
      utility: ''
    };
    return SM_CONFIG.defaultCheckpoints.map(cp => {
      const kv = known[cp.key] || '';
      return {
        category: /budget|leadtime|quantity/.test(cp.key) ? 'commercial'
          : /certification|sample|accuracy/.test(cp.key) ? 'qualification' : 'technical',
        item_zh: cp.zh, item_en: cp.en,
        why_zh: cp.why_zh, why_en: cp.why_en,
        priority: ['component', 'quantity', 'pcb', 'accuracy', 'certification'].indexOf(cp.key) >= 0 ? 'high' : 'medium',
        ask_zh: `烦请确认：${cp.zh}？（${cp.why_zh}）`,
        ask_en: `Could you please confirm: ${cp.en}? (${cp.why_en})`,
        status: kv ? 'partially_known' : 'unknown',
        known_value: kv
      };
    });
  }

  /** 生成前置条件清单：优先 LLM，失败降级模板 */
  async function checklist(fields) {
    const query = [fields.customer_name, fields.industry, (fields.products_requested || []).join(' '),
      (fields.component_types || []).join(' '), fields.summary_en].join(' ');
    const hits = KB.search(query, { topK: 3 });
    const kbContext = KB.buildContext(hits, 3500);

    if (!LLM.ready()) {
      return { items: fallbackChecklist(fields), source: 'template', note: '未配置 LLM，使用标准前置条件模板。' };
    }
    const p = SM_PROMPTS.preConditions(fields, kbContext);
    const { data } = await LLM.chatJSON({ system: p.system, user: p.user });
    const items = (data && data.items) || [];
    if (!items.length) throw new Error('AI 未返回前置条件清单');
    return { items, blocking: { zh: data.blocking_zh || [], en: data.blocking_en || [] }, source: 'ai' };
  }

  return { rules, parse, mergeFields, missing, checklist, fallbackChecklist, COUNTRIES };
})();
