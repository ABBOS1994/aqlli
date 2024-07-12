const mainKeyboard = require('../helpers/mainKeyboard')

module.exports = async (ctx) => {
  return ctx.replyWithHTML(ctx.i18n.t('start.text', { name: ctx.user.name }), {
    reply_markup: mainKeyboard(ctx),
    disable_web_page_preview: true,
    parse_mode: 'HTML',
  })
}
