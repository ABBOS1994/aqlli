const admin = require('../../helpers/admin.js')
const User = require('../../models/user')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addWithdraw'

    return ctx.editMessageText(
      `💵 **Foydalanuvchiga pul yechib berish uchun ID va summani kiriting.**\n\n` +
      `📌 Namuna:\n` +
      `<code>1975916928 50000</code>  (50000 so‘m yechib berish)`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (list.length < 2 || isNaN(list[1])) {
      return ctx.replyWithHTML(
        '❌ Xatolik: Foydalanuvchi ID\' si va miqdor to‘g‘ri formatda kiritilishi kerak.\n\n' +
        '📌 Namuna: <code>1975916928 50000</code>',
        admin.backKeyboard,
      )
    }

    const userId = Number(list[0])
    const amount = Number(list[1])

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $inc: { withdraw: amount } },
      { new: true },
    )

    if (!user) {
      return ctx.replyWithHTML(
        `❌ Xatolik: <code>${userId}</code> ID bilan foydalanuvchi topilmadi.`,
        admin.backKeyboard,
      )
    }

    return ctx.replyWithHTML(
      `✅ <a href='tg://user?id=${user.id}'>${user.name}</a> uchun **${amount.toLocaleString()} UZS** miqdorida pul yechib berildi!\n\n` +
      `💰 **Jami yechib olingan summa**: ${user.withdraw.toLocaleString()} UZS\n` +
      `💳 **Mavjud balans**: ${(user.earned - user.withdraw).toLocaleString()} UZS`,
      admin.backKeyboard,
    )
  }
}
