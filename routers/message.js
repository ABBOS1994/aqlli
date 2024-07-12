const { Router } = require('telegraf')
const config = require('../config')
const View = require('../models/view')
const Mail = require('../models/mail')

const router = new Router(async (ctx) => {
  if (ctx.chat.type !== 'private') return

  const route = ctx.message?.text?.startsWith('/')
    ? 'command'
    : ctx.user.state
    ? 'state'
    : 'else'

  return { route }
})

const adminRouter = new Router(async (ctx) => {
  if (!config.admins.includes(ctx.from.id)) return
  const cmd = ctx.user.state.split('_')

  ctx.state = cmd.slice(2, cmd.length)
  return { route: cmd[1] }
})

const commandRouter = new Router(async (ctx) => {
  const cmd = ctx.message.text.replace('/', '').split(' ')

  ctx.state = cmd.slice(1, cmd.length)
  return { route: cmd[0] }
})

commandRouter.on('admin', require('../actions/admin'))
commandRouter.on('start', require('../actions/start'))
commandRouter.on('lang', require('../actions/translateBot'))

router.on('command', commandRouter)

const stateRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.state = cmd.slice(1, cmd.length)
  return { route: cmd[0] }
})

adminRouter.on('addAdmin', require('../actions/admin/addAdmin'))
adminRouter.on('addSubscription', require('../actions/admin/addSubscription'))
adminRouter.on(
  'addBotSubscription',
  require('../actions/admin/addBotSubscription'),
)
adminRouter.on('addJoin', require('../actions/admin/addJoin'))
adminRouter.on('addVip', require('../actions/admin/addVip'))
adminRouter.on('addWithdraw', require('../actions/admin/addWithdraw'))
adminRouter.on('sysRef', require('../actions/admin/sysRef'))
adminRouter.on('ban', require('../actions/admin/ban'))
adminRouter.on('botStat', require('../actions/admin/botStat'))

const adminViewRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.View = View

  ctx.state = cmd.slice(3, cmd.length)
  return { route: cmd[2] }
})

adminViewRouter.on('add', require('../actions/admin/view/add'))

adminViewRouter.on('keyboard', require('../actions/admin/view/keyboard'))
adminViewRouter.on('lang', require('../actions/admin/view/lang'))
adminViewRouter.on('quantity', require('../actions/admin/view/quantity'))
adminViewRouter.on('editPost', require('../actions/admin/view/editPost'))
adminViewRouter.on('startDate', require('../actions/admin/view/startDate'))
adminViewRouter.on('endDate', require('../actions/admin/view/endDate'))

adminRouter.on('view', adminViewRouter)

const adminMailRouter = new Router(async (ctx) => {
  const cmd = ctx.user.state.split('_')

  ctx.Mail = Mail

  ctx.state = cmd.slice(3, cmd.length)
  return { route: cmd[2] }
})

adminMailRouter.on('add', require('../actions/admin/mail/add'))

adminMailRouter.on('keyboard', require('../actions/admin/mail/keyboard'))
adminMailRouter.on('lang', require('../actions/admin/mail/lang'))
adminMailRouter.on('quantity', require('../actions/admin/mail/quantity'))
adminMailRouter.on('editPost', require('../actions/admin/mail/editPost'))
adminMailRouter.on('startDate', require('../actions/admin/mail/startDate'))

adminRouter.on('mail', adminMailRouter)

stateRouter.on('admin', adminRouter)

stateRouter.on('solve', require('../actions/handle'))

router.on('state', stateRouter)

router.on('else', require('../actions/handle'))

module.exports = router
