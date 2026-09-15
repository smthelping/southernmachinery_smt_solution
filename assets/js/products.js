/* ==========================================================================
 * products.js — Southern Machinery (SMThelp) 产品知识库
 * 所有参数均摘自本库历史方案 / 报价 / 产品册原文件（见每项的 sources 字段）。
 * 未列入的参数一律视为「待客户确认」，禁止凭空编造。
 * 最后更新：2026-09-14
 * ========================================================================== */
window.SM_PRODUCTS = {
  meta: {
    brand: 'SMThelp',
    company_zh: '深圳南方机械销售服务有限公司',
    company_en: 'Shenzhen Southern Machinery Sales and Service Co., Ltd.',
    updatedAt: '2026-09-14',
    note: '参数来源为历史方案文件；引用前请核对原文件，未知参数在方案中标注「待确认」。'
  },

  categories: [
    { id: 'oddform',    zh: '异形元件插件',      en: 'Odd Form Insertion' },
    { id: 'radial',     zh: '径向插件',          en: 'Radial Insertion' },
    { id: 'axial',      zh: '轴向插件',          en: 'Axial Insertion' },
    { id: 'terminal',   zh: '端子 / 铆钉引脚',   en: 'Terminal & Eyelet Insertion' },
    { id: 'feeder',     zh: '供料器（专利）',    en: 'Feeders (Patented)' },
    { id: 'smt',        zh: '贴片机 / LED',      en: 'Pick & Place / LED' },
    { id: 'line',       zh: '整线与板处理',      en: 'Line & Board Handling' },
    { id: 'peripheral', zh: '周边设备',          en: 'Peripheral Equipment' },
    { id: 'inspection', zh: '检测与涂覆',        en: 'Inspection & Coating' }
  ],

  products: [
    /* ---------------- 异形元件插件 ---------------- */
    {
      id: 'S-7040',
      model: 'S-7040',
      category: 'oddform',
      zh: '异形元件自动插件机',
      en: 'Odd Form Insertion Machine',
      aliases: ['S7040', 'odd form', '异形插件', '连接器插件', 'connector', 'relay', '电解电容插件'],
      summary_zh: '针对大体积异形元件（连接器、继电器、大电解电容等）的高速高精度插件机，可集成多路碗式 / 带式 / 管式供料，实现多物料选择性插装。',
      summary_en: 'High-speed, high-precision odd form insertion machine developed for large odd form components such as connectors, relays and large capacitors; supports multi-material selective insertion with bowl / tape / tube feeders.',
      specs: {
        '插装头 / Insertion Heads': '4',
        '供料方式 / Feeders': 'Bowl feeder / Tape feeder / Tube feeder',
        '实际产能 / Actual Speed': '3,600 CPH',
        '插装精度 / Insertion Accuracy': '±0.05mm',
        '元件尺寸 / Component Size': '3×3mm – 30×30mm',
        '元件高度 / Component Height': '≤ 50mm',
        'PCB 尺寸 / PCB Size': '50×50mm – 320×280mm',
        'PCB 厚度 / PCB Thickness': '0.8 – 5.0mm',
        '机器尺寸 / Machine Size (L*W*H)': '1,200×1,100×1,600mm',
        '机器重量 / Machine Weight': '1,000kg',
        '电源 / Power': '220V AC, 0.8KVA',
        '气源 / Air': '0.4 – 0.6MPa'
      },
      highlights_zh: ['一台机器可替代约 4.5 名手工插件工人', 'ROI < 2 年', '多物料混合供料（碗 / 带 / 管）', '可对接 SMEMA 在线连线'],
      highlights_en: ['One machine replaces approx. 4.5 manual operators', 'ROI within 2 years', 'Mixed feeding: bowl / tape / tube', 'SMEMA in-line compatible'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7900',
      model: 'S-7900',
      category: 'oddform',
      zh: '异形元件高速插件机',
      en: 'High-Speed Odd Form Insertion Machine',
      aliases: ['S7900', 'odd form', '异形插件', '连接器', 'connector insertion'],
      summary_zh: 'S7900 面向中大批量异形元件插装，4 插装头 + 18 供料站，兼顾速度与柔性。',
      summary_en: 'S7900 targets medium-to-high volume odd form insertion with 4 insertion heads and 18 feeder stations, balancing speed and flexibility.',
      specs: {
        '插装头 / Insertion Heads': '4',
        '供料站 / Feeder Stations': '18',
        '产能 / Speed': '12,000 CPH（节拍 0.7s/元件 / 0.7s per component）',
        '插装精度 / Insertion Accuracy': '±0.05 – ±0.06mm（CPK ≥ 1.0）',
        '最大插入力 / Max Insertion Force': '98N',
        'PCB 尺寸 / PCB Size': '70×70mm – 410×500mm',
        'PCB 厚度 / PCB Thickness': '0.6 – 2.0mm',
        '接口 / Interface': 'SMEMA（在线串联）/ MES 对接'
      },
      highlights_zh: ['4 头 18 站，柔性换型快', 'SMEMA / MES 对接，适配智能工厂', '兼容多种异形元件供料方式'],
      highlights_en: ['4 heads / 18 stations for fast changeover', 'SMEMA / MES ready for smart factory', 'Multiple feeder types for odd form parts'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7020T',
      model: 'S-7020T',
      category: 'terminal',
      zh: '端子插件机',
      en: 'Terminal Insertion Machine',
      aliases: ['S7020T', 'terminal insertion', '端子插件', '接线端子'],
      summary_zh: '面向连接器 / 端子类元件的自动插装机，可与径向、异形插件机组成混线。',
      summary_en: 'Automatic insertion machine for connectors and terminals; can be configured together with radial and odd form machines in a mixed-technology line.',
      specs: {
        '适用元件 / Components': 'Terminal / Connector / 接线端子',
        '供料方式 / Feeding': 'Tube / Tape / Bowl（按元件确认）',
        '接口 / Interface': 'SMEMA'
      },
      highlights_zh: ['端子类元件免手插', '可与异形插件机并线'],
      highlights_en: ['Eliminates manual terminal insertion', 'Parallel with odd form machines'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7000E',
      model: 'S-7000E',
      category: 'terminal',
      zh: '铆钉引脚插件机',
      en: 'Eyelet Pin Insertion Machine',
      aliases: ['S7000E', 'eyelet', '铆钉', '铆钉引脚', 'eyelet insertion'],
      summary_zh: '用于铆钉 / 空心引脚类元件的自动插装与压铆，适合电源、汽车电子等高可靠场景。',
      summary_en: 'Automatic insertion and staking of eyelet / hollow pin components, suitable for high-reliability products such as power supplies and automotive electronics.',
      specs: {
        '适用元件 / Components': 'Eyelet pin / 铆钉引脚',
        '插装方式 / Process': 'Insertion + staking 插装压铆',
        '供料方式 / Feeding': 'Tube / Tape / Bowl（按元件确认）'
      },
      highlights_zh: ['铆接一致性优于人工', '支持定制夹爪与供料'],
      highlights_en: ['Staking consistency better than manual', 'Custom gripper & feeder available'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7000P',
      model: 'S-7000P',
      category: 'terminal',
      zh: 'Action Pin 插件机',
      en: 'Action Pin Insertion Machine',
      aliases: ['S7000P', 'action pin', '压接引脚'],
      summary_zh: '针对 Action Pin（压接引脚）免焊接工艺的自动插装设备。',
      summary_en: 'Automatic insertion equipment for press-fit Action Pin (solderless) process.',
      specs: {
        '适用元件 / Components': 'Action Pin / 压接引脚',
        '工艺 / Process': 'Press-fit 免焊接压接'
      },
      highlights_zh: ['免焊接，提升可靠性', '适合背板 / 电源类产品'],
      highlights_en: ['Solderless press-fit process', 'Ideal for backplane / power products'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 径向插件 ---------------- */
    {
      id: 'S-3000',
      model: 'S-3000',
      category: 'radial',
      zh: '径向元件自动插件机',
      en: 'Radial Insertion Machine',
      aliases: ['S3000', 'radial', '径向插件', '电解电容', 'e-cap'],
      summary_zh: '高速径向元件插件机，三跨距（2.5/3.5/5.0mm）兼容，视觉定位，内弯脚。',
      summary_en: 'High-speed radial insertion machine with triple span (2.5/3.5/5.0mm), vision positioning and inward clinching.',
      specs: {
        '产能 / Speed': '最高 18,000 CPH，实际约 9,000 CPH',
        '定位精度 / Positioning Accuracy': '< 0.001mm（进口精密滚珠丝杆 + AC 伺服）',
        '跨距 / Span': '2.5 / 3.5 / 5.0mm（Triple span）',
        '插件角度 / Insertion Angle': '0 – 360°，1° 递增',
        '弯脚 / Clinching': 'Inward clinching 内弯脚',
        '视觉系统 / Vision': '配置（定位与插件对位）',
        '运行方式 / Operation': 'Off-line / In-line 可选',
        '上板 / PCB Loading': '自动上板'
      },
      highlights_zh: ['整机铸造机身，稳定性高', '视觉对位提升良率', '自动上下板，一人多机'],
      highlights_en: ['Integral cast iron frame', 'Vision alignment improves yield', 'Automatic PCB loading'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-3010A',
      model: 'S-3010A / S-3010B',
      category: 'radial',
      zh: '径向插件机（10 站）',
      en: 'Radial Insertion Machine (10 stations)',
      aliases: ['S3010A', 'S3010B', 'radial', '10 stations'],
      summary_zh: '10 供料站的径向插件机，常用于充电器、电源类 PCBA 混线。',
      summary_en: 'Radial insertion machine with 10 feeder stations, commonly used in charger / power supply PCBA lines.',
      specs: {
        '供料站 / Stations': '10',
        '适用元件 / Components': '径向电解电容 / 电感 / 电阻',
        '接口 / Interface': 'SMEMA'
      },
      highlights_zh: ['多站供料，换型灵活'],
      highlights_en: ['Multi-station feeding, quick changeover'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S3012A',
      model: 'S3012A',
      category: 'radial',
      zh: '径向元件自动插件机',
      en: 'Radial Insertion Machine',
      aliases: ['S-3012A', 'radial insertion'],
      summary_zh: 'S3012A 径向插件机，提供布局方案、节拍与 UPH 仿真分析。',
      summary_en: 'S3012A radial insertion machine with layout scheme and cycle-time / UPH simulation analysis.',
      specs: {
        '服务 / Service': '提供 Layout Scheme 布局方案与节拍分析',
        '维护 / Maintenance': '工程师定期上门维护（如 KTC 客户现场）'
      },
      highlights_zh: ['含节拍与 UPH 仿真', '现场维护支持'],
      highlights_en: ['Cycle-time / UPH simulation included', 'On-site maintenance support'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'TR-990',
      model: 'TR-990',
      category: 'radial',
      zh: '径向插件机',
      en: 'Radial Insertion Machine',
      aliases: ['TR990', 'radial'],
      summary_zh: '径向元件插件机，支持 2.5 / 5.0 / 7.5 / 10.0mm 跨距。',
      summary_en: 'Radial insertion machine supporting 2.5 / 5.0 / 7.5 / 10.0mm lead spans.',
      specs: {
        '最大元件高度 / Max Body Height': '20mm',
        '最大元件直径 / Max Body Diameter': '10mm',
        '跨距 / Span': '2.5 / 5.0 / 7.5 / 10.0mm'
      },
      highlights_zh: ['宽跨距覆盖，适配多种电容'],
      highlights_en: ['Wide span coverage for various capacitors'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 轴向插件 ---------------- */
    {
      id: 'S4000',
      model: 'S4000',
      category: 'axial',
      zh: '轴向元件自动插件机',
      en: 'Axial Insertion Machine',
      aliases: ['S-4000', 'axial', '轴向插件', '电阻', '二极管'],
      summary_zh: '轴向编带元件（电阻、二极管、跳线）自动插件机，配合径向与异形插件组成 THT 整线。',
      summary_en: 'Automatic axial taped component insertion machine for resistors, diodes and jumpers; combines with radial and odd form machines for a full THT line.',
      specs: {
        '适用元件 / Components': '轴向编带电阻 / 二极管 / 跳线',
        '供料 / Feeding': 'Axial tape（编带 5/10/15/20mm pitch 视元件）',
        '接口 / Interface': 'SMEMA'
      },
      highlights_zh: ['轴向元件免手插', '整线串联自动上下板'],
      highlights_en: ['Eliminates manual axial insertion', 'In-line with automatic board handling'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 供料器（专利核心） ---------------- */
    {
      id: 'RF1000',
      model: 'RF1000',
      category: 'feeder',
      zh: '径向编带供料器',
      en: 'Radial Tape Feeder',
      aliases: ['RF-1000', 'radial feeder', '径向供料器', 'ecap feeder', 'feeder'],
      summary_zh: '让贴片机 / 插件机具备径向元件自动插装能力的编带供料器，适用于电解电容、盒式电容、MOV、LED 等。',
      summary_en: 'Radial taped feeder that enables pick & place / insertion machines to auto-insert radial lead components such as e-caps, box caps, MOVs and LEDs.',
      specs: {
        '元件本体 / Component Body': '圆柱 ø3–ø10mm；方形 W5–10mm × L5–25mm',
        '元件高度 / Component Height': '5 – 25mm',
        '编带间距 / Tape Pitch': '12.7mm 或 25.4mm',
        '引脚线径 / Lead Dia': '0.4 – 1.0mm',
        '引脚跨距 / Lead Span': '2.5 – 25mm',
        '引脚长度 / Lead Length': '2.5 – 5mm',
        '送料方式 / Feeding': '电机或气动驱动 / Motor or Pneumatic drive',
        '节拍 / Cycle Time': '1.5 – 2s',
        '适用元件 / Component Range': 'E-cap、Inductor、Terminal',
        '尺寸 / Dimension': '500(L)×100(W)×165(H)mm',
        '兼容机型 / Compatibility': 'JUKI / Panasonic / FUJI / SIPLACE'
      },
      highlights_zh: ['专利产品：1 项发明专利 + 2 项实用新型', '低成本自动化：US$5–8K，对比 THT 整机 US$50–70K', '高 ROI：替代手工插件人工成本'],
      highlights_en: ['Patented: 1 invention patent + 2 new practical patents', 'Low cost: US$5–8K vs US$50–70K for a THT machine', 'High ROI: replaces manual insertion labor'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'AF2000',
      model: 'AF2000',
      category: 'feeder',
      zh: '轴向编带供料器',
      en: 'Axial Tape Feeder',
      aliases: ['AF-2000', 'axial feeder', '轴向供料器'],
      summary_zh: '轴向编带元件供料器，适用于电阻、二极管、跳线。',
      summary_en: 'Axial taped feeder for resistors, diodes and jumper wires.',
      specs: {
        '元件本体 / Component Body': 'ø2 – ø10mm',
        '编带间距 / Tape Pitch': '5 / 10 / 15 / 20mm',
        '引脚线径 / Lead Dia': '0.4 – 1.0mm',
        '引脚长度 / Lead Length': '2.5 – 5mm',
        '送料方式 / Feeding': '气动驱动 / Pneumatic drive',
        '节拍 / Cycle Time': '1.5 – 2s',
        '适用元件 / Component Range': 'Resistor、Diode、JW',
        '尺寸 / Dimension': '700(L)×100(W)×165(H)mm'
      },
      highlights_zh: ['气动送料，稳定可靠', '兼容主流贴片机平台'],
      highlights_en: ['Pneumatic feeding, stable and reliable', 'Compatible with mainstream platforms'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'VF3000',
      model: 'VF3000',
      category: 'feeder',
      zh: '振动管式供料器',
      en: 'Vibration Tube Feeder',
      aliases: ['VF-3000', 'vibration feeder', '管式供料', 'tube feeder'],
      summary_zh: '管装 IC / 元件振动供料器，解决管装物料自动供料难题。',
      summary_en: 'Vibration tube feeder for tube-packed ICs and components.',
      specs: {
        '元件尺寸 / Component Size': '5×5mm – 10×10mm',
        '送料方式 / Feeding': 'Vibration drive 振动驱动',
        '节拍 / Cycle Time': '2 – 3s',
        '适用元件 / Component Range': 'IC',
        '包装 / Component Input': 'Tube package 管装',
        '尺寸 / Dimension': '400(L)×100(W)×165(H)mm'
      },
      highlights_zh: ['管装物料自动化', '可定制轨道'],
      highlights_en: ['Automation for tube-packed parts', 'Customizable track'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'TF4000',
      model: 'TF4000',
      category: 'feeder',
      zh: '管式供料器（变压器 / 继电器）',
      en: 'Tube Feeder for Transformer & Relay',
      aliases: ['TF-4000', 'tube feeder', '变压器供料', 'relay feeder'],
      summary_zh: '面向变压器、继电器、晶体管等大件管装物料的电机驱动供料器。',
      summary_en: 'Motor-driven tube feeder for larger tube-packed parts such as transformers, relays and transistors.',
      specs: {
        '元件尺寸 / Component Size': '5×5mm – 25×25mm',
        '管长 / Tube Length': '300 – 650mm',
        '送料方式 / Feeding': 'Motor drive 电机驱动',
        '节拍 / Cycle Time': '1.5 – 2s',
        '适用元件 / Component Range': 'Transformer、Relay、Transistor'
      },
      highlights_zh: ['大件管装物料自动供料', '支持长管 650mm'],
      highlights_en: ['Automation for large tube-packed parts', 'Supports tube length up to 650mm'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 贴片机 / LED ---------------- */
    {
      id: 'S-1200',
      model: 'S-1200 / S-1200SV',
      category: 'smt',
      zh: 'LED 贴片机',
      en: 'LED Pick & Place Machine',
      aliases: ['S1200', 'S1200SV', 'LED mounter', 'LED 贴片机', '贴片机', 'LED 灯板', '灯板贴片', 'pick and place'],
      summary_zh: '面向 LED 照明的一站式贴片机，可与印刷机、回流焊组成 LED SMT 整线。',
      summary_en: 'LED lighting pick & place machine, can form a complete LED SMT line with printer and reflow oven.',
      specs: {
        '应用 / Application': 'LED 灯泡 / 灯管 / 灯板贴装',
        '连线 / Line': 'Loader + Printer + Conveyor + Mounter + Reflow + Unloader'
      },
      highlights_zh: ['一站式 LED SMT 整线方案', '高性价比'],
      highlights_en: ['One-stop LED SMT line solution', 'Cost effective'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-320',
      model: 'S-320',
      category: 'smt',
      zh: 'LED 贴片机',
      en: 'LED Pick & Place Machine',
      aliases: ['S320', 'LED mounter', '贴片机', 'LED 灯板', '灯板'],
      summary_zh: '经济型 LED 贴片机，适合 LED 灯珠 / 灯板中小批量生产。',
      summary_en: 'Economical LED pick & place machine for small-to-medium volume LED board production.',
      specs: {
        '应用 / Application': 'LED 灯珠 / 灯板贴装'
      },
      highlights_zh: ['整线报价灵活配置'],
      highlights_en: ['Flexible whole-line quotation'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-520A',
      model: 'S-520 / S-520A',
      category: 'smt',
      zh: '多功能贴片机',
      en: 'Multi-function Pick & Place Machine',
      aliases: ['S520', 'S520A', 'pick and place', '贴片机', 'SMT 贴装'],
      summary_zh: '多功能贴片机，可与插件、焊接设备组成混装工艺整线。',
      summary_en: 'Multi-function pick & place machine for mixed-technology lines.',
      specs: {
        '应用 / Application': 'SMT 贴装 / 混装线'
      },
      highlights_zh: ['整线配套能力强'],
      highlights_en: ['Strong whole-line integration'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-530SV',
      model: 'S-530 / S-530SV',
      category: 'smt',
      zh: 'LED 高速贴片机',
      en: 'High-Speed LED Pick & Place Machine',
      aliases: ['S530', 'S530SV', 'LED mounter', '贴片机', '高速贴片机', 'LED 灯板'],
      summary_zh: 'S-530 系列 LED 高速贴片机，2022 年 LED 贴装整线方案主力机型。',
      summary_en: 'S-530 series high-speed LED mounter, main model in 2022 LED assembly line solutions.',
      specs: {
        '应用 / Application': 'LED 灯板高速贴装'
      },
      highlights_zh: ['高速 LED 贴装', '整线交付'],
      highlights_en: ['High-speed LED placement', 'Turnkey line delivery'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 整线与板处理 ---------------- */
    {
      id: 'BHS',
      model: 'SLD250 / SULD250',
      category: 'line',
      zh: '板处理系统（上下板机 / 接驳台）',
      en: 'Board Handling System',
      aliases: ['loader', 'unloader', 'inverter', 'flipper', 'conveyor', '上下板机', '上板机', '下板机', '收板机', '接驳台', '翻转机', 'magazine', 'BHS', 'SLD250', 'SLD330', 'SLD390', 'SLD460', 'SULD250', 'SULD330', 'SULD390', 'SULD460', 'SBI330', 'SBI460', 'S-350C'],
      summary_zh: '整线板处理单元：Magazine 上板机（SLD 系列）、下板机（SULD 系列）、PCB 翻转机（SBI 系列）与接驳台，构成 SMT / THT 自动连线；全部 SMEMA 兼容，可与任意品牌设备对接。',
      summary_en: 'Board handling units: magazine loaders (SLD), unloaders (SULD), PCB inverters (SBI) and transfer conveyors for automatic SMT / THT lines — all SMEMA compatible.',
      specs: {
        '上板机 / Loader (SLD)': 'SLD250 1330×765×1250 mm / PCB 50×50–330×250 mm / 140 kg；SLD330 1650×845×1250 / 445×330 / 200 kg；SLD390 1800×909×1250 / 530×390 / 240 kg；SLD460 1800×970×1250 / 530×460 / 300 kg',
        '下板机 / Unloader (SULD)': 'SULD250 1730×765×1250 mm / PCB 50×50–330×250 mm / 160 kg；SULD330 2065×845×1250 / 445×330 / 220 kg；SULD390 2660×909×1250 / 530×390 / 280 kg；SULD460 2660×970×1250 / 530×460 / 320 kg',
        'PCB 翻转机 / Inverter (SBI)': 'SBI330 500×786×1200 mm / PCB 50×50–445×330 mm / 120 kg；SBI460 600×856×1200 / 530×460 / 160 kg；翻转 180°（双面工艺），节拍约 5 秒',
        '料架 / Magazine': '上下各 1 个；换料架约 30 秒；步距 10 / 20 / 30 / 40 mm（可指定）；料架尺寸 355×320×563（250 型）/ 460×400×563（330 型）/ 535×460×563（390 型）/ 535×530×563（460 型）',
        '控制 / Control': '翻转机由 Omron PLC 控制；膜按键面板；气动推杆压力可调；翻转时气动挡停定位；输送宽度手摇调节；可选直通（by-pass）模式',
        '电源 / Power': '上/下板机 110V 或 220V 单相，最大 250 VA；翻转机 230VAC 单相 150VA（可选 100VAC）',
        '气源 / Air': '4 – 6 bar，最大 10 L/min',
        '轨道宽度 / Track Width': '50 – 460 mm',
        '传输高度 / Height': '920 ± 20 mm',
        '接口 / Interface': 'SMEMA',
        '命名说明 / Naming': '原文不同文档中收板机同时出现 SUL250 与 SULD250 两种写法，本库统一按 SULD 系列收录'
      },
      highlights_zh: ['一人多机、在线全自动', '可与任意品牌设备对接'],
      highlights_en: ['Multi-machine operation per operator', 'Connects with any brand of equipment'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-WS',
      model: 'S-WS350B / S-WS450',
      category: 'peripheral',
      zh: '波峰焊设备',
      en: 'Wave Soldering Machine',
      aliases: ['wave soldering', '波峰焊', 'SWS350', 'SWS450'],
      summary_zh: '波峰焊机与前后接驳台，配套 THT 插件线完成焊接工序。',
      summary_en: 'Wave soldering machine with input / output conveyors for THT insertion lines.',
      specs: {
        '配套 / Line-up': 'SBF460 输入接驳台 + S-WS350 波峰焊 + SUB460 输出接驳台'
      },
      highlights_zh: ['插件线整体交付', '含前后接驳台'],
      highlights_en: ['Turnkey insertion line delivery', 'With in/out conveyors'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-100B',
      model: 'S-100B / S-100A',
      category: 'peripheral',
      zh: '选择焊 / 超声波清洗',
      en: 'Selective Soldering / Ultrasonic Cleaner',
      aliases: ['selective soldering', '选择焊', 'ultrasonic cleaner', '超声清洗'],
      summary_zh: '选择性焊接设备与超声波清洗机，用于后焊工序与治具清洗。',
      summary_en: 'Selective soldering machine and ultrasonic cleaner for post-soldering and fixture cleaning.',
      specs: {
        '机型 / Models': 'S-100B（选择焊）、S-100A（超声波清洗）'
      },
      highlights_zh: ['可与插件线集成'],
      highlights_en: ['Integrates with insertion lines'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-320AT',
      model: 'S-320AT / S-680A',
      category: 'peripheral',
      zh: '在线切脚机 / 废料带切割机',
      en: 'In-line Lead Cutter / Waste Tape Cutter',
      aliases: ['lead cutter', '切脚机', '废料带', 'cutting lead'],
      summary_zh: '插件后在线切脚与废料带处理设备，解决长引脚与料带堆积问题。',
      summary_en: 'In-line lead cutting and waste tape handling equipment after insertion.',
      specs: {
        '应用 / Application': '插件后切脚 / 废料带切割',
        '备注 / Note': '厚引脚异形元件需专用模具定位切割'
      },
      highlights_zh: ['在线集成，无需人工搬运', '针对厚引脚提供专用模具方案'],
      highlights_en: ['In-line integration', 'Special mold for thick leads'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 检测与涂覆 ---------------- */
    {
      id: 'CC-AOI',
      model: 'Conformal Coating AOI',
      category: 'inspection',
      zh: '三防漆涂覆 AOI 检测系统',
      en: 'Conformal Coating AOI',
      aliases: ['AOI', 'conformal coating', '三防漆', '涂覆检测', '气泡检测'],
      summary_zh: '基于 AI 算法的三防漆涂覆 AOI，可检出气泡、异物等复杂缺陷场景。',
      summary_en: 'AI-algorithm based conformal coating AOI that detects bubbles and foreign matter in complex scenes.',
      specs: {
        '核心算法 / Algorithm': 'AI 深度学习检测算法（行业领先）',
        '检测能力 / Capability': '气泡、异物、IC 引脚间气泡、引脚间凹陷',
        '版本 / Version': 'Official EN 2024'
      },
      highlights_zh: ['复杂气泡场景高检出率', '可对接 MES 追溯'],
      highlights_en: ['High detection rate in complex bubble scenes', 'MES traceability ready'],
      sources: ['Internal solution archive (not public)']
    },

    /* ---------------- 配套设备（型号来自本库产品索引 §6.1） ---------------- */
    {
      id: 'S1688',
      model: 'S1688',
      category: 'peripheral',
      zh: '钢网清洗机',
      en: 'Stencil Cleaning Machine',
      aliases: ['S-1688', 'stencil cleaner', '钢网清洗'],
      summary_zh: 'SMT 钢网在线 / 离线清洗设备，配套贴片与印刷工序。',
      summary_en: 'Stencil cleaning machine for SMT printing process, on-line or off-line operation.',
      specs: { '适用 / Application': 'SMT 钢网清洗', '详细参数 / Details': '按配置确认（To be confirmed）' },
      highlights_zh: ['与印刷工序配套'],
      highlights_en: ['Pairs with the printing process'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-6200',
      model: 'S-6200',
      category: 'peripheral',
      zh: '吸嘴清洗机',
      en: 'Nozzle Cleaning Machine',
      aliases: ['S6200', 'nozzle cleaner', '吸嘴清洗'],
      summary_zh: '贴片机吸嘴自动清洗与检测设备。',
      summary_en: 'Automatic cleaning and inspection equipment for pick & place nozzles.',
      specs: { '适用 / Application': '贴片机吸嘴', '详细参数 / Details': '按配置确认（To be confirmed）' },
      highlights_zh: ['减少吸嘴抛料与不良'],
      highlights_en: ['Reduces nozzle-related defects'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-EPCOS',
      model: 'S-EPCOS',
      category: 'peripheral',
      zh: '散装电容成型机',
      en: 'Bulk Capacitor Forming Machine',
      aliases: ['SEPCOS', 'capacitor forming', '电容成型'],
      summary_zh: '散装电解电容切脚 / 成型设备，插件前处理工序。',
      summary_en: 'Lead cutting and forming machine for bulk electrolytic capacitors before insertion.',
      specs: { '适用 / Application': '散装电解电容切脚成型', '详细参数 / Details': '按元件规格确认（To be confirmed）' },
      highlights_zh: ['与插件机配套，提升供料适配性'],
      highlights_en: ['Pairs with insertion machines to improve feeding compatibility'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'SFT830',
      model: 'SFT830',
      category: 'peripheral',
      zh: '保险丝端子组装机',
      en: 'Fuse Terminal Assembly Machine',
      aliases: ['SFT-830', 'fuse terminal', '保险丝端子'],
      summary_zh: '保险丝端子自动组装设备，用于插件前端子装配。',
      summary_en: 'Automatic assembly machine for fuse terminals prior to insertion.',
      specs: { '适用 / Application': '保险丝端子组装', '详细参数 / Details': '按端子规格确认（To be confirmed）' },
      highlights_zh: ['定制工装适配不同端子'],
      highlights_en: ['Custom tooling for different terminals'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-D601',
      model: 'S-D601 / S-D602',
      category: 'peripheral',
      zh: 'LED MCPCB 分板机',
      en: 'LED MCPCB Depaneling Machine',
      aliases: ['SD601', 'SD602', 'depaneling', '分板机', 'MCPCB'],
      summary_zh: 'LED 铝基板（MCPCB）分板设备，分板后可直接连线贴装。',
      summary_en: 'Depaneling equipment for LED MCPCB, in-line capable with SMT mounting.',
      specs: { '适用 / Application': 'LED 铝基板 MCPCB 分板', '详细参数 / Details': '按板尺寸确认（To be confirmed）' },
      highlights_zh: ['低应力分板，保护元件与板边'],
      highlights_en: ['Low-stress depaneling protecting components and board edges'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'SAGV0601',
      model: 'SAGV0601',
      category: 'line',
      zh: '自主移动机器人（AMR）',
      en: 'Autonomous Mobile Robot (AMR)',
      aliases: ['SAGV-0601', 'AMR', 'AGV', '移动机器人', '物料搬运'],
      summary_zh: '车间物料自动搬运 AMR，支持激光导航与智能调度。',
      summary_en: 'AMR for automatic material handling in the workshop, with laser navigation and intelligent scheduling.',
      specs: { '导航方式 / Navigation': '激光导航（Laser navigation）', '详细参数 / Details': '按负载与场景确认（To be confirmed）' },
      highlights_zh: ['可与 MES / 产线调度对接'],
      highlights_en: ['Interfaces with MES / line scheduling'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-680A',
      model: 'S-680A',
      category: 'peripheral',
      zh: '废料带切割机',
      en: 'Waste Tape Cutter',
      aliases: ['S680A', 'waste tape', '废料带'],
      summary_zh: '插件线废料带自动切割与收集设备。',
      summary_en: 'Automatic cutting and collection of waste tape on insertion lines.',
      specs: { '适用 / Application': '编带废料带处理', '详细参数 / Details': '按料带规格确认（To be confirmed）' },
      highlights_zh: ['减少人工清理，保持线体整洁'],
      highlights_en: ['Reduces manual housekeeping'],
      sources: ['Internal solution archive (not public)']
    },

    /* ======================================================================
     * 2026 LED SMT 整线（型号与参数逐条摘自
     *   _index/text/ICS_SMT_LED_Line_Solution_Southern_Machinery_v3.txt
     *   方案编号 NO: IC26060301 / 2026-06-03 / Edit: Wayne Guo）
     * 说明：此前产品库仅有旧一代 LED 贴片机（S-320 / S-520 / S-530 / S-1200），
     *       2026 年在用的整线机型缺失，会给真实询盘匹配出错误的型号。
     * ====================================================================== */
    {
      id: 'S-V1200',
      model: 'S-V1200',
      category: 'line',
      zh: 'PCB 真空上板机（长板）',
      en: 'PCB Vacuum Loader (long board)',
      aliases: ['SV1200', 'vacuum loader', 'loader', '上板机', '真空上板', '长板上板', '1.2m PCB'],
      summary_zh: '面向 1.2 m LED 长板的自动真空上板机，带上下操作平台与直通输送模式，Mitsubishi PLC 控制，SMEMA 接口。',
      summary_en: 'Automatic vacuum loader for 1.2 m LED long boards; up/down operation platform, pass-through conveyor mode, Mitsubishi PLC control and SMEMA interface.',
      specs: {
        '最大 PCB / Max PCB': 'L1200 × W390 mm',
        'PCB 存储量 / Magazine Capacity': '100 pcs',
        '输送速度 / Conveyor Speed': '9 m/min',
        '输送高度 / Conveyor Height': '920 ± 30 mm',
        '输送方向 / Direction': 'L→R / R→L',
        '可选步距 / Selectable Pitch': '10 / 20 / 30 / 40 / 50 mm',
        '外形尺寸 / Dimensions': 'L1500 × W950 × H1200 mm',
        '电源 / 气源 / Power / Air': '单相 220V 50Hz / 0.4–0.6 MPa',
        '净重 / Net Weight': '约 150 kg'
      },
      highlights_zh: ['真空吸板，缩短上板时间', '直通模式可当输送段使用', 'SMEMA 接口便于连线'],
      highlights_en: ['Vacuum loading shortens load time', 'Pass-through mode works as a conveyor', 'SMEMA interface for line integration'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'SP-1200',
      model: 'SP-1200',
      category: 'line',
      zh: '大幅面 LED 钢网印刷机',
      en: 'Large-Format LED PCB Stencil Printer',
      aliases: ['SP1200', 'printer', 'stencil printer', 'solder paste printer', '印刷机', '钢网印刷', '锡膏印刷', '1.2m 印刷'],
      summary_zh: '面向 1.2 m 长 LED 板的钢网印刷机，线性马达控制刮刀压力，支持大尺寸钢网，印刷质量直接影响后段贴装与 AOI 表现。',
      summary_en: 'Stencil printer for 1.2 m LED boards; linear-motor controlled squeegee pressure and large stencil support — printing quality directly drives placement and AOI performance.',
      specs: {
        '重复定位精度 / Repeat Accuracy': '±0.01 mm',
        '印刷精度 / Printing Accuracy': '±0.025 mm',
        '循环时间 / Cycle Time': '<9 s（不含印刷与清洗动作）',
        '换线时间 / Product Changeover': '<5 min',
        '兼容钢网 / Compatible Stencil': 'Min 470 × 370 mm，Max 1500 × 737 mm',
        '兼容 PCB / Compatible PCB': 'Max 1200 × 310 mm，Min 50 × 50 mm',
        'PCB 允许翘曲 / Allowed Warpage': '<1%（按对角线长度）',
        'PCB 底部间隙 / Bottom Clearance': '10 mm',
        'PCB 边缘间隙 / Edge Clearance': '3 mm',
        '传输速度 / Transport Speed': '100–1500 mm/sec，可编程',
        '传输方向 / Transport Direction': 'L→R / R→L / R→R / L→L',
        '刮刀速度 / Squeegee Speed': '10–150 mm/sec',
        '刮刀压力 / Squeegee Pressure': '0–15 kg',
        '刮刀角度 / Squeegee Angle': '60° 标准（可选 55° / 45°）',
        '气源 / Air': '4–6 kg/cm²',
        '电源 / Power': 'AC 220V ±10%，50/60Hz，单相 2.5 kW',
        '外形尺寸 / Dimensions': '1400 × 1200 × 1450 mm',
        '重量 / Weight': '约 1000 kg'
      },
      highlights_zh: ['大尺寸钢网与长板兼容', '钢网底部擦拭与清洗联动', '为后段贴装与 AOI 提供稳定印刷基础'],
      highlights_en: ['Large stencil and long-board compatible', 'Integrated stencil cleaning', 'Stable printing basis for placement and AOI'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-600SV',
      model: 'S-600SV',
      category: 'line',
      zh: '高速贴片机（长板 LED）',
      en: 'High-Speed SMT Placement Machine (long board)',
      aliases: ['S600SV', 'S600', 'mounter', 'placement', 'pick and place', '贴片机', '高速贴片机', 'LED 贴片', '长板贴片'],
      summary_zh: 'LED 整线的主产能工位，支持 1200 × 500 mm 长板与 12 贴装头，飞拍相机 12 组，视觉对位 + Mark 校正。',
      summary_en: 'Main capacity station of the LED line: 1200 × 500 mm long-board support, 12 placement heads, 12 flying cameras, vision alignment with Mark correction.',
      specs: {
        '贴装速度 / Placement Speed': '48,000 CPH（最优参考）',
        '贴装头数量 / Mounting Heads': '12',
        '最大 PCB / Max PCB': '1200 × 500 mm',
        '最小 PCB / Min PCB': '50 × 50 mm',
        'PCB 厚度 / PCB Thickness': '0.5–5 mm',
        '重复精度 / Repeat Precision': '±0.05 mm',
        '机械精度 / Mechanical Precision': '±0.02 mm',
        '图像识别精度 / Vision Precision': '±0.02 mm',
        '元件范围 / Component Range': '0201–16 mm（前相机标配）；0603–25 mm（后相机选配）',
        '元件高度 / Component Height': '标准 ≤16 mm；特殊 ≤10 mm',
        '飞拍相机 / Flying Vision Camera': '12 pcs 标配，1 pc 选配',
        'MARK 相机 / Mark Camera': '1 pc',
        'PCB 夹紧 / PCB Clamping': '气缸夹紧，轨道宽度可调',
        '轨道 / Rail': '三段式固定轨道',
        '操作系统 / Operating System': 'Windows 7'
      },
      highlights_zh: ['长板（1.2 m）贴装能力', '12 头 + 飞拍，产能与精度兼顾', '视觉对位 + Mark 校正'],
      highlights_en: ['Handles 1.2 m long boards', '12 heads with flying vision', 'Vision alignment with Mark correction'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-460E-L',
      model: 'S-460E-L',
      category: 'line',
      zh: '1.5 m 接驳输送机',
      en: '1.5 M Transfer Conveyor',
      aliases: ['S460EL', 'S460E', 'conveyor', 'transfer conveyor', 'buffer conveyor', '接驳台', '输送机', '接驳段'],
      summary_zh: '印刷、贴装、回流、AOI 与下板之间的输送与缓冲段，PLC 控制、可调速、防静电结构，SMEMA 兼容。',
      summary_en: 'Transfer and buffer conveyor between printing, placement, reflow, AOI and unloading stations; PLC controlled, adjustable speed, anti-static structure, SMEMA compatible.',
      specs: {
        '输送长度 / Conveyor Length': '1.5 m',
        '输送速度 / Speed': '0.5–20 m/min 可调',
        '传输高度 / Transfer Height': '900 ± 20 mm',
        '输送方向 / Direction': 'L→R / R→L（按项目确定）',
        '控制 / Control': 'PLC 控制，可调速，防静电输送结构',
        '操作 / Operation': '启停按钮、检测/停止功能',
        '接口 / Interface': 'SMEMA',
        '电源 / Power': 'AC 220V 单相'
      },
      highlights_zh: ['可作缓冲段平衡线体节拍', 'SMEMA 标准接口'],
      highlights_en: ['Works as buffer to balance line takt', 'Standard SMEMA interface'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-6600',
      model: 'S-6600',
      category: 'line',
      zh: '六温区回流焊炉',
      en: '6-Zone Reflow Oven',
      aliases: ['S6600', 'reflow', 'reflow oven', '回流焊', '回流炉', '六温区'],
      summary_zh: 'LED 整线回流焊接设备，上 6 + 下 6 小循环加热区，上热风下红外，适用无铅/有铅工艺，网带宽度 450 mm。',
      summary_en: 'Reflow soldering oven for the LED line: 6 top + 6 bottom small-cycle zones, top hot air with bottom infrared, lead-free and lead-based compatible, 450 mm mesh belt.',
      specs: {
        '控制方式 / Control': '仪表控制',
        '加热区 / Heating Zones': '上 6 + 下 6 小循环加热区',
        '加热方式 / Heating Method': '上：热风；下：红外',
        '加热区长度 / Heating Zone Length': '2300 mm',
        '网带宽度 / Mesh Belt Width': '450 mm',
        'PCB 尺寸范围 / PCB Size Range': '50–1200 mm',
        '最大 PCB 高度间隙 / Max PCB Clearance': '25 mm',
        '输送方向 / 方式': '左→右 / 网带',
        '网带高度 / Belt Height': '900 ± 20 mm',
        '输送速度 / Conveyor Speed': '0–1.8 m/min',
        '温度精度 / 范围': '±1–±2°C 静态 / 室温–300°C',
        '适用焊料 / Solder Type': '无铅焊料 / 有铅焊料',
        '电源 / Power': '380V，50Hz，三相五线',
        '启动 / 运行功率': '36 kW / 9–12 kW',
        '预热时间 / Warm-up Time': '约 20 min',
        '外形尺寸 / 重量': '3800 × 960 × 1350 mm / 约 300 kg'
      },
      highlights_zh: ['上下独立温区，温控 ±1–±2°C', '约 20 min 快速升温', '长板需按样品做温度曲线确认'],
      highlights_en: ['Independent top/bottom zones, ±1–±2°C accuracy', 'About 20 min warm-up', 'Long boards require sample-based profile verification'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-AX520XL',
      model: 'S-AX520XL / S-AX520',
      category: 'inspection',
      zh: 'DIP 双面 AOI 检测机',
      en: 'DIP Double-Side AOI',
      aliases: ['SAX520XL', 'SAX520', 'DIP AOI', 'AOI', 'inspection', '光学检测', '外观检测', '双面检测'],
      summary_zh: '一台设备完成上下双面检测（等效两台，节省空间），远心镜头 + 4 色可编程环形光源，支持锡点检测、弯曲/变形/缺针检测、SPC 预警与整板图像追溯。',
      summary_en: 'One machine inspects both sides (equivalent to two machines, saving floor space); telecentric lens with 4-color programmable ring light; solder joint, bending, deformation and missing-pin detection, SPC warning and full-panel image traceability.',
      specs: {
        '检测方式 / Inspection': '上下双面同时检测',
        '工业相机 / Industrial Camera': '5MP / 20MP 工业相机',
        '像素转换率 / Pixel Resolution': '5MP：24 μm、15 μm；20MP：15 μm',
        '视野 / FOV': '60 × 49 mm（5MP 24μm）；60 × 45 mm（20MP 15μm）',
        '镜头 / Lens': '远心镜头（Telecentric）',
        '光源 / Illuminant': '4 色可编程环形 LED（RGBW）',
        'X/Y 运动 / X/Y Movement': 'AC 伺服双驱',
        '轨道类型 / Track': '皮带标准，滚轮选配（高温/重载）',
        '传输方向 / Direction': '左→右 / 右→左，出厂设定',
        '操作系统 / OS': 'Windows 10',
        '通讯 / Communication': 'Ethernet、SMEMA',
        '电源 / 气源 / Power / Air': '单相 220V，50/60Hz，5A / 0.4–0.6 MPa',
        '输送高度 / Conveyor Height': '900 ± 20 mm 标准，740 ± 20 mm 选配'
      },
      highlights_zh: ['一机双面，省产线空间', 'SPC 实时预警 + 整板图像追溯', '条码换线自动调宽并调用程序'],
      highlights_en: ['Both sides in one machine', 'SPC warning and full-panel image traceability', 'Barcode-based line change with auto track widening'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'SULD1200',
      model: 'SULD1200',
      category: 'line',
      zh: '自动下板机（长板）',
      en: 'Automatic Unloader (long board)',
      aliases: ['unloader', '下板机', '收板机', '长板下板'],
      summary_zh: '检测后的自动收板工位，减少重复人工搬运，保护 1.2 m 长 LED 板在出板过程中不受损伤，可与线体通讯与输送高度统一规划。',
      summary_en: 'Automatic unloading station after inspection; reduces repeated manual handling and protects 1.2 m LED boards, with line communication and conveyor-height planning.',
      specs: {
        '适用 / Application': 'LED 长板（1.2 m）自动下板与收板',
        '详细参数 / Details': '按项目与收板方式确认（To be confirmed）'
      },
      highlights_zh: ['减少人工搬运，降低长板损伤风险', '与线体输送高度统一规划'],
      highlights_en: ['Less manual handling, lower risk of long-board damage', 'Conveyor height planned with the line'],
      sources: ['Internal solution archive (not public)']
    },

    /* ======================================================================
     * 2026-09 补齐：库内长期有方案文档、但产品库中缺失的机型
     *   参数逐条摘自对应方案原文，未在原文出现的参数一律不写（不臆造）。
     *   每条 sources 指向 _index/text 下的原始文档，可回溯核对。
     * ====================================================================== */
    {
      id: 'S-7180',
      model: 'S-7180',
      category: 'oddform',
      zh: '双头大件异形元件插件机',
      en: 'Dual-Head Odd-Form Insertion Machine',
      aliases: ['S7180', 'odd form', 'oddform', '异形插件', '大件插件', '双头插件', '连接器插件', '变压器插件'],
      summary_zh: '面向连接器、开关、插座、变压器线圈、端口、电容等大件异形元件的双头插件机；编带/振动盘/管式/托盘供料可组合，伺服支撑机构，视觉示教编程。',
      summary_en: 'Dual-head odd-form inserter for connectors, switches, sockets, transformer coils, ports and capacitors; combined tape/bowl/tube/tray feeding with servo support and vision teaching.',
      specs: {
        '视觉 / Vision': 'Mark CCD ×1、元件 CCD ×1',
        '插件头 / Insertion Heads': '2 pcs',
        '显示器 / Monitor': '2 pcs',
        'PCB 尺寸 / PCB Size': '50×50 – 450×500 mm',
        'PCB 厚度 / PCB Thickness': '0.6 – 2.0 mm',
        '插件精度 / Insertion Accuracy': '±0.03 mm',
        '插件速度 / Insertion Speed': '0.95 – 3.0 s/元件（平均约 0.9 元件/s）',
        '插件方向 / Direction': '0 – 360°',
        '产能参考 / Capacity': 'CPH ≈ 4000；单板约 2700 pcs（含进出板 5 s 与 MARK 识别 1 s）',
        '供料站 / Stations': '编带 ×2、振动盘 ×2、管式 ×2、托盘 ×1',
        '供料类型 / Feeder Type': 'Tape / Bowl / Stick / Roll / Tray',
        '支撑机构 / Support': '伺服（Servo）',
        'PCB 最大重量 / Max PCBA Weight': '2 kg',
        '元件高度 / Component Height': '30 mm',
        '元件尺寸 / Component Size': '50 mm',
        '适用元件 / Components': '连接器、开关、插座、变压器线圈、端口、电容等',
        '输送高度 / Conveyor Height': '750 ± 20 mm',
        'PCB 方向 / PCB Direction': 'L → R',
        '编程 / Programming': '手动 / 视觉示教系统',
        '操作系统 / OS': 'Windows',
        '电源 / Power': 'AC 220V 20A 50/60Hz；视在功率 3.0 – 3.5 kVA',
        '气源 / Air': '4.0 – 8 kg/m³',
        '环境 / Environment': '5 – 30°C，湿度 45% – 60%',
        '外形尺寸 / Dimensions': '900(L) × 1550(W) × 1560(H) mm',
        '重量 / Weight': '800 kg'
      },
      highlights_zh: ['双头同时插件，产能约为单头两倍', '四类供料可组合，适配连接器/变压器等大件', '视觉示教编程，换型快'],
      highlights_en: ['Two heads roughly double the throughput', 'Four feeder types combine for large parts', 'Vision teaching for fast changeover'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7000C',
      model: 'S-7000C',
      category: 'oddform',
      zh: '连接器插件机',
      en: 'Connector Inserter',
      aliases: ['S7000C', 'connector inserter', '连接器插件', '连接器', 'connector'],
      summary_zh: 'S7000 系列连接器自动插件机，单头至四头可选，插件速度最高 8,000 CPH；Excel 程序 + USB 导入并支持离线编程，运行成本低。',
      summary_en: 'S7000-series automatic connector inserter with one to four heads and up to 8,000 CPH; Excel + USB programming with off-line capability and low cost of ownership.',
      specs: {
        '插件头 / Insertion Heads': '单头至四头（可选）',
        '插件速度 / Insertion Speed': '最高 8,000 CPH',
        '适用元件 / Components': '连接器：最大长度 20 mm、最大宽度 13 mm、最大高度 26 mm',
        '功耗 / Power Supply': '2.0 kVA',
        '维护成本 / Maintenance': '约 RMB 2,000 / 月 / 台',
        '编程 / Programming': 'Excel 程序 + USB 输入；支持离线编程'
      },
      highlights_zh: ['一台设备可替代多工位人工插件', '能耗与维护成本低', '支持离线编程，不占用机时'],
      highlights_en: ['Replaces multiple manual insertion stations', 'Low energy and maintenance cost', 'Off-line programming'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7000D',
      model: 'S-7000D',
      category: 'oddform',
      zh: '轻触开关插件机',
      en: 'Tact Switch Inserter',
      aliases: ['S7000D', 'tact switch', '轻触开关', '开关插件', 'tact switch inserter'],
      summary_zh: 'S7000 系列轻触开关自动插件机，单头至四头可选，插件速度最高 8,000 CPH；适配 6.0×6.0 至 10×10 外径、柄长 ≤3.5 mm 的轻触开关。',
      summary_en: 'S7000-series tact switch inserter with one to four heads and up to 8,000 CPH, handling tact switches of 6.0×6.0 to 10×10 mm with handle length up to 3.5 mm.',
      specs: {
        '插件头 / Insertion Heads': '单头至四头（可选）',
        '插件速度 / Insertion Speed': '最高 8,000 CPH',
        '适用元件 / Components': '轻触开关：外径 6.0×6.0 – 10×10 mm，柄长 ≤ 3.5 mm',
        '功耗 / Power Supply': '2.0 kVA',
        '维护成本 / Maintenance': '约 RMB 2,000 / 月 / 台',
        '编程 / Programming': 'Excel 程序 + USB 输入；支持离线编程',
        '原文备注 / Source Note': '原文前置页标题误写为 Connector Inserter，元件规格页与末页均为 Tact Switch Inserter，此处以元件规格为准'
      },
      highlights_zh: ['专攻轻触开关自动插件', '能耗与维护成本低', '支持离线编程'],
      highlights_en: ['Dedicated to tact switch insertion', 'Low energy and maintenance cost', 'Off-line programming'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7000T',
      model: 'S-7000T',
      category: 'terminal',
      zh: '端子（Faston／编带）自动插件机',
      en: 'Terminal (Faston / Tape) Insertion Machine',
      aliases: ['S7000T', 'terminal insertion', '端子插件', '端子机', 'Faston', '编带端子', '铆接'],
      summary_zh: '针对 Faston 端子与编带端子的自动插件机：工控机 + 运动控制卡，Panasonic 伺服驱动，视觉自动校正，具备漏件检测；1–4 插件头可选，内铆/外铆/N 型铆压，可接 MES。',
      summary_en: 'Automatic inserter for Faston and tape terminals: industrial PC with motion control card, Panasonic servo drive, automatic vision correction and missing-part detection; 1–4 heads, inward/outward/N clinching, MES-capable.',
      specs: {
        '操作系统 / OS': '工控机 + 运动控制卡，Windows 环境运行',
        '插件速度 / Insertion Speed': '0.55 秒/件（理论）',
        '驱动 / Drive': 'Panasonic AC 伺服，高速、低噪、运行平稳',
        '视觉系统 / Vision': '工业级高清相机 + 自动视觉校正软件',
        '漏件检测 / Missing Part': '具备漏插检测（无补插功能）',
        '插件头数 / Heads': '1 – 4 可选',
        '设备尺寸 / Dimensions': '1660 × 1600 × 1530 mm（2 头）',
        '重量 / Weight': '1500 kg',
        'PCB 尺寸 / PCB Size': '380 × 280 mm（可加大定制）',
        '端子厚度 / Terminal Thickness': '≥ 0.5 mm，≤ 1.2 mm',
        '垂直度误差 / Vertical Error': '≤ 0.8°',
        'PCB 要求 / PCB Requirement': '插件孔径比元件脚大 0.5 ± 0.1 mm',
        '插件角度 / Insertion Angle': '360°（增量 1°）',
        '元件间距 / Body Distance': '≥ 2 mm',
        '铆压方式 / Clinching': '内铆 / 外铆 / N 型',
        '供料系统 / Feeding': '编带供料或振动盘 + 导料',
        '运动精度 / Motion Accuracy': '0.001 mm / pulse',
        '运动系统 / Motion System': 'Panasonic 控制器与电机',
        '编程 / Programming': '在线视觉编程、视觉校正、Excel 导入',
        '数据导入 / Data Import': 'USB 接口导入，或手动录入',
        '通讯 / Communication': 'RS-232C（可接入 MES 系统）',
        '显示 / Display': '17 英寸彩色 LCD',
        '环境 / Environment': '湿度 30% – 70%',
        '电源 / Power': '单相 220V/AC，50/60Hz，2 kVA',
        '产能参考 / Capacity': '27 件/板：3600 CPH、UPH ≈ 101；19 件/板：4000 CPH、UPH ≈ 146',
        '应用行业 / Industries': '家电、汽车、电源，及其他电子（数字表、电子元件等）'
      },
      highlights_zh: ['一台设备可替代至少 10 名插件工人', '支持 MES 对接与离线编程', '铆压方式可选，适配不同端子'],
      highlights_en: ['One machine replaces at least 10 operators', 'MES-ready with off-line programming', 'Selectable clinching modes'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-7002P',
      model: 'S-7002P',
      category: 'terminal',
      zh: '方形 PIN 双头自动插件机',
      en: 'Square-Pin Dual-Head Insertion Machine',
      aliases: ['S7002P', 'pin insertion', 'PIN 插件', '方形 PIN', '双头插件机', 'square pin'],
      summary_zh: 'S-70 系列方形 PIN 专用自动插件机：PC 控制 + 伺服驱动 + 视觉编程，SMEMA 接口，PCB 自动上板；标配双头（8 pcs/头），最高 6,500 CPH。',
      summary_en: 'S-70 series inserter dedicated to square pins: PC control, servo drive and vision programming with SMEMA and automatic PCB loading; dual heads (8 pins each), up to 6,500 CPH.',
      specs: {
        '定位 / Positioning': '方形 PIN 自动插件专用机型（S-70 系列）；PC 控制、伺服电机驱动、视觉编程',
        '机器尺寸 / Dimensions': '1450 × 1300 × 1600 mm (L×W×H)',
        '插件速度 / Speed': '最高 6,500 CPH（约 0.55 元件/s）',
        'PCB 尺寸 / PCB Size': '50×50 – 400×400 mm',
        'PCB 厚度 / PCB Thickness': '0.79 – 2.36 mm',
        '相邻元件间距 / Component Clearance': '≥ 2 mm',
        '驱动系统 / Drive System': 'AC 伺服 + AC 电机',
        '编程与校正 / Programming': '机器视觉（0.3M CCD）在线编程、自动校正、自动识别 MARK 点',
        '传送 / PCB Transfer': 'L → R / R → L（可选）在线式；PCB 自动上板',
        '气源 / Air Pressure': '0.6 – 0.8 MPa',
        '电源 / Power': '单相 220V 50/60Hz，配 UPS',
        '操作系统 / OS': 'Windows；USB 数据接口；SMEMA 接口',
        '重量 / Weight': '1000 kg',
        '产能参考 / Capacity': '24 pin（3×8）：约 13.2 s/板、UPH ≈ 273；16 pin（2×8）：约 8.8 s/板、UPH ≈ 409'
      },
      highlights_zh: ['专为方形 PIN 插件设计，精度稳定', '双头 8 pcs/头，产能高', '视觉编程 + 自动校正，换型方便'],
      highlights_en: ['Purpose-built for square pins', 'Dual 8-pin heads for high throughput', 'Vision programming with auto correction'],
      sources: ['Internal solution archive (not public)']
    },
    {
      id: 'S-800S',
      model: 'S-800S',
      category: 'smt',
      zh: '8 头高速贴片机',
      en: '8-Head High-Speed Placement Machine',
      aliases: ['S800S', 'S-800s', 'pick and place', 'mounter', '贴片机', '高速贴片机', '八头贴片'],
      summary_zh: '8 头高速贴片机，磁悬浮直线电机 X/Y 轴 + 步进伺服 Z 轴，飞拍对位与大件底部视觉；标配 20 编带供料（可选 20+20），适合中大批量生产。',
      summary_en: '8-head high-speed placement machine with magnetic-levitation linear motors on X/Y, step-servo Z, flying vision plus bottom vision for large parts; 20 tape feeders standard (20+20 optional), suited to medium-to-high volume.',
      specs: {
        '贴装头数 / Number of Heads': '8',
        '飞拍视觉 / Flying Vision': '标配',
        '贴装速度 / Placement Rate': '32,000 CPH（最优条件）；IPC9850 26,800 CPH',
        '供料器容量 / Feeder Capacity': '前后各 20 编带（8 mm / 12 mm 电动，标配）；可选 20+20',
        'IC 托盘 / IC Tray Capacity': '325 × 135 mm × 2',
        '元件尺寸（头相机）/ Head Camera': '最小 0402 (inch)，最大 10 × 8 mm',
        '元件尺寸（底部相机）/ Bottom Camera': '最小 1206 (inch)，最大 30 × 30 mm',
        'X/Y 轴 / X-Y Axis': '磁悬浮直线电机',
        'Z 轴 / Z Axis': '步进伺服电机（每头独立）',
        '旋转 / Rotation': '0 – 360°',
        '贴装精度 / Placement Accuracy': '±0.05 mm',
        '平台 / Platform': '大理石平台（抗变形、高精度、高稳定）',
        '视觉系统 / Vision System': '飞拍对位 + 大件/IC 底部视觉 + Fiducial 识别与坐标校正',
        '输送 / Conveyor': '三段式输送，SMEMA 接口，自动调宽',
        '吸嘴 / Nozzle': '智能吸嘴系统，自动检测与更换',
        '适用基板 / Substrates': 'PCB、FPC、MCPCB、PSB 等',
        '适用元件 / Components': '电阻、电容、IC、QFP、CFP 等',
        '实测产能 / Actual Throughput': 'LED 球泡 30,000 CPH（3000 只/小时，10 颗/只）；LED 灯管 35,000 CPH（583 支/小时，60 颗/支）',
        '投资回报参考 / ROI (原文示例)': '单线投资约 $70K、月成本约 $10K，ROI < 9 个月'
      },
      highlights_zh: ['8 头 + 磁悬浮直线电机，32,000 CPH', '飞拍 + 底部视觉，兼顾小件与大件/IC', '大理石平台，长期精度稳定'],
      highlights_en: ['8 heads with magnetic levitation linear motors, 32,000 CPH', 'Flying plus bottom vision for small and large parts', 'Marble platform for long-term accuracy'],
      sources: ['Internal solution archive (not public)']
    },
    {
      /* 型号取自方案文件名；正文规格页未重复标注编号（原文写的是"非标视觉精密三轴自动点胶机"） */
      id: 'SM-CCD331',
      model: 'SM-CCD331',
      category: 'peripheral',
      zh: '视觉精密三轴自动点胶机',
      en: 'Vision-Guided 3-Axis Precision Dispenser',
      aliases: ['dispensing', 'dispenser', '点胶机', '点胶', 'glue dispensing', '红胶', 'UV胶', '三轴点胶'],
      summary_zh: '带 CCD 视觉定位与激光测高的三轴自动点胶机，可点、线、面、圆弧与不规则曲线连续插补；支持 AUTO CAD 导入，SMEMA 通讯并预留 MES 接口。',
      summary_en: 'Three-axis automatic dispenser with CCD vision positioning and laser height measurement; supports dot/line/area/arc/irregular-curve interpolation, AutoCAD import, SMEMA and MES-ready interface.',
      specs: {
        '视觉 / Vision': 'CCD 视觉定位（500 万像素）+ 激光测高；观察相机可上下与俯仰调节',
        '三轴行程 / Strokes': 'X、Y：400 mm；Z：100 mm（精密滚珠丝杆）',
        '最小吐出量 / Min. Discharge': '0.01 ml',
        '点胶频率 / Dispensing Frequency': '5 次/秒',
        '最大负载 / Max Load': '8 kg',
        '移动速度 / Moving Speed': '0 – 800 mm/sec',
        '电机 / Motor': 'Panasonic 伺服电机（日本）',
        '光电开关 / Photoelectric Switch': 'Omron（日本）',
        '传动 / Transmission': '台湾 TPI 研磨丝杆',
        '程序记录 / Program Records': '1000 组',
        '显示 / Display': 'LCD 示教盒',
        '操作系统 / OS': 'WINDOWS 7 中文界面；SMEMA 通讯；预留 MES 接口',
        '点胶功能 / Functions': '点、线、面、圆弧、圆、不规则曲线连续插补与多轴联动；区域阵列、平移、旋转计算',
        '参数化 / Parameters': '胶量、胶速、点胶时间、停胶时间均可参数化，出胶稳定、线条圆润',
        '编程 / Programming': '支持 AUTO CAD 文件导入',
        '供胶方式 / Glue Supply': '针筒 10 / 30 / 50 / 200 ml；压力桶 330 ml / 2600 ml / 1 加仑 / 5 加仑',
        '适用胶水 / Glue Types': '非接触：SMT 红胶、UV 胶、热熔胶、硅胶、环氧树脂；接触式：AB 结构胶、快干胶、硅胶、黄胶等',
        '输入电源 / Input Power': '全电压 AC 110V – 220V',
        '外部控制接口 / External Control': 'RS232'
      },
      highlights_zh: ['CCD 定位 + 激光测高，胶路精度高', '支持 AUTO CAD 导入，编程快', '一台设备适配多种胶水与供胶方式'],
      highlights_en: ['CCD positioning with laser height measurement', 'AutoCAD import simplifies programming', 'One machine handles multiple glue types'],
      sources: ['Internal solution archive (not public)']
    }
  ]
};
