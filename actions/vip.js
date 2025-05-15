// actions/vip.js
const { NODE_ENV, ATMOS_INTEGRATION } = process.env
const crypto = require('crypto')
const {
  createTransaction,
  confirmPayment,
  preApplyPayment
} = require('../helpers/atmosPayment')
const { removeCard } = require('../helpers/atmosCard')
const Deposit = require('../models/deposit')
const User = require('../models/user')

const prices = {
  720: 39000,
  2160: 99000,
  8760: 390000
}

const FRONTEND_URL = ATMOS_INTEGRATION
const isDev = NODE_ENV === 'development'

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()
  ctx.session = ctx.session || {}

  const user = await User.findOne({ id: ctx.user.id })

  // ❌ Kartani o‘chirish
  if (ctx.callbackQuery?.data === 'vip_remove_card') {
    await removeCard({
      id: user.card.card_id,
      token: user.card.card_token
    })
    await User.updateOne({ id: ctx.user.id }, { $unset: { card: '' } })
    return ctx.editMessageText('💳 Karta muvaffaqiyatli o‘chirildi.', {
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Ortga', callback_data: 'vip' }]]
      }
    })
  }

  // ♻️ Kartani o‘zgartirish (WebApp havolasi)
  if (ctx.callbackQuery?.data === 'vip_change_card') {
    const transaction_id = 'change_card'
    const url = `${FRONTEND_URL}/?chat_id=${ctx.from.id}&transaction_id=${transaction_id}`
    if (isDev) {
      console.log('🧪 Karta o‘zgartirish havolasi (dev):', url)
      return ctx.reply(`🧪 Havola:\n<code>${url}</code>`, {
        parse_mode: 'HTML'
      })
    }

    return ctx.reply('💳 Kartani o‘zgartirish uchun:', {
      reply_markup: {
        inline_keyboard: [[{ text: '♻️ Karta o‘zgartirish', web_app: { url } }]]
      }
    })
  }

  // 💰 To‘lov jarayoni
  if (ctx.state[0]) {
    const duration = ctx.state[0]
    const price = prices[duration]
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
      const transaction_id = transactionData?.transaction_id

      if (!user.card?.card_token) {
        const url = `${FRONTEND_URL}/?chat_id=${ctx.from.id}&transaction_id=${transaction_id}`
        if (isDev) {
          console.log('🧪 Karta biriktirish havolasi (dev):', url)
          return ctx.reply(`🧪 Havola:\n<code>${url}</code>`, {
            parse_mode: 'HTML'
          })
        }

        return ctx.reply('💳 Karta topilmadi. Biriktiring:', {
          reply_markup: {
            inline_keyboard: [
              [{ text: '➕ Karta biriktirish', web_app: { url } }]
            ]
          }
        })
      }

      const preApply = await preApplyPayment({
        transaction_id,
        card_token: user.card.card_token
      })

      console.log('📤 Pre-apply:', preApply)

      if (!preApply || preApply.result?.code !== 'OK') {
        const msg = preApply?.result?.description || 'Pre-apply xatoligi'
        return ctx.reply(`❌ Pre-apply xato:\n${msg}`)
      }

      const apply = await confirmPayment({ transaction_id })

      console.log('✅ Apply response:', apply)

      if (!apply || apply.result?.code !== 'OK') {
        const msg = apply?.result?.description || 'Tasdiqlashda xato'
        return ctx.reply(`❌ Tasdiqlash xatoligi:\n${msg}`)
      }

      await Deposit.updateOne(
        { ext_id: requestId },
        { $set: { status: 'paid', appliedAt: new Date() } }
      )

      const now = new Date()
      const newVipDate = user.vip && user.vip > now ? user.vip : now
      user.vip = new Date(newVipDate.getTime() + duration * 60 * 60 * 1000)
      await user.save()

      return ctx.reply(
        `✅ To‘lov amalga oshdi!\n💳 Muddati: ${
          duration / 720
        } oy\n💰 Summasi: ${realAmount.toLocaleString()} so‘m`
      )
    } catch (err) {
      console.error('❌ Umumiy xatolik:', err.response?.data || err.message)
      return ctx.reply('❌ Tranzaksiya yaratishda xatolik yuz berdi.')
    }
  }

  // 📋 VIP menyu + karta va tel
  const cardLast = user.card?.pan?.slice(-4)
  const phone = user.card?.phone
  const cardInfo = cardLast ? `💳 Karta: <b>....${cardLast}</b>\n` : ''
  const phoneInfo = phone ? `📱 Tel: <b>${phone}</b>\n` : ''
  const baseText = ctx.i18n.t('vip.text')
  let finalText = `${cardInfo}${phoneInfo}${baseText}`

  const keyboard = [
    [
      { text: '🕐 1 oy – 39 000 so‘m', callback_data: 'vip_720' },
      { text: '📅 3 oy – 99 000 so‘m', callback_data: 'vip_2160' }
    ],
    [{ text: '📆 12 oy – 390 000 so‘m', callback_data: 'vip_8760' }]
  ]

  const chatId = ctx.from?.id || ctx.chat?.id

  if (user.card?.card_token) {
    keyboard.push([
      { text: '♻️ Kartani o‘zgartirish', callback_data: 'vip_change_card' },
      { text: '🗑 Kartani o‘chirish', callback_data: 'vip_remove_card' }
    ])
  } else {
    const transaction_id = 'init_card'
    const url = `${FRONTEND_URL}/?chat_id=${chatId}&transaction_id=${transaction_id}`
    if (isDev) {
      console.log('🧪 Karta qo‘shish havolasi (dev):', url)
      finalText
    } else {
      keyboard.push([{ text: '➕ Karta biriktirish', web_app: { url } }])
    }
  }

  keyboard.push([{ text: ctx.i18n.t('back'), callback_data: 'cabinet' }])

  return ctx[ctx.message ? 'reply' : 'editMessageText'](finalText, {
    reply_markup: { inline_keyboard: keyboard },
    parse_mode: 'HTML'
  })
}
