const convertChars = require('../helpers/convertChars')

let lastFloodError = 0
let lastTimeoutError = 0

module.exports = async (err, ctx) => {
  if (!ctx) {
    console.error(`[❌] ERROR: ctx aniqlanmadi!`, err)
    return
  }

  const now = Date.now()
  const userId = ctx?.from?.id || 'Unknown'
  const chatId = ctx?.chat?.id || 'Unknown'
  const updateType = ctx?.updateType || 'Unknown'
  const messageText =
    ctx?.message?.text?.slice(0, 100) ||
    ctx?.callbackQuery?.data ||
    ctx?.inlineQuery?.query ||
    'NoData'

  // 🚧 FLOOD ERROR (Too Many Requests)
  if (err.code === 429 && err.description?.startsWith('Too Many Requests: retry after')) {
    if (now - lastFloodError < 180000) return // 3 daqiqadan kam bo‘lsa, yana xabar yubormaymiz
    lastFloodError = now

    console.warn(`[⚠️] FLOOD ERROR (${updateType}) | Message: "${messageText}"`)
    return notifyAdmin(ctx, '⚠️ FLOOD ERROR', updateType, messageText, err.description)
  }

  // ⏳ TIMEOUT ERROR (Eski so‘rov yoki muddati tugagan)
  if (err.code === 400 && err.description?.includes('query is too old')) {
    if (now - lastTimeoutError < 180000) return
    lastTimeoutError = now

    console.warn(`[⏳] TIMEOUT ERROR (${updateType}) | Message: "${messageText}"`)
    return notifyAdmin(ctx, '⏳ TIMEOUT ERROR', updateType, messageText, err.description)
  }

  // ❌ XABARNI O'ZGARTIRISH XATOLARI (Edit yoki Delete muammolari)
  if (err.code === 400 && ['message to edit not found', 'MESSAGE_ID_INVALID'].includes(err.description)) {
    return ctx.telegram.sendCopy(err.on.payload.chat_id, err.on.payload).catch(console.error)
  }

  // 🔇 E'tiborsiz qoldiriladigan xatolar
  if ([400, 403].includes(err.code) && [
    'message is not modified',
    'message to delete not found',
    'bot was blocked by the user',
    'message can\'t be deleted for everyone',
  ].includes(err.description)) {
    return
  }

  // 🚨 BOSHQA BARCHA XATOLAR
  console.error(`[❌] ERROR (${updateType}) | User: ${userId} | Chat: ${chatId} | Message: "${messageText}"`, err)
  return notifyAdmin(ctx, '🚨 ERROR', updateType, messageText, err.stack)
}

// 🛠 ADMINGA XABAR YUBORISH FUNKSIYASI
async function notifyAdmin(ctx, errorType, updateType, messageText, errorDetails) {
  const adminId = process.env.DEV_ID
  if (!adminId) {
    console.warn(`[⚠️] DEV_ID yo‘q, xabar yuborilmadi!`)
    return
  }

  try {
    await ctx.telegram.sendMessage(
      adminId,
      `${errorType} in <b>${updateType}</b>\n📝 <code>${messageText}</code>\n\n<i>${convertChars(errorDetails)}</i>`,
      { parse_mode: 'HTML' },
    )
  } catch (error) {
    console.error('[❌] Admin xabar yuborishda xatolik', error)
  }
}
