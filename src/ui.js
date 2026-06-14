import { WEEK_LABEL, DEFAULT_WEEKS } from './periods.js';
import { buildICS, parseISODate, parseDateList } from './ics.js';

export const DASH_ID = 'ncku-ics-dashboard';
const STYLE_ID = 'ncku-ics-style';

const CSS = [
  '#' + DASH_ID + '{position:fixed;inset:0;z-index:2147483647;background:rgba(15,18,25,.45);',
  'display:flex;align-items:center;justify-content:center;overflow:auto;',
  'font-family:system-ui,"Microsoft JhengHei",sans-serif;-webkit-font-smoothing:antialiased;',
  '--accent:#2563eb;--accent-d:#1d4ed8;--line:#e6e6ea;--ink:#1f2328;--muted:#6b7280;--soft:#f7f8fa}',
  '#' + DASH_ID + ' *{box-sizing:border-box}',
  '#' + DASH_ID + ' input[type=checkbox]{width:16px;height:16px;accent-color:var(--accent);cursor:pointer;margin:0;flex:none}',

  '.nckuics-panel{background:#fff;color:var(--ink);width:94%;max-width:680px;margin:24px;',
  'max-height:88vh;display:flex;flex-direction:column;overflow:hidden;',
  'border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.28)}',

  '.nckuics-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;',
  'padding:18px 20px 14px;border-bottom:1px solid var(--line)}',
  '.nckuics-head h2{margin:0;font-size:18px;font-weight:700}',
  '.nckuics-subtitle{font-size:13px;color:var(--muted);margin-top:3px}',
  '.nckuics-x{border:0;background:transparent;font-size:18px;line-height:1;color:var(--muted);',
  'cursor:pointer;padding:6px 9px;border-radius:8px}',
  '.nckuics-x:hover{background:#f0f0f3;color:var(--ink)}',

  '.nckuics-body{padding:16px 20px;overflow:auto}',
  '.nckuics-foot{display:flex;align-items:center;gap:10px;flex-wrap:wrap;',
  'padding:14px 20px;border-top:1px solid var(--line)}',

  '.nckuics-h3{font-size:13px;font-weight:600;color:var(--muted);margin:18px 0 8px}',
  '.nckuics-h3:first-child{margin-top:0}',

  '.nckuics-group{background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:14px 16px}',
  '.nckuics-field{margin-bottom:11px}',
  '.nckuics-field>label{display:block;font-size:13px;font-weight:500;color:var(--muted);margin-bottom:5px}',
  '.nckuics-check{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--ink);cursor:pointer}',

  '#' + DASH_ID + ' input[type=text],#' + DASH_ID + ' input[type=date],',
  '#' + DASH_ID + ' input[type=number],#' + DASH_ID + ' textarea{',
  'border:1px solid var(--line);border-radius:8px;padding:7px 9px;font-size:14px;color:var(--ink);',
  'background:#fff;font-family:inherit}',
  '#' + DASH_ID + ' input:focus,#' + DASH_ID + ' textarea:focus{outline:0;border-color:var(--accent);',
  'box-shadow:0 0 0 3px rgba(37,99,235,.15)}',
  '.nckuics-num{width:66px}',
  '.nckuics-area{width:100%;resize:vertical}',

  '.nckuics-course{display:flex;gap:12px;align-items:center;padding:10px 12px;',
  'border:1px solid var(--line);border-radius:10px;margin-bottom:8px;transition:border-color .15s,opacity .15s}',
  '.nckuics-course:hover{border-color:#d2d5dc}',
  '.nckuics-course.off{opacity:.45}',
  '.nckuics-info{flex:1;min-width:0}',
  '.nckuics-name{width:100%;font-weight:600}',
  '.nckuics-sub{color:var(--muted);font-size:12px;margin-top:4px}',
  '.nckuics-ctrl{display:flex;flex-direction:column;gap:6px;align-items:flex-end}',
  '.nckuics-ctrl .nckuics-row{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}',
  '.nckuics-ctrl .nckuics-num{width:58px;padding:5px 7px}',
  '.nckuics-skip{width:172px;font-size:13px;padding:6px 8px}',
  '.nckuics-flex{font-size:14px;padding:4px 0}',

  '.nckuics-btn{font-size:14px;font-weight:600;padding:9px 16px;border-radius:8px;cursor:pointer;',
  'border:1px solid transparent;transition:background .15s}',
  '.nckuics-btn.primary{background:var(--accent);color:#fff}',
  '.nckuics-btn.primary:hover{background:var(--accent-d)}',
  '.nckuics-btn.ghost{background:#fff;color:var(--ink);border-color:var(--line)}',
  '.nckuics-btn.ghost:hover{background:var(--soft)}',
  '.nckuics-msg{font-size:13px;color:#15803d;margin-left:auto}'
].join('');

function injectStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}

// Small DOM builder. attrs supports class/text/value plus any attribute.
function el(tag, attrs, children) {
  const n = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'value') n.value = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
  }
  (children || []).forEach(function (c) { n.appendChild(c); });
  return n;
}

function field(label, input) {
  return el('div', { 'class': 'nckuics-field' }, [el('label', { text: label }), input]);
}

function button(label, variant) {
  return el('button', { 'class': 'nckuics-btn ' + variant, text: label });
}

function downloadICS(text) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = el('a');
  a.href = url;
  a.download = 'ncku-schedule.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// One row per course: include checkbox, editable title, week count, per-course skips.
