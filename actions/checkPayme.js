//actions/checkPayme.js
/* eslint-disable no-redeclare */
const axios = require('axios')
const config = require('../config.json')
const atmosAPI = require('../helpers/atmos')
const https = require('https')

const User = require('../models/user')
const Deposit = require('../models/deposit')

const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then((results) =>
    arr.filter((_v, index) => results[index])
  )

const tls = require('tls')
tls.DEFAULT_ECDH_CURVE = 'auto'

// Atmos API uchun token olish - qayta urunishlar va turli IP manzillar bilan
const getAtmosToken = async (retryCount = 0) => {
  // Turli serverlar ro'yxati
  const servers = [
    { url: 'https://api.atmos.uz', description: 'asosiy server' },
    { url: 'https://185.63.191.17', description: 'muqobil IP 1' },
    { url: 'https://185.93.242.242', description: 'muqobil IP 2' }
  ]

  // Qayta urinishlar soni va joriy server
  const maxRetries = 2
  const serverIndex = Math.min(retryCount, servers.length - 1)
  const currentServer = servers[serverIndex]

  try {
    console.log(
      `Atmos token olish (urinish: ${retryCount + 1}/${maxRetries + 1}, ${
        currentServer.description
      } orqali)`
    )

    // Axios HTTP so'rovi
    const response = await axios({
      method: 'post',
      url: `${currentServer.url}/api/auth/token`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AtmosNodeClient/1.0'
      },
      data: {
        username: process.env.ATMOS_USERNAME,
        password: process.env.ATMOS_PASSWORD
      },
      timeout: 15000, // 15 sekund
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: true,
        timeout: 15000,
        family: 4 // IPv4 ni majburiy ishlatish
      })
    })

    if (response.data && response.data.token) {
      console.log(
        `Atmos token muvaffaqiyatli olindi (${currentServer.description} orqali)`
      )
      return response.data.token
    } else {
      console.error(
        "Atmos token olishda xatolik (javob ma'lumotlari):",
        response.data
      )

      // Qayta urinish
      if (retryCount < maxRetries) {
        console.log(`Atmos token olish qayta urinilmoqda...`)
        // Qayta urinishdan oldin kutish
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return getAtmosToken(retryCount + 1)
      }

      return null
    }
  } catch (error) {
    const isConnectionError =
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNRESET'

    console.error(
      `Atmos auth xatolik (${currentServer.description}): ${error.message}, kod: ${error.code}`
    )

    // Agar ulanish bilan bog'liq xatolik bo'lsa va qayta urinishlar tugamagan bo'lsa
    if (isConnectionError && retryCount < maxRetries) {
      console.log(
        `Atmos token olish qayta urinilmoqda (${
          retryCount + 1
        }/${maxRetries})...`
      )
      // Qayta urinishdan oldin kutish
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return getAtmosToken(retryCount + 1)
    }

    return null
  }
}

module.exports = async (bot, i18n) => {
  console.log('checkPayme ishlayapti')

  // Ikki usulni sinab ko'rish
  const date = new Date()
  const startDate = new Date(date)
  startDate.setHours(0, 0, 0, 0)

  // 1-usul: OAuth bilan atmosAPI orqali
  try {
    console.log("1-usul: OAuth bilan atmosAPI orqali to'lovlar tarixini olish")
    const historyResponse = await atmosAPI.getPaymentsHistory(
      startDate.toISOString(),
      date.toISOString(),
      20,
      0
    )

    // Agar muvaffaqiyatli bo'lsa
    if (historyResponse && historyResponse.payments && !historyResponse.error) {
      return processPayments(historyResponse, bot, i18n, date)
    } else {
      console.log("1-usul muvaffaqiyatsiz tugadi, 2-usulni sinab ko'rish")
    }
  } catch (error) {
    console.error('1-usul xatolik:', error.message)
  }

  // 2-usul: Token bilan to'g'ridan-to'g'ri API so'rov
  try {
    console.log("2-usul: Token bilan to'g'ridan-to'g'ri API so'rov")
    // Atmosdan token olish
    const token = await getAtmosToken()
    if (!token) {
      console.error('Atmos token olinmadi')
      return
    }

    // Atmos to'lovlar tarixini olish
    const getHistory = await axios({
      method: 'get',
      url: 'https://api.atmos.uz/api/payments/history',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        from: startDate.toISOString(),
        to: date.toISOString(),
        limit: 20,
        offset: 0
      },
      timeout: 15000, // 15 sekund
      httpsAgent: new https.Agent({
        keepAlive: true,
        timeout: 15000,
        family: 4 // IPv4 ni majburiy ishlatish
      })
    })

    if (!getHistory.data || !getHistory.data.payments) {
      console.error(
        "Atmos to'lovlar tarixini olishda xatolik:",
        getHistory.data
      )
      return
    }

    return processPayments(
      { payments: getHistory.data.payments },
      bot,
      i18n,
      date
    )
  } catch (error) {
    console.error(
      "2-usul orqali Atmos to'lovlar tarixini olishda xatolik:",
      error.message
    )
    return
  }
}

