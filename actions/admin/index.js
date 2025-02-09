const { Markup } = require('telegraf')
const config = require('../../config.json')

module.exports = async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return

  const text =
    '<b>🔧 Admin Paneli</b>\n\n<tg-spoiler><i>Developed by @NMI_FUN</i></tg-spoiler>'

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.callbackButton('📊 Statistika', 'admin_stat'),
      Markup.callbackButton('👑 Adminlar', 'admin_addAdmin'),
    ],
    [
      Markup.callbackButton('📩 Xabar yuborish', 'admin_mail'),
      Markup.callbackButton('👁 Ko‘rishlar', 'admin_view'),
    ],
    [
      Markup.callbackButton('🔗 Referal tizimi', 'admin_sysRef'),
      Markup.callbackButton('👥 Foydalanuvchilar', 'admin_listUsers'),
    ],
    [
      Markup.callbackButton('📈 Bot Statistika', 'admin_botStat'),
      Markup.callbackButton('🚫 Foydalanuvchini bloklash', 'admin_ban'),
    ],
    [
      Markup.callbackButton('📢 Majburiy obuna', 'admin_addSubscription'),
      Markup.callbackButton('🤖 Bot uchun obuna', 'admin_addBotSubscription'),
    ],
    [
      Markup.callbackButton('💎 VIP obuna', 'admin_addVip'),
      Markup.callbackButton('💰 Pul yechish', 'admin_addWithdraw'),
    ],
    [Markup.callbackButton('✅ So‘rovlarni qabul qilish', 'admin_addJoin')],
  ]).extra({ parse_mode: 'HTML' })

  ctx.user.state = null

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    if (ctx.callbackQuery.message.text) {
      return ctx.editMessageText(text, keyboard)
    } else await ctx.deleteMessage()
  }

  return ctx.replyWithHTML(text, keyboard)
}
