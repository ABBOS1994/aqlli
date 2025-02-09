const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.deleteMessage()

  const view = await ctx.View.findById(ctx.state[0])
  view.unique = !view.unique
  await view.save()

  return ctx.replyWithHTML(
    `Unikalik ${view.unique ? 'yoqildi' : 'o‘chirildi'}.`,
    {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Sozlashni davom ettirish',
          `admin_view_id_${ctx.state[0]}`,
        ),
      ]),
      parse_mode: 'HTML',
    },
  )
}
