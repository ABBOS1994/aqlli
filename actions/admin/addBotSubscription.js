const config = require('../../config.json')
const admin = require('../../helpers/admin.js')
const fs = require('fs').promises

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()

    ctx.user.state = 'admin_addBotSubscription'

    return ctx.editMessageText(
      `🤖 Majburiy obunaga bot qo‘shish uchun uning **tokeni** va **havolasini** (agar kerak bo‘lsa, til kodini) kiriting.\n\n` +
      `📌 Namuna:\n` +
      `<code>297213:asdoiashd https://t.me/bot?start=ref</code>\n` +
      `<code>297213:asdoiashd https://t.me/bot?start=ref uz</code>\n\n` +
      `🤖 Botni majburiy obunadan o‘chirish uchun uning ID'sini kiriting.\n\n` +
      `📜 Hozirgi majburiy obuna botlari:\n` +
      `${
        config.subsBots?.length
          ? config.subsBots
            .map(
              (e) =>
                `<a href='${e.link}'>${e.id}</a> - ${e.lang.toUpperCase()} (<code>${e.id}</code>)`,
            )
            .join('\n')
          : '🚫 Majburiy obuna botlari mavjud emas.'
      }`,
      {
        ...admin.backKeyboard,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      },
    )
  } else {
    const list = ctx.message.text.split(' ')

    if (!config.subsBots) config.subsBots = []

    const id = Number(list[0].split(':')[0]) // Token ichidan ID ajratib olinadi.
    const existingIndex = config.subsBots.findIndex((o) => o.id === id)

    if (existingIndex !== -1) {
      // 🔥 Agar bot allaqachon mavjud bo‘lsa, uni o‘chiramiz
      config.subsBots.splice(existingIndex, 1)
    } else {
      if (!list[1]) {
        return ctx.replyWithHTML('❌ Bot havolasi ko‘rsatilmagan.', admin.backKeyboard)
      }

      // 📌 Agar bot yangi bo‘lsa, uni ro‘yxatga qo‘shamiz
      config.subsBots.push({
        link: list[1],
        id,
        lang: list[2] || 'all',
        token: list[0],
      })
    }

    await fs.writeFile('config.json', JSON.stringify(config, null, 2))

    return ctx.replyWithHTML(
      `✅ Majburiy obuna botlari ro‘yxati yangilandi!\n\n` +
      `📜 Hozirgi majburiy obuna botlari:\n` +
      `${
        config.subsBots.length
          ? config.subsBots
            .map(
              (e) =>
                `<a href='${e.link}'>${e.id}</a> - ${e.lang.toUpperCase()} (<code>${e.id}</code>)`,
            )
            .join('\n')
          : '🚫 Majburiy obuna botlari mavjud emas.'
      }`,
      {
        ...admin.backKeyboard,
        disable_web_page_preview: true,
      },
    )
  }
}
