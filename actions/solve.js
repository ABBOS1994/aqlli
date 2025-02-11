const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  ctx.user.state = null

  if (ctx.state[0] === 'acquainted') ctx.user.acquainted = true
  else if (ctx.state[0] === 'image') {
    if (ctx.state[1]) {
      ctx.user.state = `solve_image_${ctx.state[1]}`

      return ctx.editMessageText(
        ctx.i18n.t(`solve.solution.image.${ctx.state[1]}`),
        Markup.inlineKeyboard([
          Markup.callbackButton(ctx.i18n.t('back'), 'solve_image')
        ]).extra({
          disable_web_page_preview: true,
          parse_mode: 'HTML'
        })
      )
    }

    return ctx.editMessageText(
      ctx.i18n.t(`solve.solution.image.text`),
      Markup.inlineKeyboard([
        [
          Markup.callbackButton(
            ctx.i18n.t('solve.solution.image.keys.default'),
            'solve_image_default'
          )
        ],
        [
          Markup.callbackButton(
            ctx.i18n.t('solve.solution.image.keys.math'),
            'solve_image_math'
          )
        ],
        [Markup.callbackButton(ctx.i18n.t('back'), 'solve')]
      ]).extra({
        disable_web_page_preview: true,
        parse_mode: 'HTML'
      })
    )
  } else if (ctx.state[0])
    return ctx.editMessageText(
      ctx.i18n.t(`solve.solution.${ctx.state[0]}`),
      Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('back'), 'solve')
      ]).extra({
        disable_web_page_preview: true,
        parse_mode: 'HTML'
      })
    )

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t(`solve.text${ctx.user.acquainted ? '1' : ''}`),
    Markup.inlineKeyboard(
      ctx.user.acquainted
        ? [
            Markup.callbackButton(ctx.i18n.t('solve.keys.text'), 'solve_text'),
            Markup.callbackButton(
              ctx.i18n.t('solve.keys.image'),
              'solve_image'
            ),
          ]
        : [Markup.callbackButton(ctx.i18n.t('solve.key'), 'solve_acquainted')],
      { columns: 1 }
    ).extra({
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    })
  )
}
