const admin = require('../../helpers/admin.js')
const User = require('../../models/user')

module.exports = async (ctx) => {
  if (ctx.updateType === 'callback_query') {
    await ctx.answerCbQuery()
    ctx.user.state = `admin_addVip`

    return ctx.editMessageText(
      `Для изменения кол-во часов подписки введите id и кол-во часов через пробел.`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML'
      }
    )
  } else {
    const list = ctx.message.text.split(' ')

    const date = new Date()
    date.setHours(date.getHours() + Number(list[1]))

    const user = await User.findOneAndUpdate(
      { id: list[0] },
      { vip: date },
      { new: true }
    )

    return ctx.replyWithHTML(
      `Вы добавили премиум <a href='tg://user?id=${user?.id}'>${
        user?.name
      }</a> до ${date.toLocaleDateString()}`,
      admin.backKeyboard
    )
  }
}
