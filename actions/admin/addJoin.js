const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addJoin'

    return ctx.editMessageText(
      `📌 Arizalarni qabul qilish uchun kanal yoki chat qo‘shish uchun **ID yoki @username** ni kiriting.\n\n` +
      `📌 Namuna:\n` +
      `<code>-1001488198124</code>\n\n` +
      `📌 Kanal yoki chatni arizalarni qabul qilish ro‘yxatidan o‘chirish uchun uning ID'sini kiriting.\n\n` +
      `📜 Hozirgi arizalarni qabul qiluvchi kanallar/chatlar:\n` +
      `${
        config.joinChannels?.length
          ? config.joinChannels
            .map((e) => `${e.title} (<code>${e.id}</code>)`)
            .join('\n')
          : '🚫 Hozircha hech qanday kanal yoki chat mavjud emas.'
      }`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (!config.joinChannels) config.joinChannels = []

    const chatId = Number(list[0])
    const existingIndex = config.joinChannels.findIndex((o) => o.id === chatId)

    if (existingIndex !== -1) {
      // 🔥 Agar kanal mavjud bo‘lsa, uni o‘chiramiz
      config.joinChannels.splice(existingIndex, 1)
    } else {
      try {
        var getChat = await ctx.telegram.getChat(chatId)
      } catch (e) {
        return ctx.replyWithHTML('❌ Noto‘g‘ri kanal/chat yoki bot qo‘shilmagan.')
      }

      // 📌 Agar kanal yangi bo‘lsa, uni ro‘yxatga qo‘shamiz
      config.joinChannels.push({
        title: getChat.title,
        id: getChat.id,
      })
    }

    await fs.writeFile('config.json', JSON.stringify(config, null, 2))

    return ctx.replyWithHTML(
      `✅ Arizalarni qabul qiluvchi kanallar/chatlar ro‘yxati yangilandi!\n\n` +
      `📜 Hozirgi arizalarni qabul qiluvchi kanallar/chatlar:\n` +
      `${
        config.joinChannels.length
          ? config.joinChannels
            .map((e) => `${e.title} (<code>${e.id}</code>)`)
            .join('\n')
          : '🚫 Hozircha hech qanday kanal yoki chat mavjud emas.'
      }`,
      {
        ...admin.backKeyboard,
        disable_web_page_preview: true,
      },
    )
  }
}
