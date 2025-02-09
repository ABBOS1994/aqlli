const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const mail = await Mail.findByIdAndDelete(ctx.state[0])

  if (!mail) {
    return ctx.reply('❌ Xatolik: Tarqatish topilmadi.')
  }

  return ctx.replyWithHTML('🗑 Tarqatish o‘chirildi.', {
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('⬅️ Orqaga', 'admin_mail'),
    ]),
    parse_mode: 'HTML',
  })
}
