import { chromium } from 'playwright';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const videoDir = path.resolve(__dirname, '..', 'walkthrough-video');
fs.mkdirSync(videoDir, { recursive: true });

const PROJECT_ID = process.env.PROJECT_ID || '019e6fe6-a221-77e4-8dd4-8ba36a02d388';
const BASE = process.env.BASE_URL || 'https://confluencr-creative-cockpit.vercel.app';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

async function pause(ms) {
  await page.waitForTimeout(ms);
}

async function clickStep(textFragment) {
  await page.locator(`button:has-text("${textFragment}")`).first().click({ timeout: 10000 });
  await pause(1400);
}

async function scrollSmoothly(toY = 800, duration = 1200) {
  const steps = 30;
  const stepTime = duration / steps;
  for (let i = 0; i <= steps; i++) {
    const y = (toY * i) / steps;
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y);
    await pause(stepTime);
  }
}

async function scrollBackToTop() {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await pause(400);
}

console.log('[1/9] Landing page');
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await pause(2400);

console.log('[2/9] Open project');
await page.goto(`${BASE}/p/${PROJECT_ID}`, { waitUntil: 'load' });
// Wait for the project shell to actually render past the not-found suspense fallback
await page.locator('text=Brief').first().waitFor({ state: 'visible', timeout: 30000 });
await pause(2500);

console.log('[4/9] Step 1 Brief');
await clickStep('Tell the cockpit');
await scrollSmoothly(900);
await pause(1200);
await scrollSmoothly(1700, 900);
await pause(800);
await scrollBackToTop();

console.log('[5/9] Step 2 Style report');
await clickStep('AI reads your competitor');
await pause(1200);
await scrollSmoothly(900);
await pause(1500);
await scrollBackToTop();

console.log('[6/9] Step 3 Angles');
await clickStep('Five contextual angles');
await pause(1200);
await scrollSmoothly(700);
await pause(2000);
await scrollBackToTop();

console.log('[7/9] Step 4 Concepts');
await clickStep('Three on-brand briefs');
await pause(1500);
await scrollSmoothly(1400, 1500);
await pause(1500);
await scrollSmoothly(2400, 1200);
await pause(1500);
await scrollBackToTop();

console.log('[8/9] Step 6 Prompt deck');
await clickStep('Copy any prompt');
await pause(1200);
await scrollSmoothly(900);
await pause(1500);
await scrollSmoothly(1800, 1000);
await pause(1500);

console.log('[9/9] Close + save video');
await page.close();
await context.close();
await browser.close();

// Move the recorded video to a stable name
const files = fs.readdirSync(videoDir).filter((f) => f.endsWith('.webm'));
if (files.length > 0) {
  const newest = files
    .map((f) => ({ f, t: fs.statSync(path.join(videoDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0].f;
  const finalPath = path.join(videoDir, 'walkthrough.webm');
  if (path.join(videoDir, newest) !== finalPath) {
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    fs.renameSync(path.join(videoDir, newest), finalPath);
  }
  console.log('Video saved:', finalPath);
} else {
  console.log('No video output found in', videoDir);
}
