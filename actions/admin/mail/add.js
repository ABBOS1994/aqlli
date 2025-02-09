const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail') // ✅ Mail modelini to‘g‘ri chaqirish

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    ctx.user.state = 'admin_mail_add'
    return ctx.replyWithHTML('Har qanday postni tayyor holda yuboring.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('⬅️ Orqaga', 'admin_mail'),
      ]),
      parse_mode: 'HTML',
    })
  } else {
    const mail = new Mail({
      uid: ctx.from.id,
      message: ctx.message,
      keyboard: ctx.message?.reply_markup?.inline_keyboard || [], // ✅ Xatoni oldini olish uchun fallback
      status: 'notStarted',
    })

    await mail.save()
    ctx.user.state = null

    return ctx.replyWithHTML('Post saqlandi.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙️ Sozlashni davom ettirish',
          `admin_mail_id_${mail._id}`,
        ),
      ]),
    })
  }
}
