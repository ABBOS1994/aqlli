const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        $unset: { startDate: 1 },
      })
      return ctx.replyWithHTML('Sana va vaqt o‘chirildi.', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Sozlashni davom ettirish',
            `admin_view_id_${view._id}`,
          ),
        ]),
      })
    }

    ctx.user.state = `admin_view_startDate_${ctx.state[0]}`

    return ctx.replyWithHTML(
      'Ko‘rishlarni boshlash sanasi va vaqtini kiriting.\n\nMisol: 2025.02.10 14:30',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('‹ Orqaga', `admin_view_id_${ctx.state[0]}`),
        ]),
        parse_mode: 'HTML',
      },
    )
  } else {
    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      startDate: new Date(ctx.message.text),
    })

    ctx.user.state = null

    return ctx.replyWithHTML('Ko‘rishlarni boshlash sanasi va vaqti saqlandi.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Sozlashni davom ettirish',
          `admin_view_id_${view._id}`,
        ),
      ]),
    })
  }
}
