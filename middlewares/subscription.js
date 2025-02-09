const config = require('../config')

module.exports = async (ctx, next) => {
  if (!ctx.from || !ctx.chat) {
    console.warn('[⚠️] Subscription: ctx.from yoki ctx.chat aniqlanmadi.')
    return next()
  }

  if (ctx.message?.text === '/start') {
    console.log('⏩ /start buyruq obunasiz ishlashiga ruxsat berildi')
    return next()
  }

  const isPremium = ctx.user?.vip && ctx.user?.vip > new Date()

  if (config.admins.includes(ctx.from.id) || ctx.chat.type !== 'private' || isPremium) {
    return next()
  }

  return next() // ⚡ Tezlik uchun boshqa tekshirishlar olib tashlandi
}
