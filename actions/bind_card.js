// actions/bind_card.js

module.exports = async (ctx) => {
  ctx.session = ctx.session || {}
  ctx.session.card_bind = {}
  ctx.session.card_step = 'enter_card_number'
  return ctx.reply('💳 Karta raqamini kiriting (16 raqam):')
}