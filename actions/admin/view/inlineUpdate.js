const { Markup } = require('telegraf')
const View = require('../../../models/view')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}

const statuses = {
  notStarted: '🛠 Ko‘rishlar hali boshlanmagan',
  doing: '🕒 Ko‘rishlar davom etmoqda',
  ended: '📬 Ko‘rishlar tugallandi',
}

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  const view = await View.findById(ctx.state[0])

  if (!view) {
    return ctx.editMessageText('❌ Xatolik: Ko‘rish topilmadi.')
  }

  const result = `${statuses[view.status]}\n\n` +
    `👁 Ko‘rilganlar: ${view.views}\n\n` +
    `🕓 Boshlanish: ${
      view.startDate ? new Date(view.startDate).toLocaleString('uz-UZ', dateConfig) : '❌'
    }\n` +
    `🕤 Tugash: ${
      view.endDate ? new Date(view.endDate).toLocaleString('uz-UZ', dateConfig) : '❌'
    }\n` +
    `🫂 Maksimal miqdor: ${view.quantity === 0 ? '♾️ Cheksiz' : view.quantity}\n` +
    `🏳️ Til: ${view.lang ? view.lang : 'Barcha tillar'}\n` +
    `✉️ Unikal: ${view.unique ? '✅ Ha' : '❌ Yo‘q'}`

  return ctx.editMessageText(result, {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('🔄 Yangilash', `inlineUpdateView_${view._id}`),
    ]),
  })
}
