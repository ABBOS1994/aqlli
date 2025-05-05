// actions/checkAtmos.js
const config = require('../config.json')
const atmosAPI = require('../helpers/atmos')

const User = require('../models/user')
const Deposit = require('../models/deposit')

const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then((results) =>
    arr.filter((_v, index) => results[index])
  )

module.exports = async (bot, i18n) => {
  console.log('checkAtmos ishlayapti')

  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  try {
    const historyResponse = await atmosAPI.getPaymentsHistory(
      start.toISOString(),
      now.toISOString(),
      20,
      0
    )

    if (historyResponse.error) {
      console.error(`Atmos tarix xatolik: ${historyResponse.error.message}`)
      if (historyResponse.error.isTimeout) {
        console.error('Timeout yuz berdi. Keyingi urinishda tekshiriladi.')
      }
      return
    }

    const allPayments = historyResponse.payments || []

    const successfulPayments = allPayments.filter(
      (p) =>
        p.status === 'success' &&
        (p.merchant_id === atmosAPI.storeId ||
          `${p.merchant_id}` === `${atmosAPI.storeId}`)
    )

    if (!successfulPayments.length) {
      console.log("Muvaffaqiyatli to'lovlar topilmadi")
      return
    }

    console.log(`${successfulPayments.length} ta muvaffaqiyatli to'lov topildi`)

    const paymentIds = successfulPayments.map((p) => p.payment_id || p.id)

    const existing = await Deposit.find({
      paymentId: { $in: paymentIds }
    })

    const newPayments = successfulPayments.filter(
      (p) => !existing.find((d) => `${d.paymentId}` === `${p.payment_id || p.id}`)
    )

    if (!newPayments.length) {
      console.log("Yangi to'lovlar topilmadi")
      return
    }

    console.log(`${newPayments.length} ta yangi to'lov tekshirilmoqda`)

    const accepted = await asyncFilter(newPayments, async (p) => {
      if (p.order_id) {
        const d = await Deposit.findOne({
          orderId: p.order_id,
          status: 'pending'
        })
        if (d) return true
      }

      const d = await Deposit.findOne({
        amount: p.amount / 100,
        status: 'pending'
      }).sort({ _id: -1 })

      return !!d
    })

    if (!accepted.length) {
      console.log("Mos keluvchi to'lovlar topilmadi")
      return
    }

    console.log(`${accepted.length} ta to'lov qabul qilindi`)

    return Promise.all(
      accepted.map(async (p) => {
        let deposit =
          (p.order_id &&
            (await Deposit.findOne({
              orderId: p.order_id,
              status: 'pending'
            }))) ||
          (await Deposit.findOne({
            amount: p.amount / 100,
            status: 'pending'
          }).sort({ _id: -1 }))

        if (!deposit) {
          console.error('Mos deposit topilmadi:', p.payment_id || p.id)
          return
        }

        const user = await User.findOne({ id: deposit.user })
        if (!user) {
          console.error('Foydalanuvchi topilmadi:', deposit.user)
          return
        }

        const vipEnd =
          user.premium && user.premium > new Date()
            ? new Date(user.premium)
            : new Date()
        vipEnd.setHours(vipEnd.getHours() + Number(deposit.per))

        console.log(`${user.name || user.id} uchun to'lov qabul qilindi:`, {
          amount: deposit.amount,
          vipDate: vipEnd
        })

        await Promise.all([
          User.updateOne(
            { id: user.id },
            { $set: { vip: vipEnd }, $inc: { deposit: deposit.amount } }
          ),
          bot.telegram.sendMessage(
            user.id,
            i18n.t('uz', 'vip.success', {
              date: vipEnd.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })
            }),
            {
              disable_web_page_preview: true,
              parse_mode: 'HTML'
            }
          ),
          Deposit.updateOne(
            { _id: deposit._id },
            {
              paidAt: new Date(),
              status: 'paid',
              paymentId: p.payment_id || p.id,
              atmos_id: p.id
            }
          ),
          Promise.all(
            config.admins.map((admin) =>
              bot.telegram.sendMessage(
                admin,
                `<a href='tg://user?id=${user.id}'>${user.name || user.id}</a>${
                  user.username ? ` @${user.username}` : ''
                } <code>${user.id}</code> VIP obunani ${vipEnd.toLocaleString(
                  'ru-RU',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric'
                  }
                )} gacha sotib oldi. To'lov: ${deposit.amount.toLocaleString(
                  'ru-RU'
                )} ${deposit.currency}`,
                { parse_mode: 'HTML' }
              )
            )
          )
        ])
      })
    )
  } catch (err) {
    console.error('Atmos tekshirishda xatolik:', err.message)
    return
  }
}
