/* ==========================================================================
 * app.js — 主控制器：向导流程、AI 调用编排、预览与导出
 * ========================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = DocGen.esc;

  let state = Store.get();
  const logs = [];

  /* ============================ 通用 ============================ */
  function log(msg, type) {
    const t = new Date().toLocaleTimeString();
    logs.unshift(`[${t}] ${msg}`);
    if (logs.length > 40) logs.pop();
    const dot = $('#logDot');
    dot.className = 'dot' + (type === 'busy' ? ' busy' : type === 'err' ? ' err' : '');
    $('#logText').textContent = msg;
    $('#logText').title = logs.join('\n');
    if (type === 'err') console.error(msg);
  }
  function fail(err) {
    const msg = (err && err.message) ? err.message : String(err);
    log(msg, 'err');
    alert(msg);
  }
  function fmtNum(n) { return Number(n || 0).toLocaleString(); }

  /* ============================ 步骤导航 ============================ */
  function goto(step) {
    $$('.step').forEach(b => b.classList.toggle('active', b.dataset.step === step));
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + step));
    Store.set({ step });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function markDone(step, done) {
    const b = $(`.step[data-step="${step}"]`);
    if (b) b.classList.toggle('done', !!done);
  }

  /* ============================ 1. 询盘 ============================ */
  function updateInquiryMeta() {
    const v = $('#inquiryText').value;
    $('#inquiryMeta').textContent = `${v.length} 字`;
  }

  function bindInquiry() {
    const sel = $('#sampleSelect');
    SM_CONFIG.samples.forEach((s, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = s.title;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => {
      const s = SM_CONFIG.samples[Number(sel.value)];
      if (s) {
        $('#inquiryText').value = s.text;
        state.rawInquiry = s.text;
        updateInquiryMeta();
        log('已载入示例询盘，可直接点击「解析询盘」。');
      }
      sel.value = '';
    });
    $('#inquiryText').addEventListener('input', () => {
      state.rawInquiry = $('#inquiryText').value;
      updateInquiryMeta();
    });
    $('#btnClearInquiry').addEventListener('click', () => {
      $('#inquiryText').value = '';
      state.rawInquiry = '';
      updateInquiryMeta();
    });
    $('#btnParseInquiry').addEventListener('click', doParse);
    $('#keySpecs').addEventListener('change', () => {
      collectFields();
    });
    $$('#fieldsForm input, #fieldsForm textarea, #fieldsForm select').forEach(el => {
      el.addEventListener('change', collectFields);
    });
    updateInquiryMeta();
  }

  async function doParse() {
    const text = $('#inquiryText').value.trim();
    if (text.length < 20) { fail(new Error('请先粘贴客户询盘邮件全文（至少 20 个字符）。')); return; }
    state.rawInquiry = text;
    log('正在解析询盘…', 'busy');
    $('#btnParseInquiry').disabled = true;
    try {
      const res = await Parse.parse(text);
      Store.set({ fields: res.fields });
      state = Store.get();
      renderFields();
      renderMissing();
      $('#parseSource').className = 'badge ' + (res.source === 'ai' ? 'ok' : 'warn');
      $('#parseSource').textContent = res.source === 'ai' ? 'AI 解析完成' : '规则解析（未配置 LLM）';
      markDone('inquiry', true);
      renderCandidates(Match.candidates(state.fields));
      log(res.note || `解析完成：${state.fields.customer_name || '未识别客户名'} · ${(state.fields.products_requested || []).join(' / ') || '未识别产品'}`);
    } catch (err) {
      fail(err);
    } finally {
      $('#btnParseInquiry').disabled = false;
    }
  }

  function renderFields() {
    const f = state.fields;
    if (!f) return;
    $('#fieldsEmpty').classList.add('hidden');
    $('#fieldsForm').classList.remove('hidden');
    $$('#fieldsForm [data-field]').forEach(el => {
      const v = f[el.dataset.field];
      el.value = (v === undefined || v === null) ? '' : v;
    });
    $$('#fieldsForm [data-array]').forEach(el => {
      const v = f[el.dataset.array];
      el.value = Array.isArray(v) ? v.join(', ') : (v || '');
    });
    $('#keySpecs').value = Object.keys(f.key_specs || {}).map(k => `${k}=${f.key_specs[k]}`).join('\n');
  }

  function collectFields() {
    if (!state.fields) state.fields = {};
    const f = state.fields;
    $$('#fieldsForm [data-field]').forEach(el => { f[el.dataset.field] = el.value.trim(); });
    $$('#fieldsForm [data-array]').forEach(el => {
      f[el.dataset.array] = el.value.split(/[,，;；\n]/).map(s => s.trim()).filter(Boolean);
    });
    const specs = {};
    $('#keySpecs').value.split('\n').forEach(line => {
      const m = line.split(/[=:：]/);
      if (m.length >= 2 && m[0].trim()) specs[m[0].trim()] = m.slice(1).join('=').trim();
    });
    f.key_specs = specs;
    Store.set({ fields: f }, { notify: false });
  }

  function renderMissing() {
    const miss = Parse.missing(state.fields || {});
    const box = $('#missingHint');
    if (!miss.length) {
      box.className = 'notice hidden';
      return;
    }
    box.className = 'notice warn';
    box.innerHTML = `<b>询盘中未获取到的关键字段：</b>${miss.map(m => esc(m.label)).join('、')} —— 这些字段会在第 2 步「前置条件」中作为待确认事项。</b>`;
  }

  /* ============================ 2. 前置条件 ============================ */
  function bindChecklist() {
    $('#btnGenChecklist').addEventListener('click', doChecklist);
    $('#btnSaveChecklist').addEventListener('click', () => {
      collectChecklist();
      const r = Store.saveDraft();
      log(r.ok ? '清单修改已保存到本地草稿。' : r.message, r.ok ? '' : 'err');
    });
    $('#btnCopyQuestions').addEventListener('click', copyQuestions);
  }

  async function doChecklist() {
    if (!state.fields) { fail(new Error('请先完成第 1 步：解析客户询盘。')); return; }
    log('正在生成前置条件清单…', 'busy');
    $('#btnGenChecklist').disabled = true;
    try {
      const res = await Parse.checklist(state.fields);
      Store.set({ checkpoints: res.items, checklistMeta: { source: res.source, blocking: res.blocking || null } });
      state = Store.get();
      renderChecklist();
      markDone('checklist', true);
      log((res.note || `已生成 ${res.items.length} 项待确认事项。`));
    } catch (err) {
      fail(err);
    } finally {
      $('#btnGenChecklist').disabled = false;
    }
  }

  function renderChecklist() {
    const items = state.checkpoints || [];
    if (!items.length) {
      $('#checklistEmpty').classList.remove('hidden');
      $('#checklistWrap').classList.add('hidden');
      return;
    }
    $('#checklistEmpty').classList.add('hidden');
    $('#checklistWrap').classList.remove('hidden');

    const body = $('#checklistBody');
    body.innerHTML = items.map((it, i) => `
      <tr data-idx="${i}">
        <td><input type="checkbox" class="ck-confirm" ${it.confirmed ? 'checked' : ''}></td>
        <td><span class="pill ${esc(it.priority || 'medium')}">${esc(it.priority || 'medium')}</span></td>
        <td><input class="input sm cl-category" value="${esc(it.category || '')}"></td>
        <td>
          <div contenteditable="true" data-cl="item_en" class="sm-en">${esc(it.item_en || '')}</div>
          <div contenteditable="true" data-cl="item_zh" class="zh">${esc(it.item_zh || '')}</div>
        </td>
        <td>
          <div contenteditable="true" data-cl="why_en">${esc(it.why_en || '')}</div>
          <div contenteditable="true" data-cl="why_zh" class="zh">${esc(it.why_zh || '')}</div>
        </td>
        <td>
          <div contenteditable="true" data-cl="known_value">${esc(it.known_value || '')}</div>
          <div class="hint">${esc(it.status || '')}</div>
        </td>
      </tr>`).join('');

    const meta = state.checklistMeta || {};
    const bl = meta.blocking;
    const box = $('#blockingBox');
    if (bl && ((bl.en && bl.en.length) || (bl.zh && bl.zh.length))) {
      box.classList.remove('hidden');
      box.innerHTML = `<b>在得到以下信息前无法给出正式报价：</b><ul>${
        (bl.en || []).map(x => `<li>${esc(x)}</li>`).join('')}${
        (bl.zh || []).map(x => `<li class="zh" style="color:#8a4b22">${esc(x)}</li>`).join('')}</ul>`;
    } else {
      box.classList.add('hidden');
    }
  }

  function collectChecklist() {
    const items = state.checkpoints || [];
    $$('#checklistBody tr').forEach(tr => {
      const i = Number(tr.dataset.idx);
      const it = items[i];
      if (!it) return;
      const cb = tr.querySelector('.ck-confirm');
      if (cb) it.confirmed = cb.checked;
      const cat = tr.querySelector('.cl-category');
      if (cat) it.category = cat.value.trim();
      tr.querySelectorAll('[data-cl]').forEach(el => { it[el.dataset.cl] = el.innerText.trim(); });
    });
    Store.set({ checkpoints: items }, { notify: false });
  }

  async function copyQuestions() {
    collectChecklist();
    const items = (state.checkpoints || []).filter(i => !i.confirmed);
    if (!items.length) { fail(new Error('没有待确认事项（或清单未生成）。')); return; }
    const f = state.fields || {};
    const header = [
      `Dear ${f.contact_person || f.customer_name || 'Sir/Madam'},`,
      '',
      'Thank you for your inquiry. To prepare an accurate solution and quotation, could you please confirm the following:',
      ''
    ].join('\n');
    const body = items.map((it, i) => `${i + 1}. ${it.ask_en || it.item_en}${it.ask_zh ? '\n   ' + it.ask_zh : ''}`).join('\n');
    const footer = ['', 'Best regards,', (state.doc.editor || SM_CONFIG.doc.editor), SM_CONFIG.company.en, SM_CONFIG.company.website].join('\n');
    const text = header + body + footer;
    const ok = await Exporter.copyText(text);
    log(ok ? `已复制 ${items.length} 条问句到剪贴板（可用作回复客户的邮件正文）。` : '复制失败，请手动选择文本。', ok ? '' : 'err');
    if (!ok) window.prompt('复制失败，请手动复制：', text);
  }

  /* ============================ 3. 客户背调 ============================ */
  function bindBackground() {
    $('#btnGenBackground').addEventListener('click', doBackground);
    $('#chkIncludeBackground').addEventListener('change', e => {
      state.doc.includeBackground = e.target.checked;
      Store.set({ doc: state.doc }, { notify: false });
    });
  }

  async function doBackground() {
    if (!state.fields) { fail(new Error('请先完成第 1 步：解析客户询盘。')); return; }
    if (!LLM.ready()) {
      fail(new Error('客户背景调查需要调用 LLM：请先在「设置」中填写 Base URL、API Key 与模型，然后点击「测试连接」。'));
      return;
    }
    log('正在生成客户背景调查结论…', 'busy');
    $('#btnGenBackground').disabled = true;
    try {
      const p = SM_PROMPTS.background(state.fields, $('#bgNotes').value.trim());
      const { data } = await LLM.chatJSON({ system: p.system, user: p.user });
      Store.set({ background: data, backgroundNotes: $('#bgNotes').value.trim() });
      state = Store.get();
      renderBackground();
      markDone('background', true);
      log('背调结论已生成。');
    } catch (err) {
      fail(err);
    } finally {
      $('#btnGenBackground').disabled = false;
    }
  }

  function biListHtml(en, zh) {
    const e = Array.isArray(en) ? en : (en ? [en] : []);
    const z = Array.isArray(zh) ? zh : (zh ? [zh] : []);
    let out = '';
    if (e.length) out += `<ul>${e.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (z.length) out += `<ul>${z.map(x => `<li class="zh" style="color:#41566e">${esc(x)}</li>`).join('')}</ul>`;
    return out;
  }

  function renderBackground() {
    const b = state.background;
    if (!b) {
      $('#bgEmpty').classList.remove('hidden');
      $('#bgResult').classList.add('hidden');
      return;
    }
    $('#bgEmpty').classList.add('hidden');
    $('#bgResult').classList.remove('hidden');
    $('#bgConfidence').textContent = '置信度：' + (b.confidence || 'unknown');
    $('#bgConfidence').className = 'badge ' + (b.confidence === 'high' ? 'ok' : b.confidence === 'low' ? 'warn' : '');

    const parts = [];
    if (b.company_profile_en || b.company_profile_zh) {
      parts.push(`<div class="res-block"><h4>公司概况 / Company profile</h4>${b.company_profile_en ? `<p>${esc(b.company_profile_en)}</p>` : ''}${b.company_profile_zh ? `<p class="zh" style="color:#41566e">${esc(b.company_profile_zh)}</p>` : ''}</div>`);
    }
    if (b.positioning_en || b.positioning_zh) {
      parts.push(`<div class="res-block"><h4>市场定位与采购动机 / Positioning</h4>${b.positioning_en ? `<p>${esc(b.positioning_en)}</p>` : ''}${b.positioning_zh ? `<p class="zh" style="color:#41566e">${esc(b.positioning_zh)}</p>` : ''}</div>`);
    }
    if ((b.cooperation_advice_en || []).length || (b.cooperation_advice_zh || []).length) {
      parts.push(`<div class="res-block"><h4>合作建议 / Cooperation advice</h4>${biListHtml(b.cooperation_advice_en, b.cooperation_advice_zh)}</div>`);
    }
    if ((b.match_strategy_en || []).length || (b.match_strategy_zh || []).length) {
      parts.push(`<div class="res-block"><h4>产品匹配策略 / Match strategy</h4>${biListHtml(b.match_strategy_en, b.match_strategy_zh)}</div>`);
    }
    if ((b.talking_points_en || []).length || (b.talking_points_zh || []).length) {
      parts.push(`<div class="res-block"><h4>沟通要点 / Talking points</h4>${biListHtml(b.talking_points_en, b.talking_points_zh)}</div>`);
    }
    if (b.payment_risk) {
      parts.push(`<div class="res-block"><h4>付款与信用风险 / Payment risk</h4><p>${esc(b.payment_risk)}</p></div>`);
    }
    if (Array.isArray(b.risk_alerts) && b.risk_alerts.length) {
      parts.push(`<div class="res-block"><h4>风险提示 / Risk alerts</h4>${b.risk_alerts.map(r => `
        <div style="margin:8px 0 10px">
          <span class="pill ${esc(r.level || 'medium')}">${esc(r.level || '')}</span>
          <b style="margin-left:6px">${esc(r.title_en || '')}</b>
          ${r.title_zh ? `<span class="zh" style="color:#41566e">／${esc(r.title_zh)}</span>` : ''}
          <div style="font-size:12.8px">${esc(r.detail_en || '')}</div>
          ${r.detail_zh ? `<div class="zh" style="font-size:12.8px;color:#41566e">${esc(r.detail_zh)}</div>` : ''}
          ${r.mitigation_en || r.mitigation_zh ? `<div style="font-size:12.5px;color:#8a4b22;margin-top:3px">对策 / Mitigation: ${esc(r.mitigation_en || r.mitigation_zh)}</div>` : ''}
        </div>`).join('')}</div>`);
    }
    if ((b.verify_checklist_en || []).length || (b.verify_checklist_zh || []).length) {
      parts.push(`<div class="res-block"><h4>建议人工核实 / To verify</h4>${biListHtml(b.verify_checklist_en, b.verify_checklist_zh)}</div>`);
    }
    $('#bgResult').innerHTML = parts.join('');
  }

  /* ============================ 4. 产品匹配 ============================ */
  function bindMatch() {
    $('#btnRunMatch').addEventListener('click', doMatch);
    $('#btnRecalcCand').addEventListener('click', () => {
      if (!state.fields) { fail(new Error('请先完成第 1 步：解析客户询盘。')); return; }
      renderCandidates(Match.candidates(state.fields));
      log('已重算候选机型。');
    });
    $('#btnNewProduct').addEventListener('click', doNewProduct);
    $('#btnAddProduct').addEventListener('click', addNewProduct);
  }

  function currentSelectedModels() {
    return $$('#candBody .ck-pick').filter(c => c.checked).map(c => c.dataset.model);
  }

  function renderCandidates(cands) {
    state.candidates = cands || [];
    const has = state.candidates.length;
    $('#candEmpty').classList.toggle('hidden', has);
    $('#candTable').classList.toggle('hidden', !has);
    if (!has) {
      $('#candBody').innerHTML = '';
      return;
    }
    const matchModels = ((state.match && state.match.matches) || []).map(m => m.model);
    const prev = state.selectedModels || matchModels;
    $('#candBody').innerHTML = state.candidates.map(c => {
      const checked = (!prev.length && c.fit === 'excellent') || prev.indexOf(c.product.model) >= 0;
      return `<tr>
        <td><input type="checkbox" class="ck-pick" data-model="${esc(c.product.model)}" ${checked ? 'checked' : ''}></td>
        <td><b>${esc(c.product.model)}</b></td>
        <td>${esc(c.product.en)}<div class="hint">${esc(c.product.zh)}</div></td>
        <td><span class="pill ${c.fit === 'excellent' ? 'ok' : c.fit === 'good' ? 'medium' : 'low'}">${c.score}</span></td>
        <td>${esc((c.reasons || []).join(' · '))}</td>
        <td class="hint">${c.evidence.map(e => esc(e.title)).join('<br>') || '—'}</td>
      </tr>`;
    }).join('');
    $$('#candBody .ck-pick').forEach(cb => cb.addEventListener('change', () => {
      state.selectedModels = currentSelectedModels();
      syncSelectedProducts();
      Store.set({ selectedModels: state.selectedModels }, { notify: false });
    }));
    state.selectedModels = currentSelectedModels();
    syncSelectedProducts();
  }

  function syncSelectedProducts() {
    const models = state.selectedModels || [];
    state.selectedProducts = SM_PRODUCTS.products.filter(p => models.indexOf(p.model) >= 0);
    Store.set({ selectedProducts: state.selectedProducts }, { notify: false });
  }

  async function doMatch() {
    if (!state.fields) { fail(new Error('请先完成第 1 步：解析客户询盘。')); return; }
    log('正在运行产品匹配…', 'busy');
    $('#btnRunMatch').disabled = true;
    try {
      const out = await Match.run(state.fields, state.rawInquiry);
      const models = (out.result.matches || []).map(m => m.model);
      Store.set({
        match: out.result,
        candidates: out.candidates,
        kbMatchHits: out.kbHits.map(h => ({ title: h.doc.title, score: h.score })),
        selectedModels: models
      });
      state = Store.get();
      renderMatchResult();
      renderCandidates(out.candidates);
      markDone('match', true);
      log(out.note || `匹配完成：${models.join(', ') || '无匹配机型'}（${out.result.source === 'ai' ? 'AI 精排' : '本地算法'}）`);
    } catch (err) {
      fail(err);
    } finally {
      $('#btnRunMatch').disabled = false;
    }
  }

  function renderMatchResult() {
    const m = state.match;
    if (!m) {
      $('#matchEmpty').classList.remove('hidden');
      $('#matchResult').classList.add('hidden');
      return;
    }
    $('#matchEmpty').classList.add('hidden');
    $('#matchResult').classList.remove('hidden');
    $('#matchSource').textContent = (m.source === 'ai' ? 'AI 精排' : '本地算法') + ' · 置信度 ' + (m.confidence || '—');
    $('#matchSource').className = 'badge ' + (m.confidence === 'high' ? 'ok' : m.confidence === 'low' ? 'warn' : '');

    const p = [];
    if ((m.matches || []).length) {
      p.push(`<div class="res-block"><h4>推荐机型 / Recommended models</h4>
        <table class="table sm-mini-table"><thead><tr><th style="width:120px">型号</th><th style="width:90px">适配度</th><th style="width:90px">数量</th><th>理由</th><th style="width:26%">历史依据</th></tr></thead>
        <tbody>${m.matches.map(x => `<tr>
          <td><b>${esc(x.model)}</b></td>
          <td><span class="pill ${x.fit === 'excellent' ? 'ok' : x.fit === 'good' ? 'medium' : 'low'}">${esc(x.fit || '')}</span></td>
          <td>${esc(x.qty || '')}</td>
          <td>${esc(x.reason_en || '')}${x.reason_zh ? `<div class="zh" style="color:#41566e">${esc(x.reason_zh)}</div>` : ''}</td>
          <td class="hint">${esc(x.source_doc || '—')}</td>
        </tr>`).join('')}</tbody></table></div>`);
    }
    if ((m.line_config || []).length) {
      p.push(`<div class="res-block"><h4>产线配置建议 / Line configuration</h4><ul>${
        m.line_config.map(x => `<li><b>${esc(x.model || '')}</b> — ${esc(x.step || '')}${x.note_en ? `<div class="hint">${esc(x.note_en)}</div>` : ''}${x.note_zh ? `<div class="hint zh" style="color:#41566e">${esc(x.note_zh)}</div>` : ''}</li>`).join('')}</ul></div>`);
    }
    if ((m.feeder_plan || []).length) {
      p.push(`<div class="res-block"><h4>供料方案 / Feeding plan</h4>
        <table class="table sm-mini-table"><thead><tr><th>元件</th><th>包装</th><th>供料器</th><th>数量</th><th>说明</th></tr></thead>
        <tbody>${m.feeder_plan.map(f => `<tr>
          <td>${esc(f.component || '')}</td><td>${esc(f.packaging || '')}</td>
          <td><b>${esc(f.feeder_model || '')}</b></td><td>${esc(f.qty || '')}</td>
          <td>${esc(f.note_en || '')}${f.note_zh ? `<div class="hint zh" style="color:#41566e">${esc(f.note_zh)}</div>` : ''}</td>
        </tr>`).join('')}</tbody></table></div>`);
    }
    const roi = (m.roi_estimate && m.roi_estimate.numbers) || null;
    const k = Match.metrics();
    if (roi && roi.known) {
      p.push(`<div class="res-block"><h4>ROI 测算（本地确定性算法）/ ROI estimate</h4>
        <div class="kv">
          <div>月度插装点数：<b>${fmtNum(roi.monthly_points)}</b></div>
          <div>手工所需人力：<b>${roi.operators_needed_manual} 人</b></div>
          <div>设备投入：<b>US$${fmtNum(roi.invest_usd)}</b>（${roi.machine_qty} 台）</div>
          <div>自动化后人力：<b>${roi.operators_after} 人</b>（一人多机）</div>
          <div>年度人工节省：<b>US$${fmtNum(roi.annual_saving_usd)}</b></div>
          <div>投资回收期：<b>${roi.payback_years} 年</b></div>
        </div>
        <div class="hint mt">测算前提：手工 ${k.MANUAL_RATE} 点/小时/人、设备 ${k.MACHINE_RATE} CPH、单台参考价 US$${fmtNum(k.MACHINE_PRICE_USD)}、人工年成本 US$${fmtNum(k.OPERATOR_ANNUAL_USD)}（历史方案口径）。</div>
      </div>`);
    } else if (roi) {
      p.push(`<div class="res-block"><h4>ROI 测算</h4><p class="hint">${esc(roi.note_zh || '')}</p></div>`);
    }
    if ((m.gaps || []).length) {
      p.push(`<div class="res-block" style="border-color:#f3d5b7;background:#fff8f2"><h4>缺口与技术待确认 / Gaps</h4><ul>${
        m.gaps.map(g => `<li>${esc(g.item_en || '')}${g.item_zh ? `<div class="zh" style="color:#8a4b22">${esc(g.item_zh)}</div>` : ''}<div class="hint">→ ${esc(g.action_en || '')} ${esc(g.action_zh || '')}</div></li>`).join('')}</ul></div>`);
    }
    $('#matchResult').innerHTML = p.join('');
  }

  async function doNewProduct() {
    const text = $('#npText').value.trim();
    if (text.length < 20) { fail(new Error('请粘贴供应商产品资料（至少 20 个字符）。')); return; }
    log('正在生成公司风格产品资料…', 'busy');
    $('#btnNewProduct').disabled = true;
    try {
      const out = await Match.newProduct(text, $('#npHints').value.trim());
      state.newProduct = out.product;
      renderNewProduct(out.product);
      $('#btnAddProduct').disabled = false;
      log(out.note || '产品资料已生成，请核对后加入产品库。');
    } catch (err) {
      fail(err);
    } finally {
      $('#btnNewProduct').disabled = false;
    }
  }

  function renderNewProduct(p) {
    const specs = Object.keys(p.specs || {}).map(k => `<tr><td>${esc(k)}</td><td>${esc(p.specs[k])}</td></tr>`).join('');
    $('#npResult').className = '';
    $('#npResult').innerHTML = `
      <div class="res-block">
        <h4>${esc(p.model || '')} — ${esc(p.name_en || '')}${p.name_zh ? ` / ${esc(p.name_zh)}` : ''}</h4>
        <div class="hint">分类：${esc(p.category || '')} ｜ 别名：${esc((p.aliases || []).join(', '))}</div>
        <p>${esc(p.summary_en || '')}</p>
        ${p.summary_zh ? `<p class="zh" style="color:#41566e">${esc(p.summary_zh)}</p>` : ''}
      </div>
      ${specs ? `<table class="table sm-mini-table"><thead><tr><th>参数 / Parameter</th><th>值 / Value</th></tr></thead><tbody>${specs}</tbody></table>` : ''}
      ${(p.highlights_en || []).length ? `<div class="res-block mt"><h4>卖点 / Highlights</h4>${biListHtml(p.highlights_en, p.highlights_zh)}</div>` : ''}
      ${(p.missing_info || []).length ? `<div class="notice warn"><b>参数缺口（需向供应商索取）：</b>${(p.missing_info || []).map(esc).join('、')}</div>` : ''}`;
  }

  function addNewProduct() {
    const p = state.newProduct;
    if (!p) return;
    Match.addProductToCatalogue(p);
    state.newProduct = null;
    $('#btnAddProduct').disabled = true;
    renderCandidates(Match.candidates(state.fields || {}));
    log(`新产品 ${p.model} 已加入本次会话产品库（未写入内置文件，刷新页面后失效）。`);
  }

  /* ============================ 5. 方案生成 ============================ */
  function bindSolution() {
    const doc = () => state.doc;
    $('#docNo').addEventListener('change', e => { doc().no = e.target.value.trim(); Store.set({ doc: doc() }, { notify: false }); });
    $('#docDate').addEventListener('change', e => { doc().date = e.target.value.trim(); Store.set({ doc: doc() }, { notify: false }); });
    $('#docEditor').addEventListener('change', e => { doc().editor = e.target.value.trim(); Store.set({ doc: doc() }, { notify: false }); });
    $('#docLang').addEventListener('change', e => {
      if (state.previewDirty && !confirm('切换语言会重新生成预览，预览区的手工修改将丢失。是否继续？')) {
        e.target.value = doc().language; return;
      }
      doc().language = e.target.value;
      Store.set({ doc: doc() }, { notify: false });
      renderPreview();
    });
    const toggles = [['chkRoi', 'includeRoi'], ['chkCases', 'includeCases'], ['chkRisks', 'includeRisks'], ['chkCommercial', 'includeCommercial']];
    toggles.forEach(([id, key]) => {
      $('#' + id).addEventListener('change', e => {
        doc()[key] = e.target.checked;
        Store.set({ doc: doc() }, { notify: false });
        renderPreview();
      });
    });
    $('#btnGenSolution').addEventListener('click', () => doGenerate({}));
    $('#btnResumeSections').addEventListener('click', () => doGenerate({ resumeSections: true }));
    $('#btnResetSections').addEventListener('click', () => {
      if (!confirm('将清空已生成的章节检查点，下次生成从第一章开始。是否继续？')) return;
      Sections.reset(state);
      secStatus = {};
      Store.set({ sectioned: state.sectioned }, { notify: false });
      renderProgress();
      log('章节检查点已清空。');
    });
    $('#genMode').addEventListener('change', e => {
      state.doc.genMode = e.target.value;
      Store.set({ doc: state.doc }, { notify: false });
      log(e.target.value === 'sectioned'
        ? '已切换为分章生成（长方案）：逐章生成、可中断续写。'
        : '已切换为一次生成：单次调用输出全文，适合短方案。');
    });
    $('#btnValidateNow').addEventListener('click', runExportCheck);
    $('#btnExportHtml').addEventListener('click', () => {
      if (!preExportGate()) return;
      capturePreview();
      Exporter.html(state);
      log('已导出单 HTML 方案文档。');
    });
    $('#btnExportMd').addEventListener('click', () => {
      if (!preExportGate()) return;
      capturePreview();
      Exporter.markdown(state);
      log('已导出 Markdown。');
    });
    $('#btnPrintDoc').addEventListener('click', () => {
      if (!preExportGate()) return;
      capturePreview();
      if (!Exporter.printDoc($('#docFrame'))) {
        log('未能定位预览文档，已改为打印当前页面。', 'err');
        return;
      }
      log('已打开打印窗口：目标选择「另存为 PDF」即可得到文字可选的高清 PDF。');
    });
    $('#btnPdfFast').addEventListener('click', async () => {
      if (!preExportGate()) return;
      capturePreview();
      const btn = $('#btnPdfFast');
      btn.disabled = true;
      log('正在生成 PDF（首次使用需联网加载排版库）…', 'busy');
      try {
        const blob = await Exporter.pdf($('#docFrame'), Exporter.filename(state, 'pdf'));
        log(`PDF 已下载（${(blob.size / 1024 / 1024).toFixed(2)} MB，图片版）。需要文字可检索的版本请用「导出 PDF（文字可选）」。`);
      } catch (err) {
        log(`${err.message}，已为你改用打印窗口方式。`, 'err');
        Exporter.printDoc($('#docFrame'));
      } finally {
        btn.disabled = false;
      }
    });
    $('#btnCopyBody').addEventListener('click', async () => {
      if (!state.content && !state.previewHtml) { fail(new Error('尚未生成方案。')); return; }
      const body = currentPreviewBody() || DocGen.render(state);
      const ok = await Exporter.copyText(Exporter.htmlToPlainText(body));
      log(ok ? '方案正文（纯文本）已复制到剪贴板。' : '复制失败。', ok ? '' : 'err');
    });
    $('#btnResetPreview').addEventListener('click', () => {
      if (state.previewDirty && !confirm('将丢弃预览区的手工修改，还原为生成结果。是否继续？')) return;
      renderPreview();
      log('已还原为生成结果。');
    });
    $('#docFrame').addEventListener('load', () => {
      try { $('#docFrame').contentDocument.designMode = 'on'; } catch (e) { /* ignore */ }
    });
    buildCommercialForm();
  }

  function buildCommercialForm() {
    const box = $('#commercialForm');
    box.innerHTML = Object.keys(state.commercial || {}).map(k =>
      `<label>${esc(k)}<input class="input" data-com="${esc(k)}" value="${esc(state.commercial[k])}"></label>`).join('');
    box.querySelectorAll('[data-com]').forEach(el => el.addEventListener('change', () => {
      state.commercial[el.dataset.com] = el.value;
      Store.set({ commercial: state.commercial }, { notify: false });
      if (state.doc.includeCommercial) renderPreview();
    }));
  }

  function syncDocInputs() {
    const d = state.doc || {};
    if (!d.no && (state.fields || {}).customer_name) {
      d.no = DocGen.makeNo(state.fields.customer_name || state.fields.customer_name_zh, 1);
    }
    if (!d.date) {
      const dt = new Date(), p = n => String(n).padStart(2, '0');
      d.date = `${dt.getFullYear()}/${p(dt.getMonth() + 1)}/${p(dt.getDate())}`;
    }
    $('#docNo').value = d.no || '';
    $('#docDate').value = d.date || '';
    $('#docEditor').value = d.editor || '';
    $('#docLang').value = d.language || 'both';
    $('#chkRoi').checked = d.includeRoi !== false;
    $('#chkCases').checked = d.includeCases !== false;
    $('#chkRisks').checked = !!d.includeRisks;
    $('#chkCommercial').checked = !!d.includeCommercial;
    $('#chkIncludeBackground').checked = !!d.includeBackground;
    $('#genMode').value = d.genMode || 'sectioned';
    state.doc = d;
  }

  /** 分章进度面板 */
  let secStatus = {};

  function renderProgress(cur, status, extra) {
    const box = $('#genProgress');
    const pr = Sections.progress(state);
    if (!Object.keys(secStatus).length && !pr.doneIds.length) {
      box.classList.add('hidden');
      $('#btnResumeSections').classList.add('hidden');
      $('#btnResetSections').classList.add('hidden');
      return;
    }
    box.classList.remove('hidden');

    const stateOf = id => secStatus[id] || (pr.doneIds.indexOf(id) >= 0 ? 'ok' : 'pending');
    const finished = pr.sections.filter(s => ['ok', 'skip', 'warn', 'fixed'].indexOf(stateOf(s.id)) >= 0).length;
    const pct = Math.round((finished / pr.total) * 100);
    const TEXT = { ok: '已完成', pending: '待生成', running: '生成中…', skip: '沿用检查点', warn: '完成（有提示）', fixed: '已修复', error: '失败' };
    const CLS = { ok: 'ok', warn: 'medium', error: 'high' };

    const rows = pr.sections.map(s => {
      const st = stateOf(s.id);
      const msg = (cur && cur.id === s.id && extra && extra.errors)
        ? extra.errors.map(e => e.message).join('；').slice(0, 90)
        : ((cur && cur.id === s.id && extra && extra.message) ? extra.message.slice(0, 90) : '');
      return `<tr>
        <td>${esc(s.label_zh || s.label_en)}</td>
        <td><span class="pill ${CLS[st] || ''}">${esc(TEXT[st] || st)}</span></td>
        <td class="hint">${s.ai ? `约 ${s.words || '—'} 词` : '产品库直出'}</td>
        <td class="hint">${esc(msg)}</td>
      </tr>`;
    }).join('');

    box.innerHTML = `
      <div class="notice">
        <b>分章进度：</b>${finished} / ${pr.total} 章（${pct}%）${pr.at ? ' · 检查点 ' + new Date(pr.at).toLocaleTimeString() : ''}
        <div class="progress mt"><span style="width:${pct}%"></span></div>
        <div class="hint mt">每章独立生成并单独校验；「关键规格参数」由产品库确定性生成，不经过模型。中断后可点「断点续写」从下一章继续。</div>
      </div>
      <table class="table sm-mini-table">
        <thead><tr><th style="width:32%">章节</th><th style="width:15%">状态</th><th style="width:15%">规模</th><th>说明</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    const remaining = pr.total - pr.doneIds.length;
    $('#btnResumeSections').classList.toggle('hidden', !(remaining > 0 && pr.doneIds.length > 0));
    $('#btnResetSections').classList.toggle('hidden', !pr.doneIds.length);
  }

  async function doGenerate(opts) {
    opts = opts || {};
    if (!state.fields) { fail(new Error('请先完成第 1 步：解析客户询盘。')); return; }
    if (!state.match) {
      log('尚未运行产品匹配，将使用本地知识库做基础匹配…', 'busy');
      const out = await Match.run(state.fields, state.rawInquiry);
      Store.set({ match: out.result, candidates: out.candidates, selectedModels: (out.result.matches || []).map(m => m.model) });
      state = Store.get();
      renderCandidates(out.candidates);
      renderMatchResult();
    }
    collectChecklist();
    syncDocInputs();

    const query = [state.fields.customer_name, (state.fields.products_requested || []).join(' '),
      (state.fields.component_types || []).join(' '), (state.selectedModels || []).join(' ')].join(' ');
    const kbHits = KB.search(query, { topK: 5 });
    const kbContext = KB.buildContext(kbHits, 8000);

    const payload = {
      fields: state.fields,
      checkpoints: state.checkpoints,
      match: state.match,
      productData: (state.selectedProducts || []).map(x => ({ model: x.model, en: x.en, zh: x.zh, specs: x.specs })),
      kbContext,
      background: state.background,
      language: state.doc.language,
      rawInquiry: state.rawInquiry
    };

    let ai = null;
    let validation = null;
    let repaired = false;
    const mode = (state.doc && state.doc.genMode) || 'sectioned';

    if (LLM.ready() && mode === 'sectioned') {
      /* ---------- 分章生成（长方案）：逐章生成 + 单章校验 + 检查点续写 ---------- */
      if (!opts.resumeSections) secStatus = {};
      const sc = Sections.plan();
      log(`分章生成中（长方案模式，共 ${sc.length} 章）${opts.resumeSections ? '：断点续写' : ''}…`, 'busy');
      $('#btnGenSolution').disabled = true;
      $('#btnResumeSections').disabled = true;
      renderProgress();
      try {
        const out = await Sections.run(state, {
          resume: true,
          reset: false,
          onProgress: (sec, status, extra) => {
            secStatus[sec.id] = status;
            renderProgress(sec, status, extra);
            const label = sec.label_zh || sec.label_en;
            if (status === 'running') log(`正在生成章节：${label}…`, 'busy');
            else if (status === 'ok') log(`章节完成：${label}${extra && extra.note ? '（' + extra.note + '）' : ''}`);
            else if (status === 'skip') log(`沿用检查点，跳过：${label}`);
            else if (status === 'warn') log(`章节完成，另有 ${(extra.errors || []).length} 项待人工确认：${label}`, 'err');
            else if (status === 'fixed') log(`章节已修复：${label}${extra && extra.note ? '（' + extra.note + '）' : ''}`);
            else if (status === 'error') log(`章节生成失败：${label} —— ${extra && extra.message}`, 'err');
          }
        });
        Store.set({ sectioned: state.sectioned }, { notify: false });
        validation = Validate.contract(state, out.content);
        ai = validation.content;
        validation.source = 'ai';
        validation.sectioned = out.stats;
        repaired = out.stats.repaired > 0;
        out.errors.filter(e => e.kind === 'call' || e.kind === 'repair').forEach(e => {
          validation.errors.push({ kind: 'section', message: `章节「${e.section}」生成失败：${e.message}` });
        });
        log(`分章完成：生成 ${out.stats.generated} 章 · 沿用检查点 ${out.stats.skipped} 章 · 修复 ${out.stats.repaired} 章 · 失败 ${out.stats.failed} 章`);
      } catch (err) {
        log('分章生成失败，已退回本地模板：' + err.message, 'err');
        ai = null;
        validation = null;
      } finally {
        $('#btnGenSolution').disabled = false;
        $('#btnResumeSections').disabled = false;
        renderProgress();
      }
    } else if (LLM.ready()) {
      log('正在撰写方案正文（一次生成）…', 'busy');
      $('#btnGenSolution').disabled = true;
      try {
        const p = SM_PROMPTS.solution(payload);
        const first = await LLM.chatJSON({ system: p.system, user: p.user });
        validation = Validate.contract(state, first.data);
        ai = validation.content;

        if (!validation.ok) {
          // 一次修复重试：把违规项回灌给模型，只重写被指出的部分
          log(`契约校验发现 ${validation.errors.length} 项问题，正在请模型修正…`, 'busy');
          try {
            const rp = SM_PROMPTS.repairSolution(payload, validation.errors, first.data);
            const second = await LLM.chatJSON({ system: rp.system, user: rp.user });
            const v2 = Validate.contract(state, second.data);
            repaired = true;
            if (v2.errors.length < validation.errors.length) {
              validation = v2;
              ai = v2.content;
            } else {
              log('模型修复未改善问题数量，保留第一版（已应用自动修复）。', 'err');
            }
          } catch (err) {
            log('修复重试失败，保留第一版校验结果：' + err.message, 'err');
          }
        }
      } catch (err) {
        log('AI 撰写失败，已使用本地模板生成：' + err.message, 'err');
        ai = null;
        validation = null;
      } finally {
        $('#btnGenSolution').disabled = false;
      }
    } else {
      log('未配置 LLM，使用本地模板生成方案正文（可在预览区手工完善）。');
    }

    // 本地模板路径也跑一次校验：验证模板自身产出的数字均可溯源
    if (!ai) {
      const local = DocGen.normalizeContent(Object.assign({}, state, { aiContent: null }));
      validation = Validate.contract(state, local);
      validation.source = 'local';
      if (validation.errors.length) {
        log(`本地模板校验发现 ${validation.errors.length} 项待人工确认的数字。`, 'err');
      }
    } else {
      validation.source = 'ai';
    }
    validation.repaired = repaired;

    const content = ai ? DocGen.normalizeContent(Object.assign({}, state, { aiContent: ai })) : validation.content;
    Store.set({
      aiContent: ai,
      content,
      validation: summarizeValidation(validation),
      kbMatchHits: kbHits.map(h => ({ title: h.doc.title, score: h.score }))
    });
    state = Store.get();
    renderPreview();
    renderValidation(state.validation);
    markDone('solution', true);
    log(ai
      ? `方案正文已生成${repaired ? '（含一次契约修复）' : ''}，${validation.errors.length ? `仍有 ${validation.errors.length} 项需人工确认` : '校验通过'}，请在预览区核对。`
      : '方案正文已按本地模板生成，建议配置 LLM 获得更贴合的文案。');
    goto('solution');
  }

  /** 校验结果瘦身后再落草稿，避免 localStorage 体积过大 */
  function summarizeValidation(v) {
    if (!v) return null;
    return {
      ok: v.ok,
      source: v.source,
      repaired: !!v.repaired,
      stats: v.stats || { errorCount: v.errors.length, warningCount: v.warnings.length },
      errors: (v.errors || []).slice(0, 40),
      warnings: (v.warnings || []).slice(0, 40),
      fixes: (v.fixes || []).slice(0, 40),
      at: new Date().toLocaleString()
    };
  }

  function renderValidation(v) {
    const box = $('#validationReport');
    const badge = $('#validateBadge');
    if (!v) {
      badge.className = 'badge';
      badge.textContent = '未校验';
      box.className = 'hint';
      box.textContent = '生成方案后自动校验：型号是否在产品库内、规格参数与正文数字是否能在客户输入 / 产品库 / 本地测算中找到出处。';
      return;
    }
    const e = (v.errors || []).length, w = (v.warnings || []).length, f = (v.fixes || []).length;
    badge.className = 'badge ' + (e ? 'err' : w ? 'warn' : 'ok');
    badge.textContent = e ? `${e} 项需人工确认` : w ? `通过（${w} 项提示）` : '校验通过';

    const parts = [];
    parts.push(`<div class="notice ${e ? 'warn' : ''}">
      <b>校验来源：</b>${v.source === 'ai' ? 'LLM 生成内容' : '本地模板'}${v.repaired ? ' · <b>已执行一次契约修复重试</b>' : ''}
      ${v.at ? ` · ${esc(v.at)}` : ''}<br>
      <b>结果：</b>错误 ${e} · 提示 ${w} · 自动修复 ${f}
      ${v.stats && v.stats.lineItems !== undefined ? ` · 设备行 ${v.stats.lineItems} · 规格组 ${v.stats.specGroups}` : ''}
    </div>`);

    if (f) {
      parts.push('<div class="res-block"><h4>已自动修复 / Auto-fixed</h4><ul>' +
        (v.fixes || []).map(x => `<li>${esc(x)}</li>`).join('') + '</ul></div>');
    }
    if (e) {
      parts.push('<div class="res-block" style="border-color:#f0c3c3;background:#fff7f7"><h4>需人工确认（禁止直接外发）/ To verify</h4><ul>' +
        (v.errors || []).map(x => `<li><b>[${esc(x.kind)}]</b> ${esc(x.message)}${x.context ? `<div class="hint">…${esc(x.context)}</div>` : ''}</li>`).join('') +
        '</ul><div class="hint">提示：这些数字/型号无法在客户输入或产品库中溯源，请在预览区直接修改，或补充对应资料后重新生成。</div></div>');
    }
    if (w) {
      parts.push('<div class="res-block"><h4>提示（可忽略）/ Warnings</h4><ul>' +
        (v.warnings || []).slice(0, 20).map(x => `<li>${esc(x.message)}${x.context ? `<div class="hint">…${esc(x.context)}</div>` : ''}</li>`).join('') + '</ul></div>');
    }
    if (!e && !w) {
      parts.push('<div class="res-block"><h4>所有型号与数字均可溯源</h4><div class="hint">型号在产品库内；规格参数与正文数字均能在客户输入、产品库或本地 ROI 测算中找到出处。</div></div>');
    }
    box.className = '';
    box.innerHTML = parts.join('');
  }

  function writePreview(body) {
    const frame = $('#docFrame');
    const html = DocGen.exportHtml(body, { title: (state.fields && state.fields.customer_name) || 'Solution', lang: 'en' });
    let doc = null;
    try { doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document); } catch (e) { doc = null; }
    if (!doc) {
      // file:// 直接双击打开时，浏览器会阻止访问同页 iframe —— 优雅降级
      state.previewUnavailable = true;
      state.previewHtml = body;
      $('#previewHint').innerHTML =
        '⚠️ 检测到以 <code>file://</code> 方式打开，浏览器安全策略阻止了预览区渲染。' +
        '其余功能不受影响，导出仍使用最新生成的内容。<br>如需「所见即所得」的编辑预览，请在 ' +
        '<code>solution-generator</code> 目录执行 <code>python -m http.server 8123</code>，' +
        '再访问 <code>http://127.0.0.1:8123/index.html</code>。';
      return;
    }
    state.previewUnavailable = false;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        doc.designMode = 'on';
        doc.addEventListener('input', () => {
          state.previewDirty = true;
          state.previewEdited = true;
          $('#previewHint').textContent = '预览区内容已修改（导出时以此为准）。';
        });
      } catch (e) { /* ignore */ }
    }, 60);
    $('#previewHint').textContent = '预览区内容可点击直接修改（所见即所得）；导出时以预览区当前内容为准。';
  }

  /** 导出前检查（渲染后校验）：返回 true 表示可以继续导出 */
  function preExportGate() {
    const body = currentPreviewBody();
    if (!body || body.indexOf('sm-doc') < 0) {
      fail(new Error('尚未生成方案，请先点击「生成 / 重新生成方案正文」。'));
      return false;
    }
    const r = Validate.exportCheck(body, state);
    renderValidation(summarizeValidation(Object.assign({}, r, { source: 'export', stats: { specGroups: r.sections } })));
    if (r.errors.length) {
      log(`导出前校验发现 ${r.errors.length} 项问题：${r.errors[0].message}`, 'err');
      return confirm(
        `导出前校验发现 ${r.errors.length} 项问题（详见校验报告）：\n- ` +
        r.errors.slice(0, 4).map(x => x.message).join('\n- ') +
        '\n\n仍要继续导出吗？建议先在预览区修正。'
      );
    }
    if (r.warnings.length) log(`导出前校验：${r.warnings.length} 项提示，可继续导出。`);
    return true;
  }

  /** 手动校验当前预览内容 */
  function runExportCheck() {
    const body = currentPreviewBody();
    if (!body || body.indexOf('sm-doc') < 0) { fail(new Error('尚未生成方案，无法校验。')); return; }
    const r = Validate.exportCheck(body, state);
    renderValidation(summarizeValidation(Object.assign({}, r, { source: 'export', stats: { specGroups: r.sections } })));
    log(r.ok
      ? `预览内容校验通过（${r.sections} 个章节，${r.warnings.length} 项提示）。`
      : `预览内容校验发现 ${r.errors.length} 项问题，请检查校验报告。`, r.ok ? '' : 'err');
  }

  function renderPreview() {
    const body = DocGen.render(state);
    state.previewHtml = body;
    state.previewDirty = false;
    writePreview(body);
  }

  function currentPreviewBody() {
    if (state.previewUnavailable) return state.previewHtml || '';
    const frame = $('#docFrame');
    try {
      return frame.contentDocument.body.innerHTML;
    } catch (e) { return state.previewHtml || ''; }
  }

  function capturePreview() {
    if (state.previewUnavailable) return;   // 无法读取预览内容时，沿用最近一次生成结果
    const body = currentPreviewBody();
    if (body && body.indexOf('sm-doc') >= 0) {
      state.previewHtml = body;
      Store.set({ previewHtml: body, previewEdited: !!state.previewEdited }, { notify: false });
    }
  }

  /* ============================ 6. 知识库 ============================ */
  function bindKb() {
    $('#btnImportKb').addEventListener('click', doImport);
    $('#kbFiles').addEventListener('change', () => {
      const n = $('#kbFiles').files.length;
      $('#kbImportLog').textContent = n ? `已选择 ${n} 个文件，点击「导入」开始解析。` : '';
    });
    $('#btnKbSearch').addEventListener('click', doKbSearch);
    $('#kbQuery').addEventListener('keydown', e => { if (e.key === 'Enter') doKbSearch(); });
  }

  async function doImport() {
    const files = $('#kbFiles').files;
    if (!files || !files.length) { fail(new Error('请先选择要导入的文件。')); return; }
    const logBox = $('#kbImportLog');
    $('#btnImportKb').disabled = true;
    try {
      const res = await KB.ingestFiles(files, p => {
        logBox.textContent = `解析中 ${p.index}/${p.total}：${p.name}`;
      });
      logBox.innerHTML = [
        `<b>成功导入 ${res.added.length} 个文件</b>（共 ${fmtNum(res.added.reduce((s, a) => s + a.chars, 0))} 字）`,
        res.skipped.length ? `<div style="color:#8a4b22">跳过 ${res.skipped.length} 个：${res.skipped.map(s => `${esc(s.name)}（${esc(s.reason)}）`).join('；')}</div>` : '',
        res.warnings.length ? `<div style="color:#8a4b22">${res.warnings.map(esc).join('<br>')}</div>` : ''
      ].join('');
      $('#kbFiles').value = '';
      refreshKb();
      log(`知识库已更新：新增 ${res.added.length} 篇文档。`);
    } catch (err) {
      fail(err);
    } finally {
      $('#btnImportKb').disabled = false;
    }
  }

  function doKbSearch() {
    const q = $('#kbQuery').value.trim();
    if (!q) { $('#kbResults').textContent = '请输入检索关键词。'; return; }
    const hits = KB.search(q, { topK: 8 });
    if (!hits.length) { $('#kbResults').innerHTML = '未命中任何文档。可尝试更通用的关键词，或先导入更多方案文档。'; return; }
    $('#kbResults').innerHTML = `<b>命中 ${hits.length} 篇：</b>` + hits.map(h => `
      <div class="res-block" style="margin-top:10px">
        <h4>${esc(h.doc.title)} <span class="pill">${esc(h.doc.category)}</span> <span class="hint">得分 ${h.score.toFixed(1)} · ${fmtNum(h.doc.chars)} 字</span></h4>
        <ul>${h.hits.map(x => `<li class="hint">L${x.line}: ${esc(x.text)}</li>`).join('')}</ul>
      </div>`).join('');
  }

  function refreshKb() {
    const s = KB.stats();
    $('#kbStats').innerHTML = `
      <div class="stat"><b>${fmtNum(s.total)}</b><span>文档总数（内置 ${fmtNum(s.builtin)} + 导入 ${fmtNum(s.user)}）</span></div>
      <div class="stat"><b>${(s.chars / 10000).toFixed(1)} 万</b><span>全文总字数</span></div>
      <div class="stat"><b>${Object.keys(s.categories).length}</b><span>语料分类</span></div>
      <div class="stat"><b>${esc(s.generatedAt || '—')}</b><span>内置语料生成时间</span></div>`;
    $('#kbBadge').textContent = `知识库 ${fmtNum(s.total)} 篇`;
    $('#kbBadge').className = 'badge ok';

    const chips = Object.keys(s.categories).sort().map(c =>
      `<span class="chip">${esc(c)} <b>${s.categories[c]}</b></span>`).join('');
    $('#kbCategories').innerHTML = chips;

    // 用户导入列表
    const users = KB.allDocs().filter(d => d.origin === 'user');
    if (!users.length) {
      $('#kbUserList').innerHTML = '<div class="hint">尚未导入自定义文档。内置语料已覆盖本库 126 份历史方案。</div>';
    } else {
      $('#kbUserList').innerHTML = `<b>已导入文档（${users.length}）：</b>` + users.map(d =>
        `<div class="row between" style="border-bottom:1px solid var(--line);padding:5px 0">
          <span>${esc(d.title)} <span class="hint">${fmtNum(d.chars)} 字</span></span>
          <button class="btn ghost sm" data-del="${esc(d.id)}">删除</button>
        </div>`).join('');
      $('#kbUserList').querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
        KB.removeDoc(b.dataset.del);
        refreshKb();
        log('已从知识库移除该文档。');
      }));
    }

    // 内置文档列表（可按关键词过滤）
    const builtin = KB.allDocs().filter(d => d.origin === 'builtin');
    const render = (filter) => {
      const list = builtin.filter(d => !filter || (d.title + ' ' + d.category).toLowerCase().indexOf(filter.toLowerCase()) >= 0);
      const shown = list.slice(0, 40);
      $('#kbBuiltinList').innerHTML = `<div class="row"><input id="kbListFilter" class="input sm" placeholder="过滤内置文档标题…" value="${esc(filter || '')}">
        <span class="hint">共 ${list.length} 篇，显示前 ${shown.length} 篇</span></div>
        <div class="mt">${shown.map(d => `<div style="border-bottom:1px solid var(--line);padding:4px 0;font-size:12.8px">
          ${esc(d.title)} <span class="pill">${esc(d.category)}</span> <span class="hint">${fmtNum(d.chars)} 字</span></div>`).join('')}</div>`;
      const inp = $('#kbListFilter');
      inp.addEventListener('input', () => render(inp.value));
    };
    render('');
  }

  /* ============================ 7. 设置 ============================ */
  function bindSettings() {
    const cfg = LLM.load();
    $('#cfgBaseUrl').value = cfg.baseUrl || '';
    $('#cfgApiKey').value = cfg.apiKey || '';
    $('#cfgModel').value = cfg.model || '';
    $('#cfgTemp').value = cfg.temperature;
    $('#cfgTimeout').value = cfg.timeoutMs;
    $('#cfgJsonMode').checked = !!cfg.jsonMode;

    $('#btnSaveLlm').addEventListener('click', () => {
      LLM.save({
        baseUrl: $('#cfgBaseUrl').value.trim(),
        apiKey: $('#cfgApiKey').value.trim(),
        model: $('#cfgModel').value.trim(),
        temperature: Number($('#cfgTemp').value) || 0.4,
        timeoutMs: Number($('#cfgTimeout').value) || 180000,
        jsonMode: $('#cfgJsonMode').checked
      });
      refreshLlmBadge();
      log('LLM 配置已保存（仅存于本机浏览器）。');
    });
    $('#btnTestLlm').addEventListener('click', async () => {
      $('#btnTestLlm').disabled = true;
      log('正在测试 LLM 连接…', 'busy');
      try {
        const r = await LLM.test();
        $('#llmState').className = 'badge ok';
        $('#llmState').textContent = '连接正常';
        $('#llmTestOut').innerHTML = `连接成功：模型 <b>${esc(r.model)}</b>，往返 ${r.ms}ms，返回「${esc(r.reply)}」。`;
        refreshLlmBadge();
        log('LLM 连接测试成功。');
      } catch (err) {
        $('#llmState').className = 'badge err';
        $('#llmState').textContent = '连接失败';
        $('#llmTestOut').innerHTML = `<span style="color:#b91c1c">${esc(err.message)}</span>`;
        log('LLM 连接测试失败：' + err.message, 'err');
      } finally {
        $('#btnTestLlm').disabled = false;
      }
    });
    $('#btnListModels').addEventListener('click', async () => {
      try {
        const models = await LLM.listModels();
        $('#modelList').innerHTML = models.map(m => `<option value="${esc(m)}"></option>`).join('');
        log(`已拉取 ${models.length} 个可用模型，可在「模型」输入框中下拉选择。`);
      } catch (err) { fail(err); }
    });
    $('#btnExportDraft').addEventListener('click', () => { Exporter.draft(state); log('草稿 JSON 已导出。'); });
    $('#btnImportDraft').addEventListener('click', () => $('#draftFile').click());
    $('#draftFile').addEventListener('change', () => {
      const f = $('#draftFile').files[0];
      if (!f) return;
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const data = JSON.parse(String(fr.result));
          Store.set(data);
          state = Store.get();
          renderAll();
          log('草稿已导入并恢复界面。');
        } catch (e) { fail(new Error('草稿文件解析失败：' + e.message)); }
      };
      fr.readAsText(f, 'utf-8');
    });
    $('#btnClearDraft').addEventListener('click', () => {
      if (!confirm('将清除本机保存的草稿（不影响知识库与 LLM 配置）。是否继续？')) return;
      Store.clearDraft();
      location.reload();
    });
  }

  function renderDraftInfo() {
    const info = Store.draftInfo();
    $('#draftInfo').innerHTML = info
      ? `本机草稿：<b>${esc(info.customer || '未命名客户')}</b> · 步骤 ${esc(info.step || '—')} · 更新于 ${new Date(info.updatedAt).toLocaleString()}`
      : '本机暂无草稿。';
  }

  function refreshLlmBadge() {
    const ok = LLM.ready();
    $('#llmBadge').className = 'badge ' + (ok ? 'ok' : 'off');
    $('#llmBadge').textContent = ok ? `LLM 已配置（${LLM.get().model}）` : 'LLM 未配置';
  }

  /* ============================ 认证门禁（Supabase） ============================ */
  let authLocalOptOut = false;
  let corpusLoaded = false;

  /**
   * 门禁启用时，把门禁之外的顶层元素全部设为 inert + aria-hidden。
   * 为什么不能只靠遮罩：.auth-gate 是 z-index:100 的全屏遮罩，视觉上盖住了主界面，
   * 但底层表单仍在**焦点顺序**里——按 Tab 能把焦点移到门禁背后并操作它；读屏软件同样会读到。
   * inert 会同时阻断焦点、指针事件与无障碍树。老旧浏览器不支持时为 no-op（遮罩仍然生效）。
   */
  function setAppInert(on) {
    $$('body > *').forEach(el => {
      if (el.id === 'authGate' || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      if (on) {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      } else {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      }
    });
  }

  function showAuthGate(show) {
    $('#authGate').classList.toggle('hidden', !show);
    setAppInert(show);
  }

  function authErr(id, msg) {
    const el = $('#' + id);
    if (!el) return;
    if (!msg) { el.classList.add('hidden'); el.textContent = ''; return; }
    el.classList.remove('hidden');
    el.textContent = msg;
  }

  function updateUserChip(st) {
    const chip = $('#userChip'), out = $('#btnSignOut');
    if (!chip) return;
    if (st.stage === 'local') {
      chip.className = 'badge';
      chip.textContent = '本地模式（未接认证）';
      chip.classList.remove('hidden');
      out.classList.add('hidden');
      return;
    }
    if (st.profile) {
      chip.className = 'badge ok';
      chip.textContent = (st.profile.display_name || st.profile.email) + (st.profile.role === 'admin' ? ' · ADMIN' : '');
      chip.classList.remove('hidden');
      out.classList.remove('hidden');
    } else {
      chip.classList.add('hidden');
      out.classList.add('hidden');
    }
  }

  function renderAuth(st) {
    if (st.stage === 'local' || (authLocalOptOut && st.stage !== 'ready')) {
      showAuthGate(false);
      updateUserChip(st);
      return;
    }
    showAuthGate(true);
    $$('#authGate section[data-auth]').forEach(sec => {
      sec.classList.toggle('hidden', sec.dataset.auth !== st.stage);
    });
    updateUserChip(st);

    if (st.stage === 'error') authErr('authErrorMsg', st.error || '未知错误');
    if (st.stage === 'reset_request') {
      const n = $('#authResetNotice');
      n.textContent = st.notice || '';
      n.style.color = st.notice ? '#0b7a3d' : '';
    }
    if (st.stage === 'mfa_enroll' && !$('#authQr').innerHTML) {
      startEnroll().catch(err => authErr('authError3', err.message));
    }
    if (st.stage === 'ready') loadRemoteCorpus();
  }

  function startEnroll() {
    return Auth.enrollTotp().then(e => {
      $('#authQr').innerHTML = e.qr ? `<img alt="TOTP 二维码" src="${e.qr}">` : '';
      $('#authSecret').textContent = e.secret || '';
      $('#authEnrollVerify').dataset.factorId = e.factorId;
      log('已生成 TOTP 绑定二维码，请用认证器 App 扫码。');
    });
  }

  async function loadRemoteCorpus() {
    if (corpusLoaded) return;
    corpusLoaded = true;
    log('正在按权限加载客户资料库…', 'busy');
    try {
      const r = await Auth.loadCorpus();
      if (r.ok) {
        const s = KB.loadRemote(r.docs);
        refreshKb();
        log(`客户资料库已加载：${s.remote} 篇（服务端 RLS 授权）`);
      } else if (r.reason === 'no_access') {
        log('未取得客户资料库权限：' + (r.hint || ''), 'err');
      } else if (r.reason !== 'local') {
        log('客户资料库加载失败：' + r.reason, 'err');
      }
    } catch (err) {
      log('客户资料库加载异常：' + err.message, 'err');
    }
  }

  function bindAuth() {
    $('#authSignIn').addEventListener('click', async () => {
      authErr('authError');
      const email = $('#authEmail').value.trim();
      const pwd = $('#authPassword').value;
      if (!email || !pwd) { authErr('authError', '请输入邮箱与密码'); return; }
      $('#authSignIn').disabled = true;
      try {
        await Auth.signIn(email, pwd);
        $('#authPassword').value = '';
        log('登录成功：' + email);
      } catch (e) {
        authErr('authError', e.message);
      } finally { $('#authSignIn').disabled = false; }
    });
    $('#authPassword').addEventListener('keydown', e => { if (e.key === 'Enter') $('#authSignIn').click(); });

    /* ---- 忘记密码：通过绑定邮箱重置 ---- */
    // 重置流程里没有 profiles（未登录/刚拿到 recovery 会话），
    // 用会话邮箱代替做"不能包含邮箱前缀"的强度校验
    function resetPwdIssues(v) {
      const s = Auth.get().session;
      const email = (s && s.user && s.user.email) || '';
      return Auth.passwordIssues(v, { email });
    }

    $('#authForgot').addEventListener('click', () => Auth.goResetRequest());
    $('#authBackToLogin').addEventListener('click', () => Auth.backToSignIn());
    $('#authSendReset').addEventListener('click', async () => {
      authErr('authError5');
      const email = $('#authResetEmail').value.trim();
      if (!email) { authErr('authError5', '请输入邮箱'); return; }
      $('#authSendReset').disabled = true;
      try {
        await Auth.requestPasswordReset(email);
        log('已请求发送重置邮件：' + email);
      } catch (e) {
        authErr('authError5', e.message);
      } finally { $('#authSendReset').disabled = false; }
    });
    $('#authResetEmail').addEventListener('keydown', e => { if (e.key === 'Enter') $('#authSendReset').click(); });

    $('#authResetPwd').addEventListener('input', () => {
      const v = $('#authResetPwd').value;
      const issues = resetPwdIssues(v);
      const hint = $('#authResetPwdHint');
      if (!v) { hint.textContent = ''; return; }
      hint.textContent = issues.length ? '还需满足：' + issues.join('、') : '✅ 符合强度要求';
      hint.style.color = issues.length ? '' : '#0b7a3d';
    });
    $('#authDoReset').addEventListener('click', async () => {
      authErr('authError6');
      const p1 = $('#authResetPwd').value, p2 = $('#authResetPwd2').value;
      if (p1 !== p2) { authErr('authError6', '两次输入的密码不一致'); return; }
      const issues = resetPwdIssues(p1);
      if (issues.length) { authErr('authError6', '密码不满足要求：' + issues.join('、')); return; }
      $('#authDoReset').disabled = true;
      try {
        await Auth.completePasswordReset(p1);
        log('密码已重置，已用新密码进入系统。');
      } catch (e) {
        authErr('authError6', e.message);
      } finally { $('#authDoReset').disabled = false; }
    });

    $('#authNewPwd').addEventListener('input', () => {
      const v = $('#authNewPwd').value;
      const issues = Auth.passwordIssues(v, Auth.get().profile);
      const hint = $('#authPwdHint');
      if (!v) { hint.textContent = ''; return; }
      hint.textContent = issues.length ? '还需满足：' + issues.join('、') : '✅ 符合强度要求';
      hint.style.color = issues.length ? '' : '#0b7a3d';
    });
    $('#authChangePwd').addEventListener('click', async () => {
      authErr('authError2');
      const p1 = $('#authNewPwd').value, p2 = $('#authNewPwd2').value;
      if (p1 !== p2) { authErr('authError2', '两次输入的密码不一致'); return; }
      const issues = Auth.passwordIssues(p1, Auth.get().profile);
      if (issues.length) { authErr('authError2', '密码不满足要求：' + issues.join('、')); return; }
      $('#authChangePwd').disabled = true;
      try {
        await Auth.changePassword(p1);
        log('初始密码已修改（服务端已解除待改密标记）。');
      } catch (e) {
        authErr('authError2', e.message);
      } finally { $('#authChangePwd').disabled = false; }
    });

    $('#authEnrollVerify').addEventListener('click', async () => {
      authErr('authError3');
      const factorId = $('#authEnrollVerify').dataset.factorId;
      const code = $('#authTotp').value.trim();
      if (!factorId) { authErr('authError3', '二维码尚未生成，请稍候或点击重试'); return; }
      if (code.length !== 6) { authErr('authError3', '请输入 6 位验证码'); return; }
      $('#authEnrollVerify').disabled = true;
      try {
        await Auth.verifyTotp(factorId, code);
        log('双因素认证绑定完成。');
      } catch (e) {
        authErr('authError3', e.message);
      } finally { $('#authEnrollVerify').disabled = false; }
    });

    $('#authVerify').addEventListener('click', async () => {
      authErr('authError4');
      const st = Auth.get();
      const code = $('#authTotp2').value.trim();
      if (code.length !== 6) { authErr('authError4', '请输入 6 位验证码'); return; }
      $('#authVerify').disabled = true;
      try {
        await Auth.verifyTotp(st.factorId, code);
        log('双因素验证通过。');
      } catch (e) {
        authErr('authError4', e.message);
      } finally { $('#authVerify').disabled = false; }
    });

    $$('#authGate .auth-signout').forEach(b => b.addEventListener('click', async () => {
      await Auth.signOut();
      corpusLoaded = false;
      log('已退出登录。');
    }));

    $('#authRetry').addEventListener('click', () => { Auth.init().catch(e => authErr('authErrorMsg', e.message)); });
    $('#authLocalMode').addEventListener('click', () => {
      authLocalOptOut = true;
      showAuthGate(false);
      updateUserChip({ stage: 'local' });
      log('已切换为本地模式：不含客户资料库，功能仍可使用。');
    });
    $('#btnSignOut').addEventListener('click', async () => {
      if (!confirm('退出登录后需要重新验证身份。是否继续？')) return;
      await Auth.signOut();
      location.reload();
    });
  }

  /* ============================ 初始化 ============================ */
  function renderAll() {
    if (state.rawInquiry) $('#inquiryText').value = state.rawInquiry;
    updateInquiryMeta();
    renderFields();
    renderMissing();
    renderChecklist();
    renderBackground();
    renderMatchResult();
    renderValidation(state.validation);
    renderProgress();
    if (state.candidates && state.candidates.length) renderCandidates(state.candidates);
    syncDocInputs();
    buildCommercialForm();
    if (state.checkpoints && state.checkpoints.length) markDone('checklist', true);
    if (state.background) markDone('background', true);
    if (state.match) markDone('match', true);
    if (state.fields) markDone('inquiry', true);
    if (state.content) {
      renderPreview();
      // 若草稿中保存了人工修改过的预览内容，则以它为准
      if (state.previewHtml && state.previewHtml.indexOf('sm-doc') >= 0 && state.previewEdited) {
        writePreview(state.previewHtml);
      }
      markDone('solution', true);
    }
    if (state.step) goto(state.step);
  }

  function init() {
    KB.init();
    state = Store.get();
    const restored = Store.loadDraft();
    if (restored) {
      state = Store.get();
      log('已恢复上次会话草稿（可在「设置」中清除）。');
    } else {
      state = Store.get();
    }
    refreshKb();
    refreshLlmBadge();
    renderDraftInfo();
    bindInquiry();
    bindChecklist();
    bindBackground();
    bindMatch();
    bindSolution();
    bindKb();
    bindSettings();
    bindAuth();

    $('#stepNav').addEventListener('click', e => {
      const b = e.target.closest('.step');
      if (b) goto(b.dataset.step);
    });
    document.body.addEventListener('click', e => {
      const g = e.target.closest('[data-goto]');
      if (g) { collectFields(); collectChecklist(); goto(g.dataset.goto); }
    });
    $('#btnSaveDraft').addEventListener('click', () => {
      collectFields(); collectChecklist(); capturePreview();
      const r = Store.saveDraft();
      renderDraftInfo();
      log(r.ok ? '草稿已保存到本机浏览器。' : r.message, r.ok ? '' : 'err');
    });
    $('#btnRestoreDraft').addEventListener('click', () => {
      const info = Store.draftInfo();
      if (!info) { fail(new Error('本机没有已保存的草稿。')); return; }
      Store.loadDraft();
      state = Store.get();
      renderAll();
      log('已恢复草稿：' + (info.customer || '未命名') + ' @ ' + new Date(info.updatedAt).toLocaleString());
    });
    $('#btnClearLog').addEventListener('click', () => { logs.length = 0; $('#logText').title = ''; });

    renderAll();
    const s = KB.stats();
    log(`就绪：知识库 ${s.total} 篇历史方案（${(s.chars / 10000).toFixed(1)} 万字），产品库 ${SM_PRODUCTS.products.length} 个机型。`);
    if (!LLM.ready()) log('提示：未配置 LLM。可在「设置」中填写任意 OpenAI 兼容接口，以获得 AI 解析、背调与文案撰写能力。');

    /* 认证门禁：配置了 Supabase 才启用；否则保持本地模式（行为与之前完全一致） */
    if (Auth.configured()) {
      showAuthGate(true);
      Auth.onChange(renderAuth);
      Auth.init().catch(err => {
        log('认证初始化失败：' + err.message, 'err');
        authErr('authErrorMsg', err.message);
      });
    } else {
      updateUserChip({ stage: 'local' });
      log('提示：未配置 Supabase（assets/js/auth-config.js 为空），当前为本地模式：不登录、使用本地语料。');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
