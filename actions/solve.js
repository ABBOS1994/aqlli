// 📂 //actions/solve.js

const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    const messageText = `
      ❓ *Muammoni hal qilish*
      ───────────────────
      🔍 Agar sizda biror muammo bo‘lsa yoki qo‘shimcha ma’lumot kerak bo‘lsa, quyidagi havola orqali yordam olishingiz mumkin.
    `

    return ctx.editMessageText(messageText, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard([
        [Markup.button.url('📩 Yordam olish', 'https://t.me/support')],
        [Markup.button.callback('🔙 Orqaga', 'cabinet')],
      ]),
    })

  } catch (error) {
    console.error('[❌] Solve xatosi:', error)
    return ctx.reply('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
}
