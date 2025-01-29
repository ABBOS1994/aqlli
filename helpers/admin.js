const { Markup } = require('telegraf')

const backKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('‹ Назад', 'admin_back'),
], { columns: 2 })

module.exports = { backKeyboard }