const subscription = require('../middlewares/subscription')
const mainKeyboard = require('../helpers/mainKeyboard')

module.exports = async (ctx, next) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.editMessageText('Til muvaffaqiyatli o‘rnatildi.')

    await ctx.replyWithHTML('Botga xush kelibsiz!', {
      reply_markup: mainKeyboard(ctx),
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    })

    ctx.updateType = 'message'
    return subscription(ctx, next)
  } else {
    if (ctx.chat.type !== 'private') return

    if (ctx.message?.text.startsWith('/lang')) {
      return ctx.replyWithHTML('Tilni tanlang:', {
        reply_markup: require('../helpers/language').extra(),
      })
    } else return next()
  }
}
