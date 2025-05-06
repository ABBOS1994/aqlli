const config = require('../config.json')
const atmosAPI = require('../helpers/atmos')
const User = require('../models/user')
const Deposit = require('../models/deposit')

const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then((results) =>
    arr.filter((_v, index) => results[index])
  )

module.exports = async (bot, i18n) => {
  console.log('checkPayme ishlayapti')

  const date = new Date()
  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)

  try {
    console.log("Atmos API orqali to'lovlar tarixini olish")
    const historyResponse = await atmosAPI.getPaymentsHistory(
      startDate.toISOString(),
      date.toISOString(),
      20,
      0
    )

    if (historyResponse && historyResponse.payments && !historyResponse.error) {
      return processPayments(historyResponse, bot, i18n, date)
    } else {
      console.error("To'lovlar tarixini olishda xatolik:", historyResponse)
    }
  } catch (error) {
    console.error("Atmos API xatolik:", error.message)
  }
}

async function processPayments(historyResponse, bot, i18n, date) {
  try {
    const payments = historyResponse.payments.filter(
      (payment) =>
        payment.status === 'success' &&
        payment.merchant_id === (process.env.ATMOS_MERCHANT_ID || '1961')
    )

    if (!payments.length) {
      console.log("Muvaffaqiyatli to'lovlar mavjud emas")
      return
    }

    console.log(`${payments.length} ta muvaffaqiyatli to'lov topildi`)

    const history = await Deposit.find({
      id: { $in: payments.map((payment) => payment.id) }
    })

    const newPayments = payments.filter(
      (payment) =>
        !history.find((element) => `${element.id}` === `${payment.id}`)
    )

    if (!newPayments.length) {
      console.log("Yangi to'lovlar topilmadi")
      return
    }

    console.log(`${newPayments.length} ta yangi to'lov tekshirilmoqda`)

    const acceptedPayments = await asyncFilter(newPayments, async (payment) => {
      if (payment.order_id) {
        const orderDeposit = await Deposit.findOne({
          orderId: payment.order_id,
          status: 'pending'
        })
        if (orderDeposit) return true
      }

      const amountDeposit = await Deposit.findOne({
        amount: payment.amount / 100,
        status: 'pending'
      }).sort({ _id: -1 })

      return !!amountDeposit
    })

    if (!acceptedPayments.length) {
      console.log("Qabul qilingan to'lovlar topilmadi")
      return
    }

    console.log(`${acceptedPayments.length} ta to'lov qabul qilindi`)

    return Promise.all(
      acceptedPayments.map(async (payment) => {
        let deposit = await Deposit.findOne({
          orderId: payment.order_id,
          status: 'pending'
        })

        if (!deposit) {
          deposit = await Deposit.findOne({
            amount: payment.amount / 100,
            status: 'pending'
          }).sort({ _id: -1 })
        }

        if (!deposit) {
          return console.error("To'lov ma'lumotlari topilmadi:", payment.id)
        }

        const user = await User.findOne({ id: deposit.user })
        if (!user) {
          return console.error('Foydalanuvchi topilmadi:', deposit.user)
        }

        const paymentDate =
          user.premium && user.premium > new Date()
            ? new Date(user.premium)
            : new Date()
        paymentDate.setHours(paymentDate.getHours() + Number(deposit.per))

        console.log(
          `${user.name || user.id} foydalanuvchisi uchun to'lov qabul qilindi:`,
          {
            amount: deposit.amount,
            vipDate: paymentDate
          }
        )

        await Promise.all([
          User.updateOne(
            { id: user.id },
            { $set: { vip: paymentDate }, $inc: { deposit: deposit.amount } }
          ),
          bot.telegram.sendMessage(
            user.id,
            i18n.t('uz', 'vip.success', {
              date: paymentDate.toLocaleString('ru-RU', {
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
              id: payment.id,
              paymentId: payment.payment_id
            }
          ),
          Promise.all(
            config.admins.map((admin) =>
              bot.telegram.sendMessage(
                admin,
                `<a href='tg://user?id=${user.id}'>${user.name || user.id}</a>${
                  user.username ? ` @${user.username}` : ''
                } <code>${
                  user.id
                }</code> VIP obunani ${paymentDate.toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })} gacha sotib oldi. To'lov: ${deposit.amount.format(0)} ${
                  deposit.currency
                }`,
                { parse_mode: 'HTML' }
              )
            )
          )
        ])
      })
    )
  } catch (error) {
    console.error("Atmos to'lovlarni qayta ishlashda xatolik:", error.message)
    return
  }
}
