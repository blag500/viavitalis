/**
 * Accessibility tests for Via Vitalis
 *
 * Several tests in this file are EXPECTED TO FAIL against the current
 * index.html — intentionally. Each failing test documents a concrete gap
 * that needs to be fixed to reach WCAG 2.1 AA compliance. The fix required
 * is described in the test name and in the comment above each test.
 *
 * Tests marked "// GAP:" will fail until the HTML is updated.
 */

const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const path = require('path');

const FILE_URL = `file://${path.resolve(__dirname, '../index.html')}`;

test.describe('Accessibility — axe-core automated scan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
  });

  test('no critical accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(
      critical,
      `Critical violations:\n${critical.map(v => `  [${v.id}] ${v.description}`).join('\n')}`
    ).toHaveLength(0);
  });

  test('no serious accessibility violations', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(v => v.impact === 'serious');
    expect(
      serious,
      `Serious violations:\n${serious.map(v => `  [${v.id}] ${v.description}`).join('\n')}`
    ).toHaveLength(0);
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    expect(
      results.violations,
      `Contrast failures:\n${results.violations.map(v =>
        v.nodes.map(n => `  ${n.html}`).join('\n')
      ).join('\n')}`
    ).toHaveLength(0);
  });
});

test.describe('Accessibility — document structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
  });

  // GAP: The content is wrapped in <div class="wrap"> instead of <main>.
  // Screen-reader users rely on the "main" landmark to skip navigation and
  // jump directly to the page content. Fix: replace <div class="wrap"> with
  // <main class="wrap"> (or add role="main" as a minimum).
  test('page has a <main> landmark', async ({ page }) => {
    await expect(page.locator('main')).toHaveCount(1);
  });

  // GAP: Heading levels jump from <h1> to <h3> with no <h2> in between.
  // This breaks the outline for assistive technologies and fails WCAG 1.3.1.
  // Fix: introduce <h2> section headings (e.g. for the innovation grid,
  // specs, location, and Burgas 2032 sections) or promote the <h3> elements.
  test('heading hierarchy has no skipped levels (h1 → h3 without h2)', async ({ page }) => {
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();
    if (h3Count > 0) {
      expect(h2Count, 'h3 elements exist but no h2 — heading levels are skipped').toBeGreaterThan(0);
    }
  });

  // GAP: The innovation card titles use <div class="innovation-title"> instead
  // of a semantic heading (e.g. <h3>). They are visually prominent subheadings
  // but are invisible to the document outline. Fix: use <h3> (once an <h2>
  // exists above them) so that each card is a proper section in the outline.
  test('innovation titles use heading elements', async ({ page }) => {
    const headingTitles = page.locator('.innovation-item h2, .innovation-item h3, .innovation-item h4');
    await expect(headingTitles).toHaveCount(4);
  });

  // GAP: The colophon at the bottom is a <div>, not a <footer>.
  // Landmarks like <footer> allow screen-reader users to navigate quickly.
  // Fix: change <div class="colophon"> to a <footer> element.
  test('page has a <footer> landmark for the colophon', async ({ page }) => {
    await expect(page.locator('footer')).toHaveCount(1);
  });
});

test.describe('Accessibility — SVG and images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
  });

  // GAP: The architectural SVG diagrams convey spatial information (floor plan,
  // perspective view, equipment layout) but have no accessible name. Screen
  // readers skip them entirely. Fix: add a <title> element as the first child
  // of each <svg>, set role="img", and add aria-labelledby pointing to the
  // <title>. Purely decorative SVGs should use aria-hidden="true" instead.
  test('SVG diagrams have an accessible name or are explicitly hidden', async ({ page }) => {
    const svgs = page.locator('svg');
    const count = await svgs.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const svg = svgs.nth(i);
      const hasTitle = (await svg.locator('title').count()) > 0;
      const ariaLabel = await svg.getAttribute('aria-label');
      const ariaLabelledBy = await svg.getAttribute('aria-labelledby');
      const ariaHidden = await svg.getAttribute('aria-hidden');
      const role = await svg.getAttribute('role');

      const isNamed = hasTitle || ariaLabel || ariaLabelledBy;
      const isDecorative = ariaHidden === 'true' || role === 'presentation' || role === 'none';

      expect(
        isNamed || isDecorative,
        `SVG[${i}] must either have an accessible name (<title>, aria-label, or aria-labelledby) ` +
        `or be marked decorative (aria-hidden="true" or role="presentation")`
      ).toBe(true);
    }
  });
});

