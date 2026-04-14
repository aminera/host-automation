/**
 * Converts an HTML string to a PDF Buffer using Puppeteer.
 * NOTE: Puppeteer runs server-side only. Do not call from edge runtime.
 */

const PDF_BASE_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #222; padding: 32px 48px; margin: 0; font-size: 14px; line-height: 1.7; }
  h1 { font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 12px; }
  h2 { font-size: 17px; font-weight: 600; margin: 20px 0 8px; }
  h3 { font-size: 14px; font-weight: 600; margin: 16px 0 6px; }
  p  { margin: 0; min-height: 1.7em; line-height: 1.7; }
  p + p { margin-top: 2px; }
  ul, ol { padding-left: 22px; margin: 0 0 12px; }
  li { margin-bottom: 4px; }
  strong { font-weight: 600; } em { font-style: italic; } u { text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; }
  td, th { vertical-align: top; }
`;

/**
 * If the HTML is a bare fragment (no DOCTYPE / <html> tag), wraps it in a
 * complete document with baseline print-ready CSS. Full documents (old-style
 * templates that already contain <html>) are passed through unchanged.
 */
function prepareHtml(html: string): string {
  const isFullDoc = /^\s*<!doctype/i.test(html) || /<html[\s>]/i.test(html);
  if (isFullDoc) return html;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><style>${PDF_BASE_CSS}</style></head><body>${html}</body></html>`;
}

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // Dynamic import keeps Puppeteer out of the client bundle.
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(prepareHtml(html), { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
