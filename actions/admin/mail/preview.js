const Markup = require('telegraf/markup');
const Mail = require('../../../models/mail'); // ✅ Mail modelini chaqirish

module.exports = async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  const mail = await Mail.findById(ctx.state[0]);
  if (!mail) {
    return ctx.reply('❌ Xatolik: Tarqatish topilmadi.');
  }

  mail.preview = !mail.preview;
  await mail.save();

  return ctx.replyWithHTML(
    `🌐 Oldindan ko‘rish ${mail.preview ? 'yoqildi ✅' : 'o‘chirildi ❌'}.`,
    {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          '⚙️ Sozlashni davom ettirish',
          `admin_mail_id_${ctx.state[0]}`,
        ),
      ]),
      parse_mode: 'HTML',
    },
  );
};
