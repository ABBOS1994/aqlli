const convertChars = require('../helpers/convertChars')
const { Composer } = require('telegraf')

const router = new Composer()

router.use(async (ctx, next) => {
  const startDate = Date.now()

  try {
    if (!ctx.from || !ctx.chat) {
      console.warn('[⚠️] Logging: ctx.from yoki ctx.chat aniqlanmadi.')
      return next()
    }

    if (!ctx.user) {
      console.warn(`[⚠️] Logging: ctx.user aniqlanmadi. User ID: ${ctx.from.id}`)
      return next()
    }

    if (ctx.user.ban) {
      console.warn(`[🚫] Bloklangan foydalanuvchi: ${ctx.from.id}`)
      return // ⛔ Bloklangan foydalanuvchini oldinga o'tkazmaydi
    }

    // 🔹 Foydalanuvchi ma’lumotlarini yangilash
    ctx.user.username = ctx.from.username || 'NoUsername'
    ctx.user.name = convertChars(ctx.from.first_name || 'NoName')
    ctx.user.alive = true
    ctx.user.lastMessage = Date.now()

    await next() // 🟢 Keyingi middleware-ga o'tkazish

    // 🔹 Logger
    const messageText = ctx.message?.text?.slice(0, 64) || 'NoMessage'
    console.log(
      `[${new Date().toLocaleString('uz-UZ', { hour12: false })}]` +
      ` [${ctx.updateType?.toUpperCase() || 'UNKNOWN'}]` +
      ` | 👤 User: ${ctx.from.id}` +
      ` | 💬 Chat: ${ctx.chat.id}` +
      ` | ✉️ Message: "${messageText}"` +
      ` | ⏳ ${Date.now() - startDate}ms`,
    )

  } catch (error) {
    console.error('[❌] Logging: Middleware xatolik yuz berdi!', error)
  }
})

module.exports = router
