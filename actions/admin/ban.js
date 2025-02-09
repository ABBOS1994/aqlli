const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const User = require('../../models/user.js')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_ban'
    return ctx.editMessageText(
      '🚫 Foydalanuvchini ban qilish yoki banidan chiqarish uchun ID kiriting:',
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
      },
    )
  } else {
    const userId = Number(ctx.message.text)

    if (config.admins.includes(userId)) {
      return ctx.replyWithHTML('❌ Adminni ban qilish mumkin emas!', admin.backKeyboard)
    }

    const user = await User.findOne({ id: userId })
    if (!user) {
      return ctx.reply(
        `❌ Foydalanuvchi topilmadi: ${userId}`,
        admin.backKeyboard,
      )
    }

    ctx.user.state = null

    user.ban = !user.ban
    await user.save()

    return ctx.replyWithHTML(
      `✅ Foydalanuvchi ${user.name} ${user.ban ? 'ban qilindi' : 'banidan chiqarildi'}.`,
      admin.backKeyboard,
    )
  }
}
