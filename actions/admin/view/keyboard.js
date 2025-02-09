const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        keyboard: [],
      })
      return ctx.replyWithHTML('Klaviatura o‘chirildi', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            'Sozlashni davom ettirish',
            `admin_view_id_${view._id}`,
          ),
        ]),
      })
    }
    ctx.user.state = `admin_view_keyboard_${ctx.state[0]}`

    return ctx.replyWithHTML(
      `Tugmalar ro‘yxatini quyidagi formatda kiriting:

<code>Tugma 1 http://example1.com</code>

<i>Bir qatorga bir nechta tugma qo‘shish uchun "|" ajratgichidan foydalaning:</i>

<code>Tugma 1 http://example1.com | Tugma 2 http://example2.com
Tugma 3 http://example3.com | Tugma 4 http://example4.com</code>`,
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('‹ Ortga', `admin_view_id_${ctx.state[0]}`),
        ]),
        parse_mode: 'HTML',
      },
    )
  } else {
    const possibleUrls = [
      'http://',
      'https://',
      'tg://',
      'ton://',
      't.me/',
      'telegram.me/',
    ]

    const splitByEnter = ctx.message.text.split('\n')

    const keyboard = splitByEnter.map((enter) => {
      const splitByWand = enter.split('|')

      return splitByWand.map((wand) => {
        const indexOfUrl = wand.indexOf(
          possibleUrls.find((url) => wand.includes(url)),
        )
        if (indexOfUrl === -1) return false

        const key = {
          text: wand.slice(0, indexOfUrl).replace(' - ', '').trim(),
          url: wand.slice(indexOfUrl).trim(),
        }

        return key.text && key.url ? key : false
      })
    })

    if (
      keyboard.findIndex(
        (enterKeyboard) => enterKeyboard.findIndex((key) => !key) !== -1,
      ) !== -1
    )
      return ctx.reply('Klaviatura tuzilishida xatolik')

    ctx.user.state = null

    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      keyboard,
    })
    return ctx.replyWithHTML('Klaviatura saqlandi', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Sozlashni davom ettirish',
          `admin_view_id_${view._id}`,
        ),
      ]),
    })
  }
}
