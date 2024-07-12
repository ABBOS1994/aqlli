const puppeteer = require('puppeteer')

let browser

;(async () => {
  browser = await puppeteer.launch({
    headless: 'new', // Use the new headless mode
    args: [
      '--no-sandbox',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-web-security',
    ],
    ignoreDefaultArgs: [
      '--disable-extensions',
      '--enable-automation',
      '--disable-component-extensions-with-background-pages',
    ],
  })
})()

module.exports = async (html) => {
  // Ensure the browser is initialized
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--no-first-run',
        '--disable-default-apps',
        '--disable-web-security',
      ],
      ignoreDefaultArgs: [
        '--disable-extensions',
        '--enable-automation',
        '--disable-component-extensions-with-background-pages',
      ],
    })
  }

  const page = await browser.newPage()

  await page.setContent(html, { waitUntil: 'networkidle2' })

  const screenshot = await page.screenshot({ fullPage: true })

  await page.close()

  return screenshot
}
