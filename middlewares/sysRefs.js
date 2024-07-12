const Ref = require('../models/ref')
const User = require('../models/user')

module.exports = async (ctx, next) => {
  if (ctx.chat.type !== 'private') return next()

  const split = ctx.message.text.split(' ')
  if (split[0] !== '/start') return next()

  const cmd = (split[1] && split[1].split('-')) || []

  if (cmd[0] === 'ref') {
    let newCount = 0
    if (ctx.freshUser) newCount = 1

    const date = Date.now()
    const find = await Ref.findOne({ name: cmd[1] })
    if (find) {
      const findIclude = find.users.includes(ctx.from.id)
      if (findIclude) {
        await Ref.updateOne(
          { name: cmd[1] },
          {
            $inc: { count: 1, newCount },
            $set: { last: date },
          },
        )
      } else {
        await Ref.updateOne(
          { name: cmd[1] },
          {
            $inc: { count: 1, newCount, uniqueCount: 1 },
            $push: { users: ctx.from.id },
            $set: { last: date },
          },
        )
      }
    } else {
      await Ref.create({
        name: cmd[1],
        first: date,
        last: date,
        count: 1,
        uniqueCount: 1,
        newCount,
        users: [ctx.from.id],
      })
    }
  } else if (cmd[0] === 'r' && ctx.freshUser) {
    const referrals = await User.countDocuments({
      from: `r-${cmd[1]}`,
      deposit: { $gte: 199 },
    })

    const updateObject = {
      $inc: { refCount: 1 },
    }
    if (referrals !== 0 && referrals % 49 === 0) updateObject.$inc.earned = 500
    if (referrals === 4) {
      const date = new Date()
      date.setHours(date.getHours() + 720)

      updateObject.$set.vip = date
    }

    await User.updateOne({ id: cmd[1] }, updateObject)
  }

  return next()
}
