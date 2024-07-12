const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  const isPremium = ctx.user.vip && ctx.user.vip > new Date()

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('cabinet.text', {
      id: ctx.user.id,
      registered: new Date().toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      }),
      vip: isPremium
        ? new Date(ctx.user.vip).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          })
        : false,
    }),
    Markup.inlineKeyboard([
      [Markup.callbackButton(ctx.i18n.t('cabinet.key'), 'vip')],
    ]).extra({
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    }),
  )
}
