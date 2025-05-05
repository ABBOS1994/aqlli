const { Markup } = require('telegraf')
const crypto = require('crypto')
const atmosAPI = require('../helpers/atmos')

const prices = {
  24: 6000,
  168: 15000,
  720: 44000,
  87600: 119000
}

const Deposit = require('../models/deposit')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  if (ctx.state[0]) {
    try {
      // Random qo'shimchasi bilan to'lov summasini hisoblash
      const random = crypto.randomInt(10000)
      const amount = prices[ctx?.state[0]] * 100 + random
      const realAmount = amount / 100

      // To'lov identifikatori va tavsifi
      const orderId = `VIP_${ctx.user.id}_${Date.now()}`
      const description = `VIP Obuna ${ctx.state[0]} soat - ${ctx.user.id}`

      // Qaytish URL manzili
      const returnUrl =
        process.env.ATMOS_RETURN_URL ||
        `https://t.me/${ctx.botInfo?.username || 'misolai_bot'}`

      // Atmos to'lov yaratish
      const payment = await atmosAPI.createPayment(
        amount,
        description,
        returnUrl,
        orderId
      )
      console.log(1, payment)

      // Agar to'lov yaratilmagan bo'lsa
      if (!payment || !payment.payment_url) {
        console.error("Atmos to'lov yaratishda xatolik:", payment)

        // Xatolik turi bo'yicha turli xabarlar
        let errorMessage = 'error.payment_creation'
        if (payment && payment.error) {
          if (payment.error.isTimeout) {
            errorMessage = 'error.payment_timeout'
            console.error('Atmos serveriga ulanishda timeout xatoligi.')
          }
        }

        return ctx.editMessageText(
          ctx.i18n.t(errorMessage),
          Markup.inlineKeyboard([
            Markup.callbackButton(ctx.i18n.t('back'), 'vip')
          ]).extra({
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        )
      }

      // Ma'lumotlar bazasiga to'lov ma'lumotlarini saqlash
      await Deposit.create({
        status: 'pending',
        type: 'atmos',
        amount: realAmount,
        currency: 'UZS',
        per: ctx.state[0],
        user: ctx.user.id,
        createdAt: new Date(),
        orderId: orderId,
        referenceId: payment.reference_id,
        paymentId: payment.payment_id
      })

      // Foydalanuvchiga to'lov havolasini yuborish
      return ctx.editMessageText(
        ctx.i18n.t('vip.choose.text', { number: realAmount.format(1) }),
        Markup.inlineKeyboard(
          [
            Markup.urlButton(ctx.i18n.t('vip.choose.key'), payment.payment_url),
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
    } catch (error) {
      console.error("VIP to'lov yaratishda xatolik:", error.message)

      return ctx.editMessageText(
        ctx.i18n.t('error.payment_creation'),
        Markup.inlineKeyboard([
          Markup.callbackButton(ctx.i18n.t('back'), 'vip')
        ]).extra({
          parse_mode: 'HTML',
          disable_web_page_preview: true
        })
      )
    }
  }

  // VIP tariflar menyusini ko'rsatish
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
