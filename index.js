require('dotenv').config()
const { Telegraf } = require('telegraf')
const I18n = require('telegraf-i18n')
const rateLimit = require('telegraf-ratelimit')
const schedule = require('node-schedule')
const { randomInt } = require('crypto')

require('./models')

// 🛠 Number format extension
Number.prototype.format = function (n = 0, x = 3) {
  return this.toFixed(n).replace(
    new RegExp(`\d(?=(\d{${x}})+(?:\.|$))`, 'g'),
    '$& '
  )
}

// 📌 Bot konfiguratsiyasi
const bot = new Telegraf('7791670870:AAHqzagIxP1NfFpdNaFS_xVrxRIzgy2vEWQ')
bot.catch(require('./actions/error'))

// 🌍 Til sozlamalari
const i18n = new I18n({
  directory: 'locales',
  defaultLanguage: 'uz',
  defaultLanguageOnMissing: true
})
bot.use(i18n.middleware())

// 🚦 Rate limiter
bot.use(rateLimit({ window: 3000, limit: 3 }))

// 📩 Middleware lar
bot.use(require('./middlewares/attachUser'))
bot.use(require('./middlewares/logging'))
bot.on('text', require('./middlewares/sysRefs'))
bot.on('message', require('./middlewares/subscription'))

// 🎯 Inline va Callback query lar
bot.on('callback_query', require('./routers/callbackQuery'))
bot.on('inline_query', require('./routers/inlineQuery'))
bot.on('message', require('./routers/message'))

// 🎮 Tugmalar va buyruqlar
const commands = {
  'start.keys.cabinet': './actions/cabinet',
  'start.keys.help': './actions/help',
  'start.keys.solve': './actions/solve',
  'start.keys.partner': './actions/partner'
}
Object.entries(commands).forEach(([key, path]) => {
  bot.hears(I18n.match(key), require(path))
})

// 📲 Botni ishga tushirish
;(async () => {
  try {
    await bot.launch(
      process.env.USE_WEBHOOK === 'true'
        ? {
            webhook: {
              domain: `https://${process.env.WEBHOOK_DOMAIN}`,
              hookPath: `/${process.env.WEBHOOK_PATH}/${'7791670870:AAHqzagIxP1NfFpdNaFS_xVrxRIzgy2vEWQ'}`,
              port: process.env.WEBHOOK_PORT,
              extra: {
                max_connections: 100,
                allowed_updates: [
                  'message',
                  'inline_query',
                  'callback_query',
                  'my_chat_member',
                  'chat_join_request'
                ]
              }
            }
          }
        : {
            polling: {
              allowedUpdates: [
                'message',
                'inline_query',
                'callback_query',
                'my_chat_member',
                'chat_join_request'
              ]
            }
          }
    )
    console.log(`${(await bot.telegram.getMe()).username} Bot ishga tushdi! ✅`)
  } catch (error) {
    console.error('❌ Botni ishga tushirishda xatolik:', error)
  }
})()

// 📊 Statistikani yangilash
const updateStat = require('./helpers/updateStat')
const botStat = require('./helpers/botStat')
schedule.scheduleJob(`0 ${randomInt(2, 6)} * * *`, async () => {
  try {
    await updateStat(bot)
    await botStat()
  } catch (err) {
    console.error('❌ Statistika yangilanmadi:', err)
  }
})

// 📬 Email xabarnomalari
const Mail = require('./models/mail')
const lauchWorker = require('./actions/admin/mail/lauchWorker')
const checkVip = require('./actions/checkVip')
;(async () => {
  try {
    const result = await Mail.findOne({ status: 'doing' })
    if (result) lauchWorker(result._id)
  } catch (err) {
    console.error('❌ Mailni tekshirishda xatolik:', err)
  }
})()

// 📅 Yangi xabarlar monitoringi
schedule.scheduleJob('* * * * *', async () => {
  try {
    const result = await Mail.findOne({
      status: 'notStarted',
      startDate: { $exists: true, $lte: new Date() }
    })
    if (result) lauchWorker(result._id)
    await checkVip(bot, i18n)
  } catch (err) {
    console.error('❌ Xatolik yuz berdi:', err)
  }
})
