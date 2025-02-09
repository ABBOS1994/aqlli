const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        quantity: 0,
      })
      return ctx.replyWithHTML('Foydalanuvchilar soni o‘chirildi', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Sozlashni davom ettirish',
            `admin_view_id_${view._id}`,
          ),
        ]),
      })
    }

    ctx.user.state = `admin_view_quantity_${ctx.state[0]}`

    return ctx.replyWithHTML('Maksimal qabul qiluvchilar sonini kiriting', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Ortga', `admin_view_id_${ctx.state[0]}`),
      ]),
      parse_mode: 'HTML',
    })
  } else {
    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      quantity: ctx.message.text,
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Qabul qiluvchilar soni saqlandi', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Sozlashni davom ettirish',
          `admin_view_id_${view._id}`,
        ),
      ]),
    })
  }
}
