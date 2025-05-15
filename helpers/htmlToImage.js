const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const tmpPath = path.join(__dirname, 'puppeteer_tmp')
if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath)
}

let browser
;(async () => {
  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--no-first-run',
      '--disable-default-apps',
      '--disable-web-security'
    ],
    userDataDir: tmpPath, // 🔥 maxsus toza papka
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
