/* eslint-disable no-redeclare */
const axios = require('axios')
const config = require('../config.json')
const fs = require('fs').promises

const User = require('../models/user')
const Deposit = require('../models/deposit')

const asyncFilter = async (arr, predicate) =>
  Promise.all(arr.map(predicate)).then((results) =>
    arr.filter((_v, index) => results[index])
  )

const tls = require('tls')
tls.DEFAULT_ECDH_CURVE = 'auto'

const loginFunction = async () => {
  const login = await axios({
    method: 'post',
    url: 'https://payme.uz/api/users.log_in',
    headers: {
      'Content-Type': 'text/plain',
      device: process.env.PAYME_DEVICE
    },
    data: {
      method: 'users.log_in',
      params: {
        login: process.env.PAYME_LOGIN,
        password: process.env.PAYME_PASS
      }
    }
  })

  config.paymeSession = login.headers['api-session']
  await fs.writeFile('config.json', JSON.stringify(config, null, '  '))
}

module.exports = async (bot, i18n) => {
  if (
    !config.paymeSession ||
    new Date(config.paymeSession.split('; ')[2]) < new Date()
  ) {
    await loginFunction()
  }
  console.log('checkPayme')

  const date = new Date()

  let getHistory = await axios({
    method: 'post',
    url: 'https://payme.uz/api/cheque.get_all',
    headers: {
      'api-session': config.paymeSession,
      device: process.env.PAYME_DEVICE,
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    },
    data: {
      method: 'cheque.get_all',
      params: {
        count: 10,
        offset: 0,
        to: {
          year: date.getFullYear(),
          month: date.getMonth(),
          day: date.getDate()
        }
      }
    }
  })

  if (getHistory.data.error && getHistory.data.error.code === -32504) {
    await loginFunction()

    getHistory = await axios({
      method: 'post',
      url: 'https://payme.uz/api/cheque.get_all',
      headers: {
        'api-session': config.paymeSession,
        device: process.env.PAYME_DEVICE,
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
      },
      data: {
        method: 'cheque.get_all',
        params: {
          count: 10,
          offset: 0,
          to: {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate()
          }
        }
      }
    })
  }

  if (getHistory.data.error) return console.error(getHistory.data)

  const cheques = getHistory.data.result.cheques.filter(
    (cheque) => cheque.card._id === process.env.PAYME_CARD_ID
  )

  const history = await Deposit.find({
    id: { $in: cheques.map((cheque) => cheque._id) }
  })

  const newCheques = cheques.filter(
    (cheque) => !history.find((element) => `${element.id}` === `${cheque._id}`)
  )
  const acceptedCheques = await asyncFilter(newCheques, async (cheque) => {
    const info = await Deposit.findOne({ amount: cheque.amount / 100 }).sort({
      _id: -1
    })
    return !!info
  })

  return Promise.all(
    acceptedCheques.map(async (cheque) => {
      const deposit = await Deposit.findOne({
        amount: cheque.amount / 100
      }).sort({
        _id: -1
      })
      if (!deposit) return console.error('cheque not found')

      const user = await User.findOne({ id: deposit.user })
      if (!user) return console.error('user not found')

      const date =
        user.premium && user.premium > new Date()
          ? new Date(user.premium)
          : new Date()
      date.setHours(date.getHours() + Number(deposit.per))

      await Promise.all([
        User.updateOne(
          { id: user.id },
          { $set: { vip: date }, $inc: { deposit: deposit.amount } }
        ),
        bot.telegram.sendMessage(
          user.id,
          i18n.t('uz', 'vip.success', {
            date: date.toLocaleString('ru-RU', {
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
            id: cheque._id
          }
        ),
        Promise.all(
          config.admins.map((admin) =>
            bot.telegram.sendMessage(
              admin,
              `<a href='tg://user?id=${user.id}'>${user.name}</a>${
                user.username ? ` @${user.username}` : ''
              } <code>${
                user.id
              }</code> приобрел подписку до ${date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })} за ${deposit.amount.format(0)} ${deposit.currency}`,
              { parse_mode: 'HTML' }
            )
          )
        )
      ])
    })
  )
}
