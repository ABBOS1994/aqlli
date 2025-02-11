const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  return ctx.replyWithHTML(
    ctx.i18n.t('help.text'),
    Markup.inlineKeyboard([
      Markup.urlButton(ctx.i18n.t('help.key.text'), ctx.i18n.t('help.key.url'))
    ]).extra({
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    })
  )
}
