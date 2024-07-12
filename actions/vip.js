const { Markup } = require('telegraf')

const crypto = require('crypto')

const prices = {
  24: 6000,
  168: 15000,
  720: 44000,
  87600: 119000,
}

const Deposit = require('../models/deposit')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (ctx.state[0]) {
    const random = crypto.randomInt(10000)
    const amount = prices[ctx.state[0]] * 100 + random
    const realAmount = amount / 100

    await Deposit.create({
      status: 'pending',
      type: 'payme',
      amount: realAmount,
      currency: 'UZS',
      per: ctx.state[0],
      user: ctx.user.id,
      createdAt: new Date(),
    })

    const finalUrl = encodeURI(
      `https://payme.uz/${process.env.PAYME_CARD_ID}/${amount}`,
    )

    return ctx.editMessageText(
      ctx.i18n.t('vip.choose.text', { number: realAmount.format(1) }),
      Markup.inlineKeyboard(
        [
          Markup.urlButton(ctx.i18n.t('vip.choose.key'), finalUrl),
          Markup.callbackButton(ctx.i18n.t('back'), 'vip'),
        ],
        { columns: 1 },
      ).extra({
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_to_message_id: ctx.message?.message_id,
        allow_sending_without_reply: true,
      }),
    )
  }

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('vip.text'),
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(ctx.i18n.t('vip.keys.24'), `vip_24`),
        Markup.callbackButton(ctx.i18n.t('vip.keys.168'), `vip_168`),
      ],
      [
        Markup.callbackButton(ctx.i18n.t('vip.keys.720'), `vip_720`),
        Markup.callbackButton(ctx.i18n.t('vip.keys.87600'), `vip_87600`),
      ],
      [Markup.callbackButton(ctx.i18n.t('back'), 'cabinet')],
    ]).extra({
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  )
}
