const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
      await ctx.deleteMessage()

      if (ctx.state[1]) {
        const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
          lang: null,
        })

        if (!view) {
          return ctx.replyWithHTML('❌ Xatolik: Ko‘rish topilmadi.')
        }

        return ctx.replyWithHTML('Til o‘chirildi.', {
          reply_markup: Markup.inlineKeyboard([
            Markup.callbackButton(
              '⚙️ Sozlashni davom ettirish',
              `admin_view_id_${view._id}`,
            ),
          ]),
        })
      }

      ctx.user.state = `admin_view_lang_${ctx.state[0]}`

      return ctx.replyWithHTML(
        'Tilni kiriting.\n\nMisol: uz',
        {
          reply_markup: Markup.inlineKeyboard([
            Markup.callbackButton('⬅️ Ortga', `admin_view_id_${ctx.state[0]}`),
          ]),
          parse_mode: 'HTML',
        },
      )
    } else {
      const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
        lang: ctx.message.text.trim().toLowerCase(),
      })

      if (!view) {
        return ctx.replyWithHTML('❌ Xatolik: Ko‘rish topilmadi.')
      }

      ctx.user.state = null

      return ctx.replyWithHTML('Til saqlandi.', {
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(
            '⚙️ Sozlashni davom ettirish',
            `admin_view_id_${view._id}`,
          ),
        ]),
      })
    }
  } catch (error) {
    console.error(`❌ Xatolik: ${error.message}`)
    return ctx.replyWithHTML('❌ Xatolik yuz berdi, qayta urinib ko‘ring.')
  }
}
