const { Markup } = require('telegraf')

const backKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('⬅️ Orqaga', 'admin_back'),
])

module.exports = { backKeyboard }
