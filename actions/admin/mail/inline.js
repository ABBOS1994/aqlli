const Mail = require('../../../models/mail');
const Markup = require('telegraf/markup');

module.exports = async (ctx) => {
  if (!ctx.state[1]) return ctx.answerInlineQuery([]);

  const mail = await Mail.findById(ctx.state[1]);

  if (!mail) {
    return ctx.answerInlineQuery([
      {
        type: 'article',
        id: '0',
        title: '❌ Tarqatish topilmadi',
        input_message_content: {
          message_text: '⛔ Ushbu tarqatish mavjud emas yoki o‘chirilgan.',
          parse_mode: 'HTML',
        },
      },
    ]);
  }

  return ctx.answerInlineQuery([
    {
      type: 'article',
      id: '0',
      title: '📩 Tarqatish haqida ma’lumot',
      input_message_content: {
        message_text: 'ℹ Ma’lumot olish uchun tugmani bosing.',
        parse_mode: 'HTML',
      },
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('🔄 Yangilash', `inlineUpdateMail_${mail._id}`),
      ]),
    },
  ]);
};
