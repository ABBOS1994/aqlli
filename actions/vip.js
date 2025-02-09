const { Markup } = require('telegraf')
const { createTransaction } = require('../helpers/atmos')
const Deposit = require('../models/deposit')

const prices = {
  24: 6000,
  168: 15000,
  720: 44000,
  87600: 119000,
}

module.exports = async (ctx) => {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    if (ctx.state[0]) {
      const period = ctx.state[0]
      const amount = prices[period]

      const { paymentUrl, transactionId } = await createTransaction(amount, `VIP ${period} soatga obuna`, ctx.user.id)

      await Deposit.create({
        status: 'pending',
        type: 'atmos',
        transaction_id: transactionId,
        amount: amount,
        currency: 'UZS',
        per: period,
        user: ctx.user.id,
        createdAt: new Date(),
      })

      return ctx.editMessageText(
        `💎 *VIP obuna tanlandi: ${period} soat*\n💰 To‘lov summasi: *${amount.toLocaleString()} so‘m*\n\n⬇️ To‘lovni amalga oshirish uchun havolaga o‘ting:`,
        {
          parse_mode: 'MarkdownV2',
          disable_web_page_preview: true,
          ...Markup.inlineKeyboard([
            [Markup.button.url('💳 To‘lov qilish', paymentUrl)],
            [Markup.button.callback('🔍 To‘lovni tekshirish', `check_payment_${transactionId}`)],
            [Markup.button.callback('🔙 Orqaga', 'vip')],
          ]),
        },
      )
    }

    return ctx[ctx.message ? 'reply' : 'editMessageText'](
      `💎 *VIP obuna olish* \n\nTanlang:`,
      {
        parse_mode: 'MarkdownV2',
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('⏳ 24 soat - 6,000 so‘m', 'vip_24'),
            Markup.button.callback('⏳ 7 kun - 15,000 so‘m', 'vip_168'),
          ],
          [
            Markup.button.callback('⏳ 30 kun - 44,000 so‘m', 'vip_720'),
            Markup.button.callback('⏳ 10 yil - 119,000 so‘m', 'vip_87600'),
          ],
          [Markup.button.callback('🔙 Orqaga', 'cabinet')],
        ]),
      },
    )

  } catch (error) {
    console.error('[❌] VIP xatosi:', error)
    return ctx.reply('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
}
