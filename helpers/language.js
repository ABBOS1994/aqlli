const fs = require('fs')
const path = require('path')
const { Markup } = require('telegraf')

const localesPath = path.resolve('locales')

const keyboard = fs.readdirSync(localesPath).map((file) => {
  const localeCode = path.basename(file, path.extname(file))
  return Markup.button.callback(localeCode.toUpperCase(), `translateBot_${localeCode}`)
})

const languageKeyboard = Markup.inlineKeyboard(keyboard, { columns: 2 })

module.exports = languageKeyboard