test.describe('Accessibility — ARIA and semantics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
  });

  // GAP: The large decorative quotation mark rendered by .pull-quote-mark
  // (" character with font-size:120px) is read aloud by some screen readers as
  // "left double quotation mark". It is purely visual. Fix: add aria-hidden="true"
  // to the element so that assistive technologies skip it.
  test('decorative pull-quote mark has aria-hidden="true"', async ({ page }) => {
    const mark = page.locator('.pull-quote-mark');
    await expect(mark).toHaveAttribute('aria-hidden', 'true');
  });

  // GAP: The decorative "2032" year displayed vertically in .burgas-year-display
  // is purely ornamental — the year is already present in the heading text.
  // Fix: add aria-hidden="true" so it is not read twice by screen readers.
  test('decorative Burgas 2032 year display has aria-hidden="true"', async ({ page }) => {
    const yearDisplay = page.locator('.burgas-year-display');
    await expect(yearDisplay).toHaveAttribute('aria-hidden', 'true');
  });

  // GAP: The section dividers (.section-rule) display numbers and titles
  // visually, but they don't use <section> or heading elements, so they
  // provide no document structure. The section number (01, 02…) is also read
  // aloud as content. Fix: mark the numbers with aria-hidden="true" and
  // convert the section title to an <h2>.
  test('section rule numbers are aria-hidden (they are decorative counters)', async ({ page }) => {
    const nums = page.locator('.section-rule-num');
    const count = await nums.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(nums.nth(i)).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

test.describe('Accessibility — SEO and social metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FILE_URL);
  });

  // GAP: There is no <meta name="description"> tag. Search engines and social
  // sharing platforms fall back to scraping page text, producing unpredictable
  // previews. Fix: add a concise Bulgarian description of 120-160 characters.
  test('has a meta description', async ({ page }) => {
    const meta = page.locator('meta[name="description"]');
    await expect(meta).toHaveCount(1);
    const content = await meta.getAttribute('content');
    expect(content, 'meta description should be non-empty').toBeTruthy();
    expect(content.length, 'meta description should be at least 50 characters').toBeGreaterThanOrEqual(50);
  });

  // GAP: No Open Graph tags are present. When shared on social media the page
  // will render without a title, image, or description card. Fix: add at
  // minimum og:title, og:description, og:type, and og:image.
  test('has Open Graph title tag', async ({ page }) => {
    const og = page.locator('meta[property="og:title"]');
    await expect(og).toHaveCount(1);
    const content = await og.getAttribute('content');
    expect(content).toBeTruthy();
  });

  test('has Open Graph description tag', async ({ page }) => {
    const og = page.locator('meta[property="og:description"]');
    await expect(og).toHaveCount(1);
  });
});

test.describe('Accessibility — responsive / viewport', () => {
  // GAP: There are no tests verifying that the responsive breakpoints work
  // as intended. The CSS collapses multi-column grids at max-width:768px, but
  // this is never validated. A regression in the media queries could silently
  // break the mobile layout. The tests below cover the critical breakpoints.

  test('innovation grid stacks to single column on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FILE_URL);

    const firstItem = page.locator('.innovation-item').first();
    const secondItem = page.locator('.innovation-item').nth(1);

    const firstBox = await firstItem.boundingBox();
    const secondBox = await secondItem.boundingBox();

    // On mobile both items should span the full width (same x position, different y)
    expect(firstBox.x).toBeCloseTo(secondBox.x, 0);
    expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
  });

  test('lead section stacks to single column on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(FILE_URL);

    const leadText = page.locator('.lead-text');
    const leadAside = page.locator('.lead-aside');

    const textBox = await leadText.boundingBox();
    const asideBox = await leadAside.boundingBox();

    // On mobile the aside should appear below the text, not beside it
    expect(asideBox.y).toBeGreaterThan(textBox.y + textBox.height - 10);
  });

  test('content is readable at desktop width (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(FILE_URL);

    const h1 = page.locator('h1.masthead-name');
    await expect(h1).toBeVisible();

    // The innovation grid should be two columns — items in the same row share y
    const items = page.locator('.innovation-item');
    const box0 = await items.nth(0).boundingBox();
    const box1 = await items.nth(1).boundingBox();
    expect(box0.y).toBeCloseTo(box1.y, -1); // same row
  });
});
