const mainKeyboard = require('../helpers/mainKeyboard')

module.exports = async (ctx) => {
  if (!ctx.user) {
    console.log('⚠️ Xatolik: ctx.user aniqlanmadi!')
    return ctx.reply('Xatolik yuz berdi! Iltimos, botni qayta ishga tushiring.')
  }

  if (!ctx.chat || !ctx.chat.id) {
    console.log('❌ Xatolik: Chat ID topilmadi!')
    return
  }

  return ctx.replyWithHTML(
    `👋 Salom ${ctx.user.name || 'Foydalanuvchi'}! Men - Misol Ai sun'iy intellektman, misollarni yechish uchun yaratilinganman.
🤖 Man kimlar uchun mo'ljallanganman: maktabda yoki institutda o'qidiganlar uchun, chunki har qanday masalada yordam bera olaman.`,
    {
      reply_markup: mainKeyboard(ctx),
      disable_web_page_preview: true,
      parse_mode: 'HTML',
    },
  )
}
