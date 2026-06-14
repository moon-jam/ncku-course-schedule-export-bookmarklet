import { DEFAULT_WEEKS, MAX_GAP_MIN } from './periods.js';

// Extract { code, name, location } from a course cell's text.
// Cell text looks like "【F7-054】演算法（地點：資訊系館-4203）".
export function parseCourseCell(text) {
  text = (text || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const m = text.match(/【([^】]+)】\s*([^（(]+?)\s*(?:[（(]地點：([^）)]+)[）)])?$/);
  if (!m) {
    // Fallback: grab the code and whatever follows it.
    const m2 = text.match(/【([^】]+)】\s*(.+)/);
    if (!m2) return null;
    return { code: m2[1].trim(), name: m2[2].trim(), location: '' };
  }
  return { code: m[1].trim(), name: m[2].trim(), location: (m[3] || '').trim() };
}

// Parse a period header like "【2】09:00 ~ 09:50" into { period, startHM, endHM }.
// Returns null when there is no period code or no time range (e.g. period E).
export function parsePeriodHeader(text) {
  text = text || '';
  const pm = text.match(/【([^】]+)】/);
  if (!pm) return null;
  const tm = text.match(/(\d{1,2}:\d{2})\s*[~～-]\s*(\d{1,2}:\d{2})/);
  if (!tm) return null;
  return { period: pm[1].trim(), startHM: tm[1], endHM: tm[2] };
}

// Minutes since midnight for "HH:MM".
function toMinutes(hm) {
  const m = hm.match(/(\d{1,2}):(\d{2})/);
  return m ? (+m[1]) * 60 + (+m[2]) : 0;
}

// Scan the mobile per-day tables (#week-1 .. #week-7) into raw slots.
// Period times are read from each row header, not hardcoded.
// Returns { slots, flexible }; flexible holds courses with no fixed time.
export function scanSchedule(doc) {
  doc = doc || document;
  const slots = [];
  const flexMap = {};

  for (let day = 1; day <= 7; day++) {
    const table = doc.querySelector('#week-' + day + ' table');
    if (!table) continue;
    const rows = table.querySelectorAll('tbody tr');
    for (let i = 0; i < rows.length; i++) {
      const th = rows[i].querySelector('th');
      const td = rows[i].querySelector('td');
      if (!th || !td) continue;
      const thText = th.textContent || '';

      if (thText.indexOf('時間未定') >= 0 || thText.indexOf('彈性') >= 0) {
        const fc = parseCourseCell(td.textContent);
        if (fc) flexMap[fc.code] = fc;
        continue;
      }

      const head = parsePeriodHeader(thText);
      if (!head) continue;
      if (td.className.indexOf('td-yellow') < 0) continue;

      const c = parseCourseCell(td.textContent);
      if (!c) continue;
      slots.push({
        day: day, period: head.period, startHM: head.startHM, endHM: head.endHM,
        code: c.code, name: c.name, location: c.location
      });
    }
  }

  const flexible = Object.keys(flexMap).map(function (k) { return flexMap[k]; });
  return { slots: slots, flexible: flexible };
}

// Merge consecutive periods of the same course on the same day into blocks.
// Slots carry their own start/end time; two slots merge when the gap between
// them is at most MAX_GAP_MIN minutes.
export function buildBlocks(slots) {
  const groups = {};
  slots.forEach(function (s) {
    const key = s.day + '|' + s.code;
    (groups[key] || (groups[key] = [])).push(s);
  });

  const blocks = [];
  let bid = 0;
  Object.keys(groups).forEach(function (key) {
    const arr = groups[key];
    arr.sort(function (a, b) { return toMinutes(a.startHM) - toMinutes(b.startHM); });

    let run = null;
    function flush() {
      if (!run) return;
      const first = run[0], last = run[run.length - 1];
      blocks.push({
        id: 'b' + (bid++),
        code: first.code,
        name: first.name,
        title: '【' + first.code + '】' + first.name, // event title, editable in the dashboard
        location: first.location,
        weekday: first.day,
        periods: run.map(function (x) { return x.period; }),
        startHM: first.startHM,
        endHM: last.endHM,
        weeks: DEFAULT_WEEKS,
        skipText: '',
        include: true
      });
      run = null;
    }

    for (let i = 0; i < arr.length; i++) {
      if (!run) { run = [arr[i]]; continue; }
      const prev = run[run.length - 1];
      const gap = toMinutes(arr[i].startHM) - toMinutes(prev.endHM);
      if (gap >= 0 && gap <= MAX_GAP_MIN) run.push(arr[i]);
      else { flush(); run = [arr[i]]; }
    }
    flush();
  });

  blocks.sort(function (a, b) {
    if (a.weekday !== b.weekday) return a.weekday - b.weekday;
    return toMinutes(a.startHM) - toMinutes(b.startHM);
  });
  return blocks;
}
