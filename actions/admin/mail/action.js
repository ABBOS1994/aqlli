const Markup = require('telegraf/markup')
const lauchWorker = require('../mail/lauchWorker')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const updateObject = {}
  if (ctx.state[1] === 'stop') updateObject.status = 'stopped'
  else if (ctx.state[1] === 'pause') updateObject.status = 'paused'
  else if (ctx.state[1] === 'continue') {
    updateObject.status = 'doing'
    lauchWorker(ctx.state[0])
  }

  const mail = await Mail.findByIdAndUpdate(ctx.state[0], updateObject)

  if (!mail) {
    return ctx.reply('❌ Xatolik: Tarqatish topilmadi.')
  }

  return ctx.replyWithHTML(
    `📩 Tarqatish ${
      ctx.state[1] === 'stop'
        ? 'to‘xtatildi'
        : ctx.state[1] === 'pause'
        ? 'pauza qilindi'
        : 'davom ettirildi'
    }.`,
    {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙ Sozlashni davom ettirish',
          `admin_mail_id_${ctx.state[0]}`,
        ),
      ]),
      parse_mode: 'HTML',
    },
  )
}
