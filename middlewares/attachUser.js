const User = require('../models/user')
const convertChars = require('../helpers/convertChars')

module.exports = async (ctx, next) => {
  if (!ctx.from || !ctx.chat) {
    console.warn('[⚠️] attachUser: ctx.from yoki ctx.chat aniqlanmadi.')
    return next()
  }

  let user = await User.findOne({ id: ctx.from.id })

  if (!user && ctx.chat.type === 'private') {
    user = new User({
      id: ctx.from.id,
      name: convertChars(ctx.from.first_name || 'NoName'),
      username: ctx.from.username || 'NoUsername',
      langCode: ctx.from.language_code || 'NoLang',
      alive: true,
      from: ctx?.message?.text?.split(' ')[1] || null,
      lastMessage: Date.now(),
    })

    await user.save()
    ctx.freshUser = true
    console.log(`[✅] Yangi foydalanuvchi yaratildi: ${user.id} | ${user.name}`)
  }

  ctx.user = user
  await next()

  if (ctx.user) {
    ctx.user.lastMessage = Date.now()
    await ctx.user.save()
  }
}
