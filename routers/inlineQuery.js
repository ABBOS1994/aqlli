const { Router } = require('telegraf')

const router = new Router(async (ctx) => {
  if (!ctx.inlineQuery?.query) return { route: null } // Xato yoki bo‘sh so‘rovlarni oldini olish

  const split = ctx.inlineQuery.query.trim().split('_')
  ctx.state = split

  return { route: split[0] || null }
})

// Yo‘nalishlar (inline query uchun)
router.on('mail', require('../actions/admin/mail/inline'))
router.on('view', require('../actions/admin/view/inline'))

// Agar boshqa yo‘nalish bo‘lsa, hech narsa qilmasin
// router.otherwise((ctx) => ctx.answerInlineQuery([])); // Agar kerak bo‘lsa, qo‘shing

module.exports = router
