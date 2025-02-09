const puppeteer = require('puppeteer')

let browser

const launchBrowser = async () => {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: 'new', // Yangi headless rejimi
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
  return browser
}

module.exports = async (html) => {
  const browser = await launchBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(html, { waitUntil: 'networkidle2' })

    const screenshot = await page.screenshot({ fullPage: true })

    return screenshot
  } catch (error) {
    console.error('❌ Puppeteer xatosi:', error)
    return null
  } finally {
    await page.close()
  }
}
