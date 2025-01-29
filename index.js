const path = require('path')
const I18n = require('telegraf-i18n')
const { Telegraf } = require('telegraf')
const rateLimit = require('telegraf-ratelimit')
const updateStat = require('./helpers/updateStat')
const botStat = require('./helpers/botStat')
const schedule = require('node-schedule')
const Mail = require('./models/mail')
const lauchWorker = require('./actions/admin/mail/lauchWorker')
const checkVip = require('./actions/checkVip')
const { randomInt } = require('crypto')

require('./models')
require('dotenv').config({ path: path.resolve('.env') })

Number.prototype.format = function(n, x) {
  const re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')'
  return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$& ')
}

const allowedUpdates = [
  'message',
  'inline_query',
  'callback_query',
  'my_chat_member',
  'chat_join_request',
]

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 1 })

bot.catch(require('./actions/error'))

const i18n = new I18n({
  directory: 'locales',
  defaultLanguage: 'uz',
  defaultLanguageOnMissing: true,
})

bot.use(i18n.middleware())

const limitConfig = {
  window: 3000,
  limit: 3,
}

bot.use(rateLimit(limitConfig))

bot.on('chat_join_request', require('./actions/chatJoin'))
bot.on('my_chat_member', require('./actions/myChatMember'))

bot.use(require('./middlewares/attachUser'))
bot.use(require('./middlewares/logging'))
bot.on('text', require('./middlewares/sysRefs'))
bot.on('message', require('./middlewares/subscription'))

bot.hears(I18n.match('start.keys.cabinet'), require('./actions/cabinet'))
bot.hears(I18n.match('start.keys.help'), require('./actions/help'))
bot.hears(I18n.match('start.keys.solve'), require('./actions/solve'))
bot.hears(I18n.match('start.keys.partner'), require('./actions/partner'))

bot.on('message', require('./routers/message'))
bot.on('callback_query', require('./routers/callbackQuery'))
bot.on('inline_query', require('./routers/inlineQuery'))

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

bot.telegram.getWebhookInfo().then((webhookInfo) => {
  console.log(`✅ Bot is up and running\n${JSON.stringify(webhookInfo, null, ' ')}`)
})
bot.telegram.getMe().then((info) => console.log(info))

;(async () => {
  const result = await Mail.findOne({ status: 'doing' })
  if (result) lauchWorker(result._id)
})()

schedule.scheduleJob('* * * * *', async () => {
  const result = await Mail.findOne({
    status: 'notStarted',
    startDate: { $exists: true, $lte: new Date() },
  })
  if (result) lauchWorker(result._id)

  await checkVip(bot, i18n)
})

schedule.scheduleJob(`0 ${randomInt(2, 6)} * * *`, async () => {
  await updateStat(bot)
  await botStat()
})
