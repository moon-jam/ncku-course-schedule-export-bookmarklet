// Bundle the app with esbuild and emit the GitHub Pages site under dist/.
// The bookmarklet itself is a tiny loader that fetches app.js from the site,
// so updating app.js updates everyone without re-installing the bookmarklet.
// Run: node build.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const ASSETS = 'assets';

const HOST = 'https://ncku-course2ics.moon-jam.me';
const DEMO_IMG = 'add-bookmarklet-demo.webp';
const DEMO_VIDEO = 'export-schedule-demo.mp4';
const CUSTOM_DOMAIN = 'ncku-course2ics.moon-jam.me';
const REPO = 'https://github.com/moon-jam/ncku-course-schedule-export-bookmarklet';

mkdirSync(dist, { recursive: true });

// Bundle and minify the app into dist/app.js (charset utf8 keeps Chinese readable).
await build({
  entryPoints: [join(root, 'src', 'main.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  charset: 'utf8',
  target: ['es2017'],
  outfile: join(dist, 'app.js')
});

// Loader bookmarklet: reuse the already-loaded app, otherwise inject app.js once.
// Needs the site deployed so HOST/app.js exists; this is the production bookmarklet.
const loader = "(function(){if(window.__nckuIcsOpen){window.__nckuIcsOpen();return;}" +
  "var s=document.createElement('script');s.src='" + HOST + "/app.js?'+Date.now();" +
  "document.body.appendChild(s);})();";
const bookmarklet = 'javascript:' + encodeURIComponent(loader);
writeFileSync(join(dist, 'bookmarklet.txt'), bookmarklet, 'utf8');

// Self-contained bookmarklet: the whole app inlined, works without any hosting.
// Useful for local testing before deploy (must be re-dragged to update).
const appCode = readFileSync(join(dist, 'app.js'), 'utf8');
const inlineBookmarklet = 'javascript:' + encodeURIComponent(appCode);
writeFileSync(join(dist, 'bookmarklet-inline.txt'), inlineBookmarklet, 'utf8');

const indexHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>成大課表匯出工具</title>
<meta name="description" content="把成大課表匯出成 ICS 行事曆檔，可匯入 Google 日曆、Apple 日曆、Outlook。">
<style>
body{font-family:system-ui,"Microsoft JhengHei",sans-serif;max-width:720px;margin:0 auto;padding:40px 16px;line-height:1.7;color:#222;background:#fff}
h1{margin-bottom:6px}
.lead{color:#555;margin-top:0}
.bm{display:inline-block;background:#2e6da4;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:16px}
.demo{display:block;max-width:100%;margin:18px 0 4px;border:1px solid #e2e2e2;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.12)}
.demo-video{display:block;width:100%;margin:8px 0 4px;border:1px solid #e2e2e2;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.12)}
.cap{color:#888;font-size:13px;margin:0 0 24px}
ol{padding-left:20px}
code{background:#f1f1ee;padding:2px 6px;border-radius:4px}
ul.feat{padding-left:20px;color:#444}
hr{border:0;border-top:1px solid #eee;margin:28px 0}
footer{color:#888;font-size:14px}
footer a{color:#2e6da4;text-decoration:none}
footer a:hover{text-decoration:underline}
.gh{display:inline-flex;align-items:center;gap:6px}
.gh svg{width:18px;height:18px;fill:currentColor}
</style>
</head>
<body>
<h1>成大課表匯出工具</h1>
<p class="lead">把成大課表匯出成 ICS 行事曆檔，可匯入 Google 日曆、Apple 日曆、Outlook。</p>

<p>把下面這顆按鈕拖曳到瀏覽器的書籤列：</p>
<p><a class="bm" href="${bookmarklet.replace(/"/g, '&quot;')}">課表匯出 ICS</a></p>
<img class="demo" src="${ASSETS}/${DEMO_IMG}" alt="把「課表匯出 ICS」按鈕拖曳到瀏覽器書籤列的示範">
<p class="cap">↑ 拖曳示範：按住按鈕，拉到書籤列放開即可。</p>

<h2>使用教學</h2>
<video class="demo-video" src="${ASSETS}/${DEMO_VIDEO}" controls muted loop playsinline preload="metadata"></video>
<ol>
<li>登入成大課程系統，開啟<a href="https://course.ncku.edu.tw/index.php?c=cos32315" target="_blank" rel="noopener">我的課表</a>頁面。</li>
<li>點書籤列上的「課表匯出 ICS」。</li>
<li>在跳出的儀表板選開學日（第一週的週一），設定重複週數與要跳過的日期；課程標題可直接編輯。</li>
<li>按「下載 ICS」，再把 .ics 匯入 Google 日曆／Apple 日曆／Outlook。</li>
</ol>

<hr>
<h2>功能</h2>
<ul class="feat">
<li>同一天連續節次的同一門課，自動合併成單一事件。</li>
<li>每門課的標題可編輯，重複週數可個別調整。</li>
<li>跳過日期：全域假日清單套用所有課，個別課程可再加自己的跳過日期。</li>
<li>可選的每週日週數提醒，標題為「成功大學第 N 週」。</li>
</ul>

<hr>
<footer>
<a class="gh" href="${REPO}" target="_blank" rel="noopener"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>GitHub</a>
</footer>
</body>
</html>`;
writeFileSync(join(dist, 'index.html'), indexHtml, 'utf8');

// Custom domain for GitHub Pages.
writeFileSync(join(dist, 'CNAME'), CUSTOM_DOMAIN + '\n', 'utf8');

mkdirSync(join(dist, ASSETS), { recursive: true });
for (const asset of [DEMO_IMG, DEMO_VIDEO]) {
  if (existsSync(join(root, ASSETS, asset))) {
    copyFileSync(join(root, ASSETS, asset), join(dist, ASSETS, asset));
  } else {
    console.warn('warning: ' + ASSETS + '/' + asset + ' not found; the landing page will be missing it');
  }
}

const appSize = readFileSync(join(dist, 'app.js'), 'utf8').length;
console.log('built dist/app.js (' + appSize + ' bytes), bookmarklet.txt (loader, ' + bookmarklet.length +
  ' chars), bookmarklet-inline.txt (self-contained, ' + inlineBookmarklet.length + ' chars), index.html, CNAME, ' + DEMO_IMG);
