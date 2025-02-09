const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    ctx.user.state = 'admin_view_add'
    return ctx.replyWithHTML('Postni tayyor holda yuboring.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Ortga', 'admin_view'),
      ]),
      parse_mode: 'HTML',
    })
  } else {
    const view = ctx.View({
      uid: ctx.from.id,
      message: ctx.message,
      keyboard: ctx.message?.reply_markup?.inline_keyboard,
      status: 'notStarted',
    })
    await view.save()
    ctx.user.state = null

    return ctx.replyWithHTML('Post saqlandi', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Sozlashni davom ettirish',
          `admin_view_id_${view._id}`,
        ),
      ]),
    })
  }
}
