const Markup = require('telegraf/markup');

module.exports = async (ctx) => {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery();
    ctx.user.state = `admin_view_editPost_${ctx.state[0]}`;
    await ctx.deleteMessage();

    return ctx.replyWithHTML('Har qanday tayyor postni yuboring.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton('‹ Orqaga', `admin_view_id_${ctx.state[0]}`),
      ]),
      parse_mode: 'HTML',
    });
  } else {
    const view = await ctx.View.findByIdAndUpdate(ctx.state[0], {
      keyboard: ctx.message?.reply_markup?.inline_keyboard,
      message: ctx.message,
    });
    ctx.user.state = null;

    return ctx.replyWithHTML('Post saqlandi.', {
      reply_markup: Markup.inlineKeyboard([
        Markup.callbackButton(
          'Sozlashni davom ettirish',
          `admin_view_id_${view._id}`,
        ),
      ]),
    });
  }
};