// To'lovlarni qayta ishlash uchun alohida funksiya
async function processPayments(historyResponse, bot, i18n, date) {
  try {
    // Faqat muvaffaqiyatli to'lovlarni filtrlash
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

    // Bazada mavjud to'lovlarni tekshirish
    const history = await Deposit.find({
      id: { $in: payments.map((payment) => payment.id) }
    })

    // Yangi to'lovlarni filtrlash
    const newPayments = payments.filter(
      (payment) =>
        !history.find((element) => `${element.id}` === `${payment.id}`)
    )

    if (!newPayments.length) {
      console.log("Yangi to'lovlar topilmadi")
      return
    }

    console.log(`${newPayments.length} ta yangi to'lov tekshirilmoqda`)

    // To'lovlarni tekshirib, muvofiqlashgan to'lovlarni topish
    const acceptedPayments = await asyncFilter(newPayments, async (payment) => {
      // Avval orderId bo'yicha tekshirish
      if (payment.order_id) {
        const orderDeposit = await Deposit.findOne({
          orderId: payment.order_id,
          status: 'pending'
        })
        if (orderDeposit) return true
      }

      // Keyin summa bo'yicha tekshirish
      const amountDeposit = await Deposit.findOne({
        amount: payment.amount / 100,
        status: 'pending'
      }).sort({
        _id: -1
      })
      return !!amountDeposit
    })

    if (!acceptedPayments.length) {
      console.log("Qabul qilingan to'lovlar topilmadi")
      return
    }

    console.log(`${acceptedPayments.length} ta to'lov qabul qilindi`)

    // Har bir to'lov uchun kerakli amallarni bajarish
    return Promise.all(
      acceptedPayments.map(async (payment) => {
        // Avval orderId bo'yicha izlash
        let deposit
        if (payment.order_id) {
          deposit = await Deposit.findOne({
            orderId: payment.order_id,
            status: 'pending'
          })
        }

        // Agar orderId bo'yicha topilmasa, summa bo'yicha izlash
        if (!deposit) {
          deposit = await Deposit.findOne({
            amount: payment.amount / 100,
            status: 'pending'
          }).sort({
            _id: -1
          })
        }

        if (!deposit) {
          return console.error("To'lov ma'lumotlari topilmadi:", payment.id)
        }

        const user = await User.findOne({ id: deposit.user })
        if (!user) {
          return console.error('Foydalanuvchi topilmadi:', deposit.user)
        }

        // VIP muddatini hisoblash
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
          // Foydalanuvchi VIP statusini yangilash
          User.updateOne(
            { id: user.id },
            { $set: { vip: paymentDate }, $inc: { deposit: deposit.amount } }
          ),

          // Foydalanuvchiga xabar yuborish
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

          // Deposit statusini yangilash
          Deposit.updateOne(
            { _id: deposit._id },
            {
              paidAt: new Date(),
              status: 'paid',
              id: payment.id,
              paymentId: payment.payment_id
            }
          ),

          // Adminlarga xabar yuborish
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
