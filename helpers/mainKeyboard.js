const Markup = require('telegraf/markup')

module.exports = (ctx) => {
  const keyboard = [
    [ctx.i18n.t('start.keys.solve')],
    [ctx.i18n.t('start.keys.cabinet'), ctx.i18n.t('start.keys.help')],
    [ctx.i18n.t('start.keys.partner')],
  ]

  return Markup.keyboard(keyboard).resize()
}
