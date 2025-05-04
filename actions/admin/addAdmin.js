const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    ctx.user.state = 'admin_addAdmin'
    await ctx.user.save() // 🧠 saqlab qo‘yamiz

    return ctx.editMessageText(
      `Для добавления/удаления администратора введите его ID.\n\n` +
      `Текущий список администраторов: ${config.admins.join(', ')}`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML'
      }
    )
  }

  if (ctx.user.state !== 'admin_addAdmin') return

  // 🧹 Holatni tozalaymiz va saqlaymiz
  ctx.user.state = null
  await ctx.user.save()

  const list = ctx.message.text.split(' ')

  for (let i of list) {
    const parsedId = Number(i.trim())
    if (!Number.isInteger(parsedId) || parsedId <= 0) continue

    const index = config.admins.indexOf(parsedId)
    if (index === -1) config.admins.push(parsedId)
    else config.admins.splice(index, 1)
  }

  await fs.writeFile('config.json', JSON.stringify(config, null, 2))

  return ctx.replyWithHTML(
    `✅ Список администраторов обновлен.\n\nТекущий список: ${config.admins.join(', ')}`,
    admin.backKeyboard
  )
}
