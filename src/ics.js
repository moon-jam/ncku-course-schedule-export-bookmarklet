function pad(n) { return n < 10 ? '0' + n : '' + n; }

// Parse "YYYY-MM-DD" into a local Date, or null if malformed.
export function parseISODate(s) {
  const m = (s || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

// Parse a list of "YYYY-MM-DD" dates separated by whitespace or commas.
export function parseDateList(text) {
  const out = [];
  (text || '').split(/[\s,]+/).forEach(function (tok) {
    const d = parseISODate(tok);
    if (d) out.push(d);
  });
  return out;
}

function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + n);
  return d;
}

// Snap a date to the Monday of its week, fool-proofing the start-date picker.
// Weeks start on Sunday, so Sunday maps to the next day's Monday and Mon..Sat
// snap back to that week's Monday.
export function snapToMonday(date) {
  return addDays(date, 1 - date.getDay()); // getDay: 0 = Sunday .. 6 = Saturday
}

function fmtDate(date) {
  return '' + date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
}

function fmtDateTime(date, hm) {
  return fmtDate(date) + 'T' + hm.replace(':', '') + '00';
}

// UTC timestamp for DTSTAMP, e.g. 20260615T032100Z.
function utcStamp(d) {
  return '' + d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
    'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
}

function icsEscape(s) {
  return ('' + s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// Fold a line to 75 octets per RFC 5545.
function fold(line) {
  if (line.length <= 75) return line;
  let out = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 74) { out += '\r\n ' + rest.slice(0, 74); rest = rest.slice(74); }
  return out + '\r\n ' + rest;
}

// weekday 1..7 (1 = Monday) to JS getDay() (0 = Sunday).
function weekdayToJsDay(w) { return w % 7; }

// Build a full iCalendar string from course blocks and options.
// startMonday: Date of the first week's Monday.
// globalSkips: Date[] applied to every course.
// weekCounter: { weeks } to add a Sunday "成功大學第 N 週" reminder, or null.
export function buildICS(blocks, startMonday, globalSkips, weekCounter) {
  const stamp = utcStamp(new Date());
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//ncku-course-export//ZH-TW//');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('BEGIN:VTIMEZONE');
  lines.push('TZID:Asia/Taipei');
  lines.push('BEGIN:STANDARD');
  lines.push('DTSTART:19700101T000000');
  lines.push('TZOFFSETFROM:+0800');
  lines.push('TZOFFSETTO:+0800');
  lines.push('TZNAME:CST');
  lines.push('END:STANDARD');
  lines.push('END:VTIMEZONE');

  blocks.forEach(function (b) {
    if (!b.include) return;
    const firstDate = addDays(startMonday, b.weekday - 1);
    const lastDate = addDays(firstDate, (b.weeks - 1) * 7);
    const jsDay = weekdayToJsDay(b.weekday);

    // EXDATE: global + per-course skips on the same weekday and within range.
    const skips = globalSkips.concat(parseDateList(b.skipText));
    const exdates = [];
    skips.forEach(function (d) {
      if (d.getDay() === jsDay && d.getTime() >= firstDate.getTime() && d.getTime() <= lastDate.getTime()) {
        exdates.push(fmtDateTime(d, b.startHM));
      }
    });

    const uid = (b.code + '-' + b.weekday + '-' + b.startHM).replace(/[^A-Za-z0-9-]/g, '') + '@ncku';
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + uid);
    lines.push('DTSTAMP:' + stamp);
    lines.push('SUMMARY:' + icsEscape(b.title || ('【' + b.code + '】' + b.name)));
    if (b.location) lines.push('LOCATION:' + icsEscape(b.location));
    lines.push('DTSTART;TZID=Asia/Taipei:' + fmtDateTime(firstDate, b.startHM));
    lines.push('DTEND;TZID=Asia/Taipei:' + fmtDateTime(firstDate, b.endHM));
    lines.push('RRULE:FREQ=WEEKLY;COUNT=' + b.weeks);
    if (exdates.length) lines.push('EXDATE;TZID=Asia/Taipei:' + exdates.join(','));
    lines.push('END:VEVENT');
  });

  // Sunday week-number reminders, placed on the Sunday right before that week's
  // Monday (the day before, so the Sunday counts as the start of the same week).
  if (weekCounter && weekCounter.weeks > 0) {
    for (let w = 1; w <= weekCounter.weeks; w++) {
      const sunday = addDays(startMonday, (w - 1) * 7 - 1);
      lines.push('BEGIN:VEVENT');
      lines.push('UID:weekcounter-' + w + '@ncku');
      lines.push('DTSTAMP:' + stamp);
      lines.push('SUMMARY:' + icsEscape('成功大學第 ' + w + ' 週'));
      lines.push('DTSTART;VALUE=DATE:' + fmtDate(sunday));
      lines.push('DTEND;VALUE=DATE:' + fmtDate(addDays(sunday, 1)));
      lines.push('END:VEVENT');
    }
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}
