const Markup = require('telegraf/markup')
const Mail = require('../../../models/mail') // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
    await ctx.deleteMessage()

    if (ctx.state[1]) {
      const mail = await Mail.findByIdAndUpdate(ctx.state[0], {
        $unset: { startDate: 1 },
      }, { new: true })

      if (!mail) {
        return ctx.reply('❌ Xatolik: Tarqatish topilmadi.')
      }

      return ctx.replyWithHTML('🕒 Vaqt olib tashlandi.', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            '⚙️ Sozlashni davom ettirish',
            `admin_mail_id_${mail._id}`,
          ),
        ]),
      })
    }

    ctx.user.state = `admin_mail_startDate_${ctx.state[0]}`

    return ctx.replyWithHTML(
      '📅 Tarqatish boshlanish sanasini va vaqtini kiriting.\n\nMisol: <b>2025.02.10 14:30</b>',
      {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('⬅️ Orqaga', `admin_mail_id_${ctx.state[0]}`),
        ]),
        parse_mode: 'HTML',
      },
    )
  } else {
    const startDate = new Date(ctx.message.text)

    if (isNaN(startDate)) {
      return ctx.reply('❌ Xatolik: Iltimos, to‘g‘ri formatda sanani kiriting.\n\nMisol: <b>2025.02.10 14:30</b>')
    }

    const mail = await Mail.findByIdAndUpdate(ctx.state[0], {
      startDate,
    }, { new: true })

    if (!mail) {
      return ctx.reply('❌ Xatolik: Tarqatish topilmadi.')
    }

    ctx.user.state = null

    return ctx.replyWithHTML('✅ Tarqatish boshlanish sanasi va vaqti saqlandi.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙️ Sozlashni davom ettirish',
          `admin_mail_id_${mail._id}`,
        ),
      ]),
    })
  }
}
