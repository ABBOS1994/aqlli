const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addAdmin'

    return ctx.editMessageText(
      `Admin qo‘shish yoki o‘chirish uchun uning ID raqamini kiriting.\n\n` +
      `🔹 Hozirgi adminlar: ${config.admins.join(', ')}`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    list.forEach(async (id) => {
      const adminId = Number(id.trim())
      if (isNaN(adminId)) return // Agar ID noto‘g‘ri bo‘lsa, e’tibordan chetga olinadi.

      const index = config.admins.indexOf(adminId)
      if (index === -1) {
        config.admins.push(adminId) // ID yo‘q bo‘lsa, qo‘shiladi
      } else {
        config.admins.splice(index, 1) // ID mavjud bo‘lsa, o‘chiriladi
      }
    })

    await fs.writeFile('config.json', JSON.stringify(config, null, 2))

    return ctx.replyWithHTML(
      `✅ Adminlar ro‘yxati yangilandi!\n\n` +
      `🔹 Yangilangan ro‘yxat: ${config.admins.join(', ')}`,
      admin.backKeyboard,
    )
  }
}
