// actions/vip.js
const { Markup } = require('telegraf')
const crypto = require('crypto')
const {
  createTransaction,
  preConfirmTransaction,
  applyTransaction,
  initCardBinding,
  confirmCardBinding
} = require('../helpers/atmosPayment')
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
  ctx.session = ctx.session || {}

  if (ctx.state[0]) {
    const duration = ctx.state[0]
    const price = prices[duration]

    if (!price) {
      return ctx.reply('❌ Noto‘g‘ri reja tanlandi.')
    }

    // Karta ulash jarayoni: session orqali ishlash
    if (ctx.session.card_step) {
      const text = ctx.message?.text?.trim()

      if (ctx.session.card_step === 'enter_card_number') {
        if (!/^[0-9]{16}$/.test(text)) {
          return ctx.reply('❌ Noto‘g‘ri karta raqami. 16 xonali raqam kiriting.')
        }
        ctx.session.card_bind.card_number = text
        ctx.session.card_step = 'enter_expiry'
        return ctx.reply('📅 Karta amal qilish muddatini kiriting (YYMM formatda, masalan: 2605):')
      }

      if (ctx.session.card_step === 'enter_expiry') {
        if (!/^[0-9]{4}$/.test(text)) {
          return ctx.reply('❌ Noto‘g‘ri format. Masalan: 2605 (2026 yil may)')
        }

        const card_number = ctx.session.card_bind.card_number
        const expiry = text
        const result = await initCardBinding({ card_number, expiry })

        if (result?.transaction_id) {
          ctx.session.card_step = 'confirm_otp'
          ctx.session.card_bind.transaction_id = result.transaction_id
          return ctx.reply('📩 SMS kod yuborildi. Iltimos, uni kiriting:')
        } else {
          ctx.session.card_step = null
          return ctx.reply('❌ Karta bog‘lashda xatolik. Keyinroq urinib ko‘ring.')
        }
      }

      if (ctx.session.card_step === 'confirm_otp') {
        const otp = text
        const transaction_id = ctx.session.card_bind.transaction_id
        const res = await confirmCardBinding({ transaction_id, otp, userId: ctx.user.id })

        if (res?.data?.card_token) {
          ctx.session.card_step = null
          return ctx.reply('✅ Karta muvaffaqiyatli bog‘landi. Endi VIP to‘lovni qayta boshlang.')
        } else {
          return ctx.reply('❌ Kod noto‘g‘ri yoki vaqt tugagan. Yana urinib ko‘ring.')
        }
      }
      return
    }

    const random = crypto.randomInt(10000)
    const amount = price * 100 + random
    const realAmount = amount / 100
    const requestId = `${ctx.user.id}_${Date.now()}`

    try {
      await Deposit.create({
        status: 'pending',
        type: 'atmos',
        amount: realAmount,
        currency: 'UZS',
        per: duration,
        user: ctx.user.id,
        ext_id: requestId,
        createdAt: new Date()
      })

      const transactionData = await createTransaction(ctx.user.id, amount)
      if (!transactionData || !transactionData.transaction_id) {
        throw new Error('Atmos to‘lov tranzaksiyasi yaratilmagan')
      }

      const user = await User.findOne({ id: ctx.user.id })
      const card_token = user?.card_token

      if (!card_token) {
        ctx.session.card_bind = {}
        ctx.session.card_step = 'enter_card_number'
        return ctx.reply('❗ Karta tokeni topilmadi. Karta bog‘lashni boshlaymiz.\n💳 Karta raqamini kiriting (16 raqam):')
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