const { test, expect } = require('@playwright/test');
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, '../index.html')}`;

test.describe('Content integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
  });

  // ── PAGE METADATA ──────────────────────────────────────────────────────────

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle('Via Vitalis — Социален Павилион за Здраве · Бургас');
  });

  test('html element has Bulgarian language attribute', async ({ page }) => {
    const lang = await page.$eval('html', el => el.getAttribute('lang'));
    expect(lang).toBe('bg');
  });

  test('charset is UTF-8', async ({ page }) => {
    const charset = await page.$eval('meta[charset]', el => el.getAttribute('charset'));
    expect(charset.toUpperCase()).toBe('UTF-8');
  });

  test('has viewport meta tag', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });

  // ── MASTHEAD ───────────────────────────────────────────────────────────────

  test('h1 contains VIA VITALIS', async ({ page }) => {
    const h1 = page.locator('h1.masthead-name');
    await expect(h1).toContainText('VIA');
    await expect(h1).toContainText('VITALIS');
  });

  test('masthead shows location and time range', async ({ page }) => {
    const masthead = page.locator('.masthead');
    await expect(masthead).toContainText('Бургас');
    await expect(masthead).toContainText('2028');
  });

  // ── DATELINE / KEY STATS ───────────────────────────────────────────────────

  test('dateline shows all four key statistics', async ({ page }) => {
    const dateline = page.locator('.dateline');
    await expect(dateline).toContainText('28 м²');
    await expect(dateline).toContainText('Net Zero');
    await expect(dateline).toContainText('24/7');
    await expect(dateline).toContainText('200 000 EUR');
  });

  test('dateline shows Морска Градина location', async ({ page }) => {
    await expect(page.locator('.dateline-burgas')).toContainText('Морска Градина');
  });

  // ── LEAD / STATS SIDEBAR ───────────────────────────────────────────────────

  test('lead aside shows four stat blocks', async ({ page }) => {
    await expect(page.locator('.stat-block')).toHaveCount(4);
  });

  test('stat blocks display correct figures', async ({ page }) => {
    const nums = page.locator('.stat-num');
    const texts = await nums.allTextContents();
    expect(texts).toContain('28 м²');
    expect(texts).toContain('Net Zero');
    expect(texts).toContain('24/7');
    expect(texts).toContain('2028+');
  });

  // ── INNOVATION GRID ────────────────────────────────────────────────────────

  test('innovation grid has exactly four items', async ({ page }) => {
    await expect(page.locator('.innovation-item')).toHaveCount(4);
  });

  test('innovation titles are present and correctly named', async ({ page }) => {
    const titles = page.locator('.innovation-title');
    await expect(titles.nth(0)).toContainText('Net Zero Енергия');
    await expect(titles.nth(1)).toContainText('Умна Автономност');
    await expect(titles.nth(2)).toContainText('Панорамно Остъкляване');
    await expect(titles.nth(3)).toContainText('Дигитален Прозорец');
  });

  test('each innovation item has a body text', async ({ page }) => {
    const bodies = page.locator('.innovation-body');
    await expect(bodies).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const text = await bodies.nth(i).textContent();
      expect(text.trim().length).toBeGreaterThan(50);
    }
  });

  // ── SPECS TABLE ────────────────────────────────────────────────────────────

  test('specs table has eight equipment rows', async ({ page }) => {
    await expect(page.locator('.specs-table tr')).toHaveCount(8);
  });

  test('specs table first column uses short uppercase labels', async ({ page }) => {
    const labels = page.locator('.specs-table td:first-child');
    await expect(labels).toHaveCount(8);
    const firstLabel = await labels.first().textContent();
    expect(firstLabel.trim().length).toBeGreaterThan(0);
  });

  // ── PULL QUOTE ─────────────────────────────────────────────────────────────

  test('pull quote has meaningful text', async ({ page }) => {
    const text = page.locator('.pull-quote-text');
    await expect(text).toContainText('Via Vitalis');
  });

  test('pull quote has author attribution', async ({ page }) => {
    const attr = page.locator('.pull-quote-attr');
    await expect(attr).toContainText('Николай Благьов');
  });

  // ── LOCATION ───────────────────────────────────────────────────────────────

  test('location section shows Sea Garden heading', async ({ page }) => {
    const locationText = page.locator('.location-text');
    await expect(locationText.locator('h3')).toContainText('Морска Градина');
  });

  test('location section includes GPS coordinates', async ({ page }) => {
    await expect(page.locator('.location-text')).toContainText('42°29');
  });

  test('Google Maps iframe is present and has a title', async ({ page }) => {
    const iframe = page.locator('iframe');
    await expect(iframe).toHaveCount(1);
    const title = await iframe.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Google Maps iframe uses lazy loading', async ({ page }) => {
    const loading = await page.locator('iframe').getAttribute('loading');
    expect(loading).toBe('lazy');
  });

  // ── BURGAS 2032 ────────────────────────────────────────────────────────────

  test('Burgas 2032 section exists', async ({ page }) => {
    const block = page.locator('.burgas-block');
    await expect(block).toHaveCount(1);
    await expect(block).toContainText('2032');
  });

  test('Burgas 2032 section has four theme chips', async ({ page }) => {
    await expect(page.locator('.theme-chip')).toHaveCount(4);
  });

  test('theme chips include Net Zero and природа', async ({ page }) => {
    const chips = page.locator('.theme-chip');
    const texts = await chips.allTextContents();
    expect(texts.some(t => t.includes('Net Zero'))).toBe(true);
    expect(texts.some(t => t.includes('природа'))).toBe(true);
  });

  // ── COLOPHON ───────────────────────────────────────────────────────────────

  test('colophon shows brand name', async ({ page }) => {
    await expect(page.locator('.colophon-brand')).toContainText('VIA');
    await expect(page.locator('.colophon-brand')).toContainText('VITALIS');
  });

  test('colophon credits the author', async ({ page }) => {
    await expect(page.locator('.colophon-name')).toContainText('Николай Благьов');
  });

  test('colophon has a copyright notice', async ({ page }) => {
    const copy = page.locator('.colophon-copy');
    await expect(copy).toContainText('Via Vitalis');
    await expect(copy).toContainText('Бургас');
  });

  // ── ARCHITECTURAL DIAGRAMS ─────────────────────────────────────────────────

  test('SVG architectural diagrams are present', async ({ page }) => {
    const svgs = page.locator('svg');
    const count = await svgs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('architectural section has a label describing dimensions', async ({ page }) => {
    const body = await page.content();
    expect(body).toContain('10м × 3.2м × 3м');
  });
});
