const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    const isPremium = ctx.user.vip && ctx.user.vip > new Date()

    const registeredDate = new Date(ctx.user.id).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    })

    const vipStatus = isPremium
      ? new Date(ctx.user.vip).toLocaleString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      })
      : 'VIP obuna mavjud emas'

    const messageText = `
      🏠 *Sizning kabinetingiz*:
      ───────────────────
      🆔 *ID:* \`${ctx.user.id}\`
      📅 *Ro‘yxatdan o‘tgan sana:* ${registeredDate}
      💎 *VIP holati:* ${vipStatus}
      ───────────────────
    `

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('💎 VIP olish', 'vip')],
    ])

    return ctx[ctx.message ? 'replyWithMarkdownV2' : 'editMessageText'](messageText, {
      ...keyboard,
      disable_web_page_preview: true,
      parse_mode: 'MarkdownV2',
    })
  } catch (error) {
    console.error('[❌] Cabinet xatosi:', error)
    return ctx.reply('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
}