// Keeps the week <input> reference so the global default can update it directly.
function courseRow(b, weekInputs) {
  const cb = el('input', { type: 'checkbox' });
  cb.checked = true;

  const name = el('input', { type: 'text', 'class': 'nckuics-name', value: b.title });
  name.addEventListener('input', function () { b.title = name.value; });

  const sub = '週' + WEEK_LABEL[b.weekday] + '　' + b.startHM + '–' + b.endHM +
    '　第 ' + b.periods.join('、') + ' 節' + (b.location ? '　' + b.location : '');

  const info = el('div', { 'class': 'nckuics-info' }, [
    name,
    el('div', { 'class': 'nckuics-sub', text: sub })
  ]);

  const wk = el('input', { type: 'number', min: '1', max: '30', 'class': 'nckuics-num', value: '' + b.weeks });
  wk.addEventListener('change', function () { b.weeks = parseInt(wk.value, 10) || b.weeks; b.touched = true; });
  weekInputs.push({ block: b, input: wk });

  const skip = el('input', { type: 'text', 'class': 'nckuics-skip', placeholder: '此課額外跳過日期' });
  skip.addEventListener('input', function () { b.skipText = skip.value; });

  const ctrl = el('div', { 'class': 'nckuics-ctrl' }, [
    el('div', { 'class': 'nckuics-row' }, [document.createTextNode('週數'), wk]),
    skip
  ]);

  const row = el('div', { 'class': 'nckuics-course' }, [cb, info, ctrl]);
  cb.addEventListener('change', function () {
    b.include = cb.checked;
    row.classList.toggle('off', !cb.checked);
  });
  return row;
}

// Build the dashboard overlay from parsed schedule data.
export function buildDashboard(data, blocks) {
  injectStyle(document);

  const flexible = data.flexible;
  const weekInputs = [];

  const startInput = el('input', { type: 'date' });
  const weeksInput = el('input', { type: 'number', min: '1', max: '30', 'class': 'nckuics-num', value: '' + DEFAULT_WEEKS });
  const skipInput = el('textarea', {
    rows: '2', 'class': 'nckuics-area',
    placeholder: '要跳過的日期，一行一個或以空白分隔，例如 2026-02-28 2026-04-04'
  });

  // Apply the default week count to every course the user has not edited.
  weeksInput.addEventListener('change', function () {
    const v = parseInt(weeksInput.value, 10) || DEFAULT_WEEKS;
    weekInputs.forEach(function (w) {
      if (!w.block.touched) { w.block.weeks = v; w.input.value = '' + v; }
    });
  });

  const weekCounterCb = el('input', { type: 'checkbox' });
  const weekCounterRow = el('label', { 'class': 'nckuics-check' }, [weekCounterCb]);
  weekCounterRow.appendChild(document.createTextNode('每週日提醒目前週數（標題：成功大學第 N 週）'));

  const group = el('div', { 'class': 'nckuics-group' }, [
    field('開學日（第一週的週一）', startInput),
    field('預設重複週數', weeksInput),
    field('設定跳過日期（套用所有課程）', skipInput),
    weekCounterRow
  ]);

  const body = el('div', { 'class': 'nckuics-body' }, [
    el('div', { 'class': 'nckuics-h3', text: '基本設定' }),
    group,
    el('div', { 'class': 'nckuics-h3', text: '課程（' + blocks.length + '）' })
  ]);
  blocks.forEach(function (b) { body.appendChild(courseRow(b, weekInputs)); });

  // Flexible-time courses are listed for reference only; they are not exported.
  if (flexible.length) {
    body.appendChild(el('div', { 'class': 'nckuics-h3', text: '時間未定或彈性時間（含彈性密集課程）' }));
    flexible.forEach(function (f) {
      body.appendChild(el('div', { 'class': 'nckuics-flex', text: '【' + f.code + '】' + f.name }));
    });
  }

  const msg = el('span', { 'class': 'nckuics-msg' });
  const dlBtn = button('下載 ICS', 'primary');
  const copyBtn = button('複製 ICS 文字', 'ghost');

  function collect() {
    const startMonday = parseISODate(startInput.value);
    if (!startMonday) { alert('請先選擇開學日（第一週的週一）'); return null; }
    const globalSkips = parseDateList(skipInput.value);
    const weekCounter = weekCounterCb.checked
      ? { weeks: parseInt(weeksInput.value, 10) || DEFAULT_WEEKS }
      : null;
    return buildICS(blocks, startMonday, globalSkips, weekCounter);
  }

  dlBtn.addEventListener('click', function () {
    const ics = collect();
    if (!ics) return;
    downloadICS(ics);
    msg.textContent = '已下載 ncku-schedule.ics';
  });
  copyBtn.addEventListener('click', function () {
    const ics = collect();
    if (!ics) return;
    navigator.clipboard.writeText(ics).then(
      function () { msg.textContent = '已複製到剪貼簿'; },
      function () { msg.textContent = '複製失敗，請改用下載'; }
    );
  });

  const closeBtn = el('button', { 'class': 'nckuics-x', text: '✕', 'aria-label': '關閉' });
  const head = el('div', { 'class': 'nckuics-head' }, [
    el('div', {}, [
      el('h2', { text: '匯出課表到行事曆' }),
      el('div', { 'class': 'nckuics-subtitle', text: '下載 .ics 匯入 Google／Apple／Outlook 日曆' })
    ]),
    closeBtn
  ]);

  const panel = el('div', { 'class': 'nckuics-panel' }, [
    head,
    body,
    el('div', { 'class': 'nckuics-foot' }, [dlBtn, copyBtn, msg])
  ]);

  const overlay = el('div', { id: DASH_ID }, [panel]);
  closeBtn.addEventListener('click', function () { overlay.style.display = 'none'; });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
  return overlay;
}
