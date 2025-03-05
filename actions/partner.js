const { Markup } = require('telegraf')

const XlsxStreamWriter = require('xlsx-stream-writer')

const User = require('../models/user')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (ctx.state[0] === 'list') {
    const referrals = await User.find({ from: `r-${ctx.from.id}` })
    const rows = []
    rows.push(['ID', 'NAME', 'USERNAME', 'DEPOSIT', 'REGISTER_DATE'])
    referrals.forEach((user) => {
      rows.push([
        user.id,
        user.name,
        user.username,
        user.deposit,
        user.createdAt
      ])
    })

    const xlsx = new XlsxStreamWriter()
    xlsx.addRows(rows)

    return xlsx.getFile().then((buffer) =>
      ctx.replyWithDocument({
        source: buffer,
        filename: `referrals.xlsx`
      })
    )
  } else if (ctx.state[0] === 'withdraw') {
    return ctx.editMessageText(
      ctx.i18n.t('partner.withdraw.text'),
      Markup.inlineKeyboard([
        [
          Markup.urlButton(
            ctx.i18n.t('partner.withdraw.key.text'),
            ctx.i18n.t('partner.withdraw.key.url')
          )
        ],
        [Markup.callbackButton(ctx.i18n.t('back'), 'partner')]
      ]).extra({
        disable_web_page_preview: true,
        parse_mode: 'HTML'
      })
    )
  }

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('partner.text', {
      refCount: ctx.user.refCount,
      earned: ctx.user.earned.format(0),
      withdraw: ctx.user.withdraw.format(0),
      diff: (ctx.user.earned - ctx.user.withdraw).format(0),
      link: `https://t.me/${'misolai_bot'}?start=r-${ctx.from.id}`
    }),
    Markup.inlineKeyboard([
      [Markup.callbackButton(ctx.i18n.t('partner.keys.list'), 'partner_list')],
      [
        Markup.callbackButton(
          ctx.i18n.t('partner.keys.withdraw'),
          'partner_withdraw'
        )
      ]
    ]).extra({
      disable_web_page_preview: true,
      parse_mode: 'HTML'
    })
  )
}
