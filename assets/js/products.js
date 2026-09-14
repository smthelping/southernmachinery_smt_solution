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
      aliases: ['loader', 'unloader', 'conveyor', '上下板机', '接驳台', 'magazine', 'BHS', 'SLD390', 'SULD390', 'S-350C'],
      summary_zh: '整线板处理单元：Magazine Loader / Unloader、接驳台、缓存机，构成 SMT / THT 自动连线。',
      summary_en: 'Board handling units: magazine loader / unloader, conveyors and buffers for automatic SMT / THT in-line connection.',
      specs: {
        '机型 / Models': 'SLD250 / SLD390（上板机）、SULD250 / SULD390（下板机）、S-350C（接驳台）',
        '轨道宽度 / Track Width': '50 – 460mm',
        '传输高度 / Height': '920±20mm',
        '接口 / Interface': 'SMEMA'
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
    }
  ]
};
