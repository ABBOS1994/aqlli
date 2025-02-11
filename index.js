// index.js

const path = require('path')
const fs = require('fs')
const { Telegraf } = require('telegraf')
const schedule = require('node-schedule')
const { randomInt } = require('crypto')
const { ChatGPTAPI } = require('chatgpt')
const tesseract = require('node-tesseract-ocr')
require('dotenv').config({ path: fs.existsSync('.env') ? path.resolve('.env') : undefined })

const formatNumber = (num, n = 0, x = 3) => {
  const re = new RegExp(`\d(?=(\d{${x}})+(\.|$))`, 'g')
  return num.toFixed(n).replace(re, '$& ')
}

require('./models')

const bot = new Telegraf(process.env.BOT_TOKEN, { handlerTimeout: 1000 });

['attachUser', 'logging', 'sysRefs', 'subscription'].forEach(mw => bot.use(require(`./middlewares/${mw}`)))

bot.catch(require('./actions/error'))

const i18n = require('./helpers/i18n')
bot.use(i18n.middleware())

bot.use(require('telegraf-ratelimit')({ window: 3000, limit: 3 }));

['chat_join_request', 'my_chat_member'].forEach(event => bot.on(event, require(`./actions/${event}`)));
['message', 'callback_query', 'inline_query'].forEach(event => bot.on(event, require(`./routers/${event}`)));

['cabinet', 'help', 'solve', 'partner'].forEach(cmd => bot.hears(i18n.match(`start.keys.${cmd}`), require(`./actions/${cmd}`)))

const api = new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY })

bot.on('text', async (ctx) => {
  await ctx.replyWithChatAction('typing')
  const response = await api.sendMessage(ctx.message.text)
  ctx.reply(response.text)
})

bot.on('photo', async (ctx) => {
  await ctx.replyWithChatAction('typing')
  const fileLink = await ctx.telegram.getFileLink(ctx.message.photo.pop().file_id)
  const text = await tesseract.recognize(fileLink, { lang: 'uzb' })
  const response = await api.sendMessage(text)
  ctx.reply(response.text)
})

const isWebhook = process.env.USE_WEBHOOK === 'true'
bot.launch(
  isWebhook
    ? {
      webhook: {
        domain: `https://${process.env.WEBHOOK_DOMAIN}`,
        hookPath: `/${process.env.WEBHOOK_PATH}/${process.env.BOT_TOKEN}`,
        port: process.env.WEBHOOK_PORT,
        extra: {
          max_connections: 100,
          allowed_updates: ['message', 'inline_query', 'callback_query', 'my_chat_member', 'chat_join_request']
        }
      }
    }
    : { polling: { allowedUpdates: ['message', 'inline_query', 'callback_query', 'my_chat_member', 'chat_join_request'] } }
);

(async () => {
  const webhookInfo = await bot.telegram.getWebhookInfo()
  console.log(`✅ Bot is running:\n${JSON.stringify(webhookInfo, null, 2)}`)
  console.log(await bot.telegram.getMe())
})()

require('./helpers/scheduler')(bot, i18n)