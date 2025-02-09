const Markup = require('telegraf/markup')
const lauchWorker = require('../mail/lauchWorker')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const mail = await Mail.findByIdAndUpdate(ctx.state[0], { status: 'doing' })

  if (!mail) {
    return ctx.reply('❌ Xatolik: Tarqatish topilmadi.')
  }

  lauchWorker(mail._id)

  return ctx.replyWithHTML('📩 Tarqatish boshlandi!', {
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('👁 Ko‘rish', `admin_mail_id_${ctx.state[0]}`),
    ]),
    parse_mode: 'HTML',
  })
}
