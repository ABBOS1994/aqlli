const admin = require('../../helpers/admin.js')

const User = require('../../models/user')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addWithdraw'

    return ctx.editMessageText(
      `Для добавления вывода пользователю введите его id и сумму через пробел`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    const user = await User.findOneAndUpdate(
      { id: list[0] },
      { $inc: { withdraw: Number(list[1]) } },
      { new: true },
    )

    return ctx.replyWithHTML(
      `Вы добавили вывод <a href='tg://user?id=${user.id}'>${
        user.name
      }</a> теперь оплачено - ${user.withdraw} UZS, доступно к выводу ${
        user.earned - user.withdraw
      } UZS`,
      admin.backKeyboard,
    )
  }
}
