/**
 * Converts an HTML string to a PDF Buffer using Puppeteer.
 * NOTE: Puppeteer runs server-side only. Do not call from edge runtime.
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // Dynamic import keeps Puppeteer out of the client bundle.
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
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
