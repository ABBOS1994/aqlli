const { Composer } = require('telegraf')
const Deposit = require('../models/deposit')

const router = new Composer()

router.on('text', async (ctx) => {
  try {
    console.log(`📩 Yangi xabar: ${ctx.message.text}`)
    await ctx.reply('✅ Xabar qabul qilindi.')
  } catch (error) {
    console.error('❌ Callback xatosi:', error.message)
    await ctx.reply('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
})

module.exports = router
