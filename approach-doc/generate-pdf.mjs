import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, 'index.html');
const pdfPath = path.resolve(__dirname, '..', 'APPROACH.pdf');

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

const headerTemplate = `
<div style="
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 6.5pt;
  color: #8a8a8a;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  width: 100%;
  padding: 6px 52px 4px 52px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(15,15,15,0.06);
">
  <span>Approach Document &middot; Creative Process Engineer</span>
  <span>Confluencr &middot; Walnut Folks</span>
</div>
`;

const footerTemplate = `
<div style="
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 6.5pt;
  color: #8a8a8a;
  letter-spacing: 0.06em;
  width: 100%;
  padding: 4px 52px 4px 52px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(15,15,15,0.06);
">
  <span style="text-transform: uppercase;">Confluencr Creative Cockpit &middot; Approach v1</span>
  <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
</div>
`;

console.log('[1/4] Launching Chromium...');
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

console.log('[2/4] Loading', fileUrl);
await page.goto(fileUrl, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

console.log('[3/4] Rendering PDF...');
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: false,
  displayHeaderFooter: true,
  headerTemplate,
  footerTemplate,
  margin: {
    top: '14mm',
    bottom: '12mm',
    left: '0mm',
    right: '0mm',
  },
});

await browser.close();
console.log('[4/4] PDF written to', pdfPath);
