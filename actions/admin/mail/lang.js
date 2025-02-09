const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
        lang: null,
      })

      if (!mail) {
        return ctx.replyWithHTML('❌ Xatolik: Tarqatish topilmadi.')
      }

      return ctx.replyWithHTML('📌 Til o‘chirildi.', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            '🔧 Sozlashni davom ettirish',
            `admin_mail_id_${mail._id}`,
          ),
        ]),
      })
    }

    ctx.user.state = `admin_mail_lang_${ctx.state[0]}`

    return ctx.replyWithHTML(
      '🔤 Tilni kiriting.\n\n📌 Misol: <code>uz</code> yoki <code>ru</code>',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('⬅️ Orqaga', `admin_mail_id_${ctx.state[0]}`),
        ]),
        parse_mode: 'HTML',
      },
    )
  } else {
    const mail = await ctx.Mail.findByIdAndUpdate(ctx.state[0], {
      lang: ctx.message.text.trim(),
    })

    if (!mail) {
      return ctx.replyWithHTML('❌ Xatolik: Tarqatish topilmadi.')
    }

    ctx.user.state = null

    return ctx.replyWithHTML(`📌 Til saqlandi: <b>${ctx.message.text.trim()}</b>`, {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '🔧 Sozlashni davom ettirish',
          `admin_mail_id_${mail._id}`,
        ),
      ]),
      parse_mode: 'HTML',
    })
  }
}
