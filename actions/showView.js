const View = require('../models/view')
const { randomInt } = require('crypto')

module.exports = async (ctx) => {
  try {
    let views = await View.find({
      startDate: { $lte: new Date() },
      $or: [{ endDate: { $gte: new Date() } }, { endDate: { $exists: false } }],
      $or: [{ lang: ctx.user.lang }, { lang: null }],
      status: 'doing',
    })

    views = views.filter((view) => !(view.unique && view.users.includes(ctx.user.id)))

    if (!views.length) return

    const view = views[randomInt(0, views.length)]
    delete view.message.chat

    await View.findByIdAndUpdate(view._id, {
      $addToSet: { users: ctx.user.id },
      status: view.quantity && view.quantity <= view.views + 1 ? 'ended' : 'doing',
      $inc: { views: 1 },
    })

    await ctx.telegram.sendCopy(ctx.user.id, view.message, {
      reply_markup: {
        inline_keyboard: view.keyboard,
      },
      disable_web_page_preview: !view.preview,
    })
  } catch (error) {
    console.error(`❌ Xatolik: ${error.message}`)
  }
}
