const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addSubscription'

    return ctx.editMessageText(
      `📌 Majburiy obuna uchun kanal yoki chat qo‘shish uchun ID/@username va havolani (agar kerak bo‘lsa, til kodini) kiriting.\n\n` +
      `📌 Namuna:\n` +
      `<code>-1001488198124 https://t.me/+WLQZ7FtUjj65e93L</code>\n` +
      `<code>-1001488198124 https://t.me/+WLQZ7FtUjj65e93L uz</code>\n\n` +
      `📌 Kanal yoki chatni majburiy obunadan o‘chirish uchun uning ID'sini kiriting.\n\n` +
      `📜 Hozirgi majburiy obuna kanallari/chatlar:\n` +
      `${
        config.subsChannels.length
          ? config.subsChannels
            .map(
              (e) =>
                `<a href='${e.link}'>${e.title}</a> - ${e.lang.toUpperCase()} (<code>${e.id}</code>)`,
            )
            .join('\n')
          : '🚫 Majburiy obuna kanallari mavjud emas.'
      }`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (!config.subsChannels) config.subsChannels = []

    const chatId = Number(list[0])
    const existingIndex = config.subsChannels.findIndex((o) => o.id === chatId)

    if (existingIndex !== -1) {
      // 🔥 Agar kanal allaqachon mavjud bo‘lsa, uni o‘chiramiz
      config.subsChannels.splice(existingIndex, 1)
    } else {
      if (!list[1]) {
        return ctx.replyWithHTML(
          '❌ Kanal yoki chat havolasi ko‘rsatilmagan.',
          admin.backKeyboard,
        )
      }

      try {
        var getChat = await ctx.telegram.getChat(chatId)
      } catch (e) {
        return ctx.replyWithHTML(
          '❌ Kanal yoki chat noto‘g‘ri yoki bot qo‘shilmagan!',
        )
      }

      // 📌 Agar kanal yoki chat yangi bo‘lsa, uni ro‘yxatga qo‘shamiz
      config.subsChannels.push({
        link: list[1],
        title: getChat.title,
        id: getChat.id,
        lang: list[2] || 'all',
      })
    }

    await fs.writeFile('config.json', JSON.stringify(config, null, 2))

    return ctx.replyWithHTML(
      `✅ Majburiy obuna kanallari ro‘yxati yangilandi!\n\n` +
      `📜 Hozirgi majburiy obuna kanallari:\n` +
      `${
        config.subsChannels.length
          ? config.subsChannels
            .map(
              (e) =>
                `<a href='${e.link}'>${e.title}</a> - ${e.lang.toUpperCase()} (<code>${e.id}</code>)`,
            )
            .join('\n')
          : '🚫 Majburiy obuna kanallari mavjud emas.'
      }`,
      {
        ...admin.backKeyboard,
        disable_web_page_preview: true,
      },
    )
  }
}
