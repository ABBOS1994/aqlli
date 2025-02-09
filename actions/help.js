const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  try {
    await ctx.replyWithHTML(
      'Yordam bo\'limi. Quyidagi tugma orqali qo\'shimcha ma\'lumot olishingiz mumkin:',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.button.url('Qo\'shimcha ma\'lumot', 'https://example.com'),
        ]),
        disable_web_page_preview: true,
      },
    )
  } catch (error) {
    console.error(`❌ Xatolik: ${error.message}`)
  }
}
