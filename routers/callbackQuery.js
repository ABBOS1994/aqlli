const { Composer } = require('telegraf')
const config = require('../config')
const View = require('../models/view')
const Mail = require('../models/mail')

const router = new Composer()


// 📌 Callback query'larni ajratish va yo‘nalish berish
router.on('callback_query', async (ctx, next) => {
  try {
    if (!ctx.callbackQuery?.data) return next()

    const split = ctx.callbackQuery.data.split('_')
    ctx.state = split.slice(1)

    console.log(`[⚡] Callback query: ${ctx.callbackQuery.data}`)
    return next()
  } catch (error) {
    console.error('[❌] Callback query xatosi:', error)
    await ctx.answerCbQuery('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
})

// 🏆 Foydalanuvchilar uchun callback query'lar
router.action('subscription', require('../middlewares/subscription'))
router.action('cabinet', require('../actions/cabinet'))
router.action('partner', require('../actions/partner'))
router.action('solve', require('../actions/solve'))
router.action('vip', require('../actions/vip'))
router.action('inlineUpdateMail', require('../actions/admin/mail/inlineUpdate'))
router.action('inlineUpdateView', require('../actions/admin/view/inlineUpdate'))

// 🛠 Admin callback query'lari
const adminRouter = new Composer()

adminRouter.use(async (ctx, next) => {
  if (!config.admins.includes(ctx.from?.id)) return
  await next()
})

adminRouter.action('addAdmin', require('../actions/admin/addAdmin'))
adminRouter.action('addSubscription', require('../actions/admin/addSubscription'))
adminRouter.action('addBotSubscription', require('../actions/admin/addBotSubscription'))
adminRouter.action('addJoin', require('../actions/admin/addJoin'))
adminRouter.action('addVip', require('../actions/admin/addVip'))
adminRouter.action('addWithdraw', require('../actions/admin/addWithdraw'))
adminRouter.action('listUsers', require('../actions/admin/listUsers'))
adminRouter.action('sysRef', require('../actions/admin/sysRef'))
adminRouter.action('ban', require('../actions/admin/ban'))
adminRouter.action('stat', require('../actions/admin/stat'))
adminRouter.action('botStat', require('../actions/admin/botStat'))
adminRouter.action('back', require('../actions/admin'))

// 📊 Adminlar uchun ko‘rish (View) callback'lari
const adminViewRouter = new Composer()
adminViewRouter.use(async (ctx, next) => {
  try {
    const split = ctx.callbackQuery.data.split('_')
    const viewId = split[2]

    if (!viewId) return ctx.answerCbQuery('❌ Xatolik: ID topilmadi!')

    ctx.View = await View.findById(viewId)

    if (!ctx.View) return ctx.answerCbQuery('❌ Xatolik: View topilmadi!')

    ctx.state = split.slice(3)
    await next()
  } catch (error) {
    console.error('[❌] View router xatosi:', error)
    await ctx.answerCbQuery('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
})

adminViewRouter.action('id', require('../actions/admin/view'))
adminViewRouter.action('add', require('../actions/admin/view/add'))
adminViewRouter.action('keyboard', require('../actions/admin/view/keyboard'))
adminViewRouter.action('quantity', require('../actions/admin/view/quantity'))
adminViewRouter.action('preview', require('../actions/admin/view/preview'))
adminViewRouter.action('unique', require('../actions/admin/view/unique'))
adminViewRouter.action('editPost', require('../actions/admin/view/editPost'))
adminViewRouter.action('startDate', require('../actions/admin/view/startDate'))
adminViewRouter.action('endDate', require('../actions/admin/view/endDate'))
adminViewRouter.action('delete', require('../actions/admin/view/delete'))
adminViewRouter.action('none', (ctx) => ctx.answerCbQuery())

adminRouter.action('view', adminViewRouter)

// 📩 Adminlar uchun mail callback'lari
const adminMailRouter = new Composer()
adminMailRouter.use(async (ctx, next) => {
  try {
    const split = ctx.callbackQuery.data.split('_')
    const mailId = split[2]

    if (!mailId) return ctx.answerCbQuery('❌ Xatolik: Mail ID topilmadi!')

    ctx.Mail = await Mail.findById(mailId)

    if (!ctx.Mail) return ctx.answerCbQuery('❌ Xatolik: Mail topilmadi!')

    ctx.state = split.slice(3)
    await next()
  } catch (error) {
    console.error('[❌] Mail router xatosi:', error)
    await ctx.answerCbQuery('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
})

adminMailRouter.action('id', require('../actions/admin/mail'))
adminMailRouter.action('add', require('../actions/admin/mail/add'))
adminMailRouter.action('keyboard', require('../actions/admin/mail/keyboard'))
adminMailRouter.action('quantity', require('../actions/admin/mail/quantity'))
adminMailRouter.action('preview', require('../actions/admin/mail/preview'))
adminMailRouter.action('editPost', require('../actions/admin/mail/editPost'))
adminMailRouter.action('startDate', require('../actions/admin/mail/startDate'))
adminMailRouter.action('delete', require('../actions/admin/mail/delete'))
adminMailRouter.action('action', require('../actions/admin/mail/action'))
adminMailRouter.action('start', require('../actions/admin/mail/start'))
adminMailRouter.action('none', (ctx) => ctx.answerCbQuery())

adminRouter.action('mail', adminMailRouter)
router.action('admin', adminRouter)

module.exports = router
