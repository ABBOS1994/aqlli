const { Markup } = require('telegraf')
const config = require('../../config.json')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) await ctx.answerCbQuery()

  // Bot stat konfiguratsiyasi mavjudligini tekshiramiz
  if (!config.botStat) {
    config.botStat = {
      send: false,
      alive: false,
      botMan: false,
    }
  }

  // Agar foydalanuvchi yangi kalit yuborgan bo‘lsa
  if (ctx.message?.text) {
    ctx.user.state = null
    config.botStat.key = ctx.message.text
    await fs.writeFile('config.json', JSON.stringify(config, null, 2))
  }

  // `alive`, `send`, yoki `botMan` sozlamalarini almashtirish
  if (['alive', 'send', 'botMan'].includes(ctx.state[0])) {
    config.botStat[ctx.state[0]] = !config.botStat[ctx.state[0]]
    await fs.writeFile('config.json', JSON.stringify(config, null, 2))
  }

  // Kalit so‘z o‘zgartirish uchun holatga o‘tish
  else if (ctx.state[0] === 'token') {
    ctx.user.state = 'admin_botStat'

    return ctx.editMessageText(
      '🔑 Yangi API kalitni kiriting:',
      Markup.inlineKeyboard([
        [Markup.callbackButton('⬅️ Orqaga', 'admin_botStat')],
      ]).extra({ parse_mode: 'HTML' }),
    )
  }

  // Bot Stat paneli
  return ctx[ctx.message ? 'replyWithHTML' : 'editMessageText'](
    `⚙️ <b>Bot Statistika Sozlamalari</b>

🔑 <b>Joriy API kalit:</b> ${
      config.botStat.key || 'Mavjud emas'
    } (<a href='https://botstat.io/dashboard/api'>API olish</a>)`,
    Markup.inlineKeyboard([
      [
        Markup.callbackButton(
          `📊 BotStat ${config.botStat.send ? '✅' : '❌'}`,
          'admin_botStat_send',
        ),
        Markup.callbackButton('🔑 Kalitni o‘zgartirish', 'admin_botStat_token'),
      ],
      [
        Markup.callbackButton(
          `🤖 BotMan ${config.botStat.botMan ? '✅' : '❌'}`,
          'admin_botStat_botMan',
        ),
      ],
      [
        Markup.callbackButton(
          `🟢 Faol ${config.botStat.alive ? '✅' : '❌'}`,
          'admin_botStat_alive',
        ),
      ],
      [Markup.callbackButton('⬅️ Orqaga', 'admin_back')],
    ]).extra({ parse_mode: 'HTML' }),
  )
}
