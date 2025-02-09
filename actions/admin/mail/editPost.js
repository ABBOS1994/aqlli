const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    ctx.user.state = `admin_mail_editPost_${ctx.state[0]}`
    await ctx.deleteMessage()

    return ctx.replyWithHTML('📩 Yangi xabarni yuboring.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('⬅️ Orqaga', `admin_mail_id_${ctx.state[0]}`),
      ]),
      parse_mode: 'HTML',
    })
  } else {
    const mail = await Mail.findByIdAndUpdate(
      ctx.state[0],
      {
        keyboard: ctx.message?.reply_markup?.inline_keyboard || [],
        message: ctx.message,
      },
      { new: true }, // ✅ Yangilangan hujjatni qaytarish
    )

    if (!mail) {
      return ctx.reply('❌ Xatolik: Tarqatish topilmadi.')
    }

    ctx.user.state = null

    return ctx.replyWithHTML('✅ Xabar saqlandi.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙️ Sozlashni davom ettirish',
          `admin_mail_id_${mail._id}`,
        ),
      ]),
    })
  }
}
