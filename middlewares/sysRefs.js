const Ref = require('../models/ref')
const User = require('../models/user')

module.exports = async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()

  const split = ctx.message.text.split(' ')
  if (split[0] !== '/start') return next()

  const cmd = split[1]?.split('-') || []

  if (cmd[0] === 'ref') {
    await handleReferral(ctx, cmd[1])
  } else if (cmd[0] === 'r' && ctx.freshUser) {
    await handleReferrerBonus(ctx, cmd[1])
  }

  return next()
}

// 🔹 Referal havolani qayta ishlash
async function handleReferral(ctx, refName) {
  if (!refName) return

  const date = Date.now()
  const find = await Ref.findOne({ name: refName })

  const updateData = {
    $inc: { count: 1, newCount: ctx.freshUser ? 1 : 0 },
    $set: { last: date },
  }

  if (find) {
    if (!find.users.includes(ctx.from.id)) {
      updateData.$inc.uniqueCount = 1
      updateData.$push = { users: ctx.from.id }
    }
    await Ref.updateOne({ name: refName }, updateData)
  } else {
    await Ref.create({
      name: refName,
      first: date,
      last: date,
      count: 1,
      uniqueCount: 1,
      newCount: ctx.freshUser ? 1 : 0,
      users: [ctx.from.id],
    })
  }
}

// 🔹 Referer uchun bonusni hisoblash
async function handleReferrerBonus(ctx, referrerId) {
  if (!referrerId) return

  const referrals = await User.countDocuments({
    from: `r-${referrerId}`,
    deposit: { $gte: 199 },
  })

  const updateObject = { $inc: { refCount: 1 } }
  if (referrals !== 0 && referrals % 49 === 0) updateObject.$inc.earned = 500

  if (referrals === 4) {
    const vipExpiry = new Date()
    vipExpiry.setHours(vipExpiry.getHours() + 720)
    updateObject.$set = { vip: vipExpiry }
  }

  await User.updateOne({ id: referrerId }, updateObject)
}
