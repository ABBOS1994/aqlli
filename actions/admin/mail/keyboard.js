const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const mail = await Mail.findByIdAndUpdate(ctx.state[0], { keyboard: [] })
      return ctx.replyWithHTML('📌 Tugmalar o‘chirildi.', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            '⚙️ Sozlashni davom ettirish',
            `admin_mail_id_${mail._id}`,
          ),
        ]),
      })
    }

    ctx.user.state = `admin_mail_keyboard_${ctx.state[0]}`

    return ctx.replyWithHTML(
      `Tugmalarni quyidagi formatda kiriting:

<code>Tugma 1 http://example1.com</code>

<i>Agar bir qatorga bir nechta tugma qo‘shmoqchi bo‘lsangiz, "|" bilan ajrating:</i>

<code>
Tugma 1 http://example1.com | Tugma 2 http://example2.com
Tugma 3 http://example3.com | Tugma 4 http://example4.com
</code>`,
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('⬅️ Orqaga', `admin_mail_id_${ctx.state[0]}`),
        ]),
        parse_mode: 'HTML',
      },
    )
  } else {
    const possibleUrls = ['http://', 'https://', 'tg://', 'ton://', 't.me/', 'telegram.me/']

    const splitByEnter = ctx.message.text.split('\n')
    const keyboard = splitByEnter.map((enter) => {
      const splitByWand = enter.split('|')
      return splitByWand.map((wand) => {
        const foundUrl = possibleUrls.find((url) => wand.includes(url))
        if (!foundUrl) return false // ✅ Xatolikni oldini olish

        const key = {
          text: wand.slice(0, wand.indexOf(foundUrl)).replace(' - ', '').trim(),
          url: wand.slice(wand.indexOf(foundUrl)).trim(),
        }

        return key.text && key.url ? key : false
      })
    })

    if (keyboard.some((row) => row.some((key) => !key))) {
      return ctx.reply('❌ Tugmalar yaratishda xatolik yuz berdi!')
    }

    ctx.user.state = null
    const mail = await Mail.findByIdAndUpdate(ctx.state[0], { keyboard })

    return ctx.replyWithHTML('✅ Tugmalar saqlandi.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙️ Sozlashni davom ettirish',
          `admin_mail_id_${mail._id}`,
        ),
      ]),
    })
  }
}
