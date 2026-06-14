import { scanSchedule, buildBlocks } from './parse.js';
import { buildDashboard, DASH_ID } from './ui.js';

// Open the dashboard, or re-show it if already injected.
function open() {
  const existing = document.getElementById(DASH_ID);
  if (existing) { existing.style.display = 'flex'; return; }

  const data = scanSchedule();
  if (!data.slots.length && !data.flexible.length) {
    alert('找不到課表資料，請先到成大課程系統的「我的課表」頁面（course.ncku.edu.tw/index.php?c=cos32315）再執行。');
    return;
  }

  const blocks = buildBlocks(data.slots);
  document.body.appendChild(buildDashboard(data, blocks));
}

window.__nckuIcsOpen = open;
open();
