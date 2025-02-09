const { Markup } = require('telegraf')

module.exports = (ctx) => {
  return Markup.keyboard([
    ['📜 Buyurtmalar', '⚙️ Sozlamalar'],
    ['ℹ️ Yordam', '📞 Kontakt'],
  ]).resize()
}
