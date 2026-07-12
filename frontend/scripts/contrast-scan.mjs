import { chromium } from 'playwright';

function parseRGB(s) {
  const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
}

function lum({ r, g, b }) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const L1 = lum(a);
  const L2 = lum(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

async function scanPath(page, path) {
  await page.goto(`http://127.0.0.1:5173${path}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => {
    localStorage.setItem('engine_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
  });
  await page.reload({ waitUntil: 'networkidle' });
  // Give theme CSS a tick
  await page.waitForTimeout(200);

  return page.evaluate(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const tokenNames = [
      'ink-950', 'ink-900', 'ink-800', 'ink-700', 'ink-500',
      'ink-400', 'ink-300', 'ink-200', 'ink-50',
      'radar', 'zion', 'audio',
    ];
    const tokens = {};
    for (const t of tokenNames) {
      tokens[t] = cs.getPropertyValue('--color-' + t).trim() || '(missing)';
    }

    function parseRGB(s) {
      const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!m) return null;
      return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
    }
    function lum({ r, g, b }) {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function contrast(a, b) {
      const L1 = lum(a);
      const L2 = lum(b);
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    }
    function bgOf(el) {
      let e = el;
      while (e) {
        const c = parseRGB(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0.55) return c;
        e = e.parentElement;
      }
      return { r: 242, g: 243, b: 246, a: 1 };
    }

    const bad = [];
    for (const el of document.querySelectorAll('body *')) {
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;

      const hasOwnText = [...el.childNodes].some(
        (n) => n.nodeType === 3 && n.textContent && n.textContent.trim().length > 0
      );
      const isIcon = el.tagName === 'svg' || el.closest('svg');
      if (!hasOwnText && el.tagName !== 'svg') continue;

      const color = parseRGB(st.color);
      if (!color || color.a < 0.2) continue;
      const bg = bgOf(el);
      const ratio = contrast(color, bg);
      if (ratio < 4.5) {
        const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
        bad.push({
          tag: el.tagName,
          cls: String(el.className || '').slice(0, 140),
          text,
          color: st.color,
          bg: `rgb(${bg.r},${bg.g},${bg.b})`,
          ratio: Math.round(ratio * 100) / 100,
        });
      }
    }

    const seen = new Set();
    const failing = [];
    for (const b of bad.sort((a, c) => a.ratio - c.ratio)) {
      const k = `${b.cls}|${b.color}|${b.text}`;
      if (seen.has(k)) continue;
      seen.add(k);
      failing.push(b);
      if (failing.length >= 35) break;
    }

    // Probe utilities directly
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:-9999px;top:0;padding:8px;background:#fff';
    const classes = [
      'text-ink-50', 'text-ink-200', 'text-ink-400', 'text-ink-500', 'text-ink-700',
      'text-orange-400', 'text-cyan-400', 'text-emerald-400', 'text-red-400', 'text-purple-400',
    ];
    const probes = {};
    for (const c of classes) {
      const span = document.createElement('span');
      span.className = c;
      span.textContent = 'Aa';
      probe.appendChild(span);
    }
    document.body.appendChild(probe);
    for (const span of probe.querySelectorAll('span')) {
      const color = parseRGB(getComputedStyle(span).color);
      const ratio = color ? contrast(color, { r: 255, g: 255, b: 255, a: 1 }) : 0;
      probes[span.className] = {
        color: getComputedStyle(span).color,
        ratio: Math.round(ratio * 100) / 100,
        pass: ratio >= 4.5,
      };
    }
    probe.remove();

    return { path: location.pathname, tokens, probes, failCount: bad.length, failing };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const paths = ['/', '/features', '/login'];
const reports = [];
for (const p of paths) {
  try {
    reports.push(await scanPath(page, p));
  } catch (e) {
    reports.push({ path: p, error: String(e) });
  }
}

console.log(JSON.stringify(reports, null, 2));
await browser.close();
