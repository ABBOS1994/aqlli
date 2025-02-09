/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

// Raqamlarni formatlash uchun funksiya
Number.prototype.format = function(n, x) {
  const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')'
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$& ')
}

// MongoDB ulanishi
require('./models')

const { Telegraf } = require('telegraf')
const allowedUpdates = [
  'message',
  'inline_query',
  'callback_query',
  'my_chat_member',
  'chat_join_request',
]

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.catch(require('./actions/error'))

// ✅ Cheklovlar (spamdan himoya qilish)
const rateLimit = require('telegraf-ratelimit')
const limitConfig = {
  window: 3000,
  limit: 3,
}
bot.use(rateLimit(limitConfig))

// ✅ Yangi foydalanuvchilarni qabul qilish
bot.on('chat_join_request', require('./actions/chatJoin'))
bot.on('my_chat_member', require('./actions/myChatMember'))

// ✅ Foydalanuvchilarni tekshirish
bot.use(require('./middlewares/attachUser'))

// ✅ Botdagi hodisalarni logga yozish
bot.use(require('./middlewares/logging'))

// ✅ Referal tizimini boshqarish
bot.on('text', require('./middlewares/sysRefs'))

// ✅ Majburiy obuna (subscription) tekshiruvi
bot.on('message', require('./middlewares/subscription'))

// ✅ Asosiy buyruqlar
bot.hears('🗄️ Shaxsiy kabinet', require('./actions/cabinet'))
bot.hears('ℹ️ Yordam', require('./actions/help'))
bot.hears('❓ Muammolarni hal qilish', require('./actions/solve'))
bot.hears('🤝 Hamkorlik', require('./actions/partner'))

// ✅ Routerlar orqali xabarlarni boshqarish
bot.on('message', require('./routers/message'))
bot.on('callback_query', require('./routers/callbackQuery'))
bot.on('inline_query', require('./routers/inlineQuery'))

// ✅ Botni ishga tushirish (Polling yoki Webhook)
bot.launch(
  process.env.USE_WEBHOOK === 'true'
    ? {
      webhook: {
        domain: `https://${process.env.WEBHOOK_DOMAIN}`,
        hookPath: `/${process.env.WEBHOOK_PATH}/${process.env.BOT_TOKEN}`,
        port: process.env.WEBHOOK_PORT,
        extra: {
          max_connections: 100,
          allowed_updates: allowedUpdates,
        },
      },
    }
    : {
      polling: {
        allowedUpdates,
      },
    },
)

// ✅ Bot ishga tushgani haqida ma’lumot
bot.telegram.getWebhookInfo().then((webhookInfo) => {
  console.log(
    `✅ Bot ishga tushdi!\n${JSON.stringify(webhookInfo, null, ' ')}`,
  )
})
bot.telegram.getMe().then((info) => console.log(info))

// ✅ Statistika va to‘lov monitoringi
const updateStat = require('./helpers/updateStat')
const botStat = require('./helpers/botStat')

const schedule = require('node-schedule')

const Mail = require('./models/mail')

const lauchWorker = require('./actions/admin/mail/lauchWorker')
const checkVip = require('./actions/checkVip')
// const checkAtmos = require('./actions/checkAtmos') // 🔄 Atmos to‘lov tekshiruvi

// ✅ Ishlayotgan xabarlarni tekshirish va qayta ishga tushirish
;(async () => {
  const result = await Mail.findOne({ status: 'doing' })
  if (result) lauchWorker(result._id)
})()

// ✅ Har daqiqada ishga tushadigan rejali vazifalar (cron jobs)
schedule.scheduleJob('* * * * *', async () => {
  const result = await Mail.findOne({
    status: 'notStarted',
    startDate: { $exists: true, $lte: new Date() },
  })
  if (result) lauchWorker(result._id)

  await checkVip(bot)
  // await checkAtmos(bot) // 🔄 Atmos orqali to‘lovni tekshirish
})

// ✅ Statistika yangilash (har kuni bir marta)
const { randomInt } = require('crypto')

schedule.scheduleJob(`0 ${randomInt(2, 6)} * * *`, async () => {
  await updateStat(bot)
  await botStat()
})

module.exports = bot
