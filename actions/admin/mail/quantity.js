const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const mail = await Mail.findByIdAndUpdate(ctx.state[0], { quantity: 0 })
      return ctx.replyWithHTML('👥 Oluvchilar soni o‘chirildi.', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            '⚙️ Sozlashni davom ettirish',
            `admin_mail_id_${mail._id}`,
          ),
        ]),
      })
    }

    ctx.user.state = `admin_mail_quantity_${ctx.state[0]}`

    return ctx.replyWithHTML('👥 Tarqatish uchun maksimal oluvchilar sonini kiriting:', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('⬅️ Orqaga', `admin_mail_id_${ctx.state[0]}`),
      ]),
      parse_mode: 'HTML',
    })
  } else {
    // ✅ Kiritilgan qiymat son ekanligini tekshirish
    const quantity = parseInt(ctx.message.text, 10)
    if (isNaN(quantity) || quantity < 0) {
      return ctx.reply('❌ Noto‘g‘ri format! Faqat son kiriting.')
    }

    const mail = await Mail.findByIdAndUpdate(ctx.state[0], { quantity })

    ctx.user.state = null

    return ctx.replyWithHTML(`✅ Oluvchilar soni ${quantity} qilib saqlandi.`, {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙️ Sozlashni davom ettirish',
          `admin_mail_id_${mail._id}`,
        ),
      ]),
    })
  }
}
