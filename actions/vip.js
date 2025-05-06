//actions/vip.js
const { Markup } = require('telegraf')
const crypto = require('crypto')
const { createTransaction, preConfirmTransaction, applyTransaction } = require('../helpers/atmosPayment')
const Deposit = require('../models/deposit')
const User = require('../models/user')

const prices = {
  24: 6000,
  168: 15000,
  720: 44000,
  87600: 119000
}

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (ctx.state[0]) {
    const random = crypto.randomInt(10000)
    const amount = prices[ctx.state[0]] * 100 + random
    const realAmount = amount / 100
    const requestId = `${ctx.user.id}_${Date.now()}`

    try {
      await Deposit.create({
        status: 'pending',
        type: 'atmos',
        amount: realAmount,
        currency: 'UZS',
        per: ctx.state[0],
        user: ctx.user.id,
        ext_id: requestId,
        createdAt: new Date()
      })
      const transactionData = await createTransaction(await ctx.user.id, await amount)
      if (!transactionData || !transactionData.transaction_id) {
        throw new Error('Atmos to‘lov tranzaksiyasi yaratilmagan')
      }

      const user = await User.findOne({ id: ctx.user.id })
      const card_token = user.card_token

      if (!card_token) {
        return ctx.reply('❗ Karta tokeni topilmadi. Avval kartani bog‘lang.')
      }

      const preConfirm = await preConfirmTransaction(transactionData.transaction_id, card_token)
      if (!preConfirm || preConfirm.result?.code !== 'OK') {
        throw new Error('Pre-confirm bosqichi muvaffaqiyatsiz')
      }

      const apply = await applyTransaction(transactionData.transaction_id, '111111')
      if (!apply || apply.result?.code !== 'OK') {
        throw new Error('To‘lovni yakunlashda xatolik')
      }

      return ctx.editMessageText(
        ctx.i18n.t('vip.choose.text', { number: realAmount.format(1) }),
        Markup.inlineKeyboard(
          [
            Markup.callbackButton('✅ To‘lov muvaffaqiyatli', 'vip'),
            Markup.callbackButton(ctx.i18n.t('back'), 'vip')
          ],
          { columns: 1 }
        ).extra({
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_to_message_id: ctx.message?.message_id,
          allow_sending_without_reply: true
        })
      )
    } catch (err) {
      console.error('❌ Atmos tranzaksiya jarayonida xatolik:', err.response?.data || err.message)
      return ctx.reply('❌ Tranzaksiya yaratishda xatolik yuz berdi. Keyinroq urinib ko‘ring.')
    }
  }

  return ctx[ctx.message ? 'reply' : 'editMessageText'](
    ctx.i18n.t('vip.text'),
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(ctx.i18n.t('vip.keys.24'), `vip_24`),
        Markup.callbackButton(ctx.i18n.t('vip.keys.168'), `vip_168`)
      ],
      [
        Markup.callbackButton(ctx.i18n.t('vip.keys.720'), `vip_720`),
        Markup.callbackButton(ctx.i18n.t('vip.keys.87600'), `vip_87600`)
      ],
      [Markup.callbackButton(ctx.i18n.t('back'), 'cabinet')]
    ]).extra({
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  )
}