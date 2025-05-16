const puppeteer = require('puppeteer')

let browser
;(async () => {
  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-web-security'
    ],
    ignoreDefaultArgs: [
      '--disable-extensions',
      '--enable-automation',
      '--disable-component-extensions-with-background-pages'
    ]
  })
})()

module.exports = async (html) => {
  const page = await browser.newPage()

  await page.setContent(html, { waitUntil: 'networkidle2' })

  const screenshot = await page.screenshot({ fullPage: true })

  await page.close()

  return screenshot
}
