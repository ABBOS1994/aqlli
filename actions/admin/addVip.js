const admin = require('../../helpers/admin.js')
const User = require('../../models/user')

module.exports = async (ctx) => {
  if (ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    ctx.user.state = `admin_addVip`

    return ctx.editMessageText(
      `💎 **VIP obunani qo‘shish yoki yangilash uchun foydalanuvchi ID'si va soatlar sonini kiriting.**\n\n` +
      `📌 Namuna:\n` +
      `<code>1975916928 24</code>  (24 soatga VIP)\n` +
      `<code>305544740 720</code>  (30 kun - 720 soatga VIP)`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (list.length < 2 || isNaN(list[1])) {
      return ctx.replyWithHTML(
        '❌ Xatolik: Foydalanuvchi ID\'si va soatlar soni to‘g‘ri formatda kiritilishi kerak.\n\n' +
        '📌 Namuna: <code>1975916928 24</code>',
        admin.backKeyboard,
      )
    }

    const userId = Number(list[0])
    const hours = Number(list[1])

    const date = new Date()
    date.setHours(date.getHours() + hours)

    const user = await User.findOneAndUpdate(
      { id: userId },
      { vip: date },
      { new: true },
    )

    if (!user) {
      return ctx.replyWithHTML(
        `❌ Xatolik: <code>${userId}</code> ID bilan foydalanuvchi topilmadi.`,
        admin.backKeyboard,
      )
    }

    return ctx.replyWithHTML(
      `✅ <a href='tg://user?id=${user.id}'>${user.name}</a> uchun **VIP obuna qo‘shildi**!\n\n` +
      `📅 VIP amal qilish muddati: **${date.toLocaleDateString()} ${date.toLocaleTimeString()}**`,
      admin.backKeyboard,
    )
  }
}
