const View = require('../../../models/view')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  try {
    if (!ctx.state[1]) return

    const view = await View.findById(ctx.state[1])

    if (!view) {
      console.error(`❌ Xatolik: View ID ${ctx.state[1]} topilmadi.`)
      return ctx.answerInlineQuery([])
    }

    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: '0',
        title: 'Ko‘rishlar',
        input_message_content: {
          message_text: 'Ma’lumot olish uchun tugmani bosing:',
          parse_mode: 'HTML',
        },
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton('🔄 Yangilash', `inlineUpdateView_${view._id}`),
        ]),
      },
    ])
  } catch (error) {
    console.error(`❌ Xatolik: ${error.message}`)
  }
}
