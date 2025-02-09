const Markup = require('telegraf/markup');

module.exports = async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.deleteMessage();

  await ctx.View.findByIdAndDelete(ctx.state[0]);

  return ctx.replyWithHTML('Ko‘rishlar o‘chirildi.', {
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('‹ Orqaga', 'admin_view'),
    ]),
    parse_mode: 'HTML',
  });
};
