const User = require('../models/user')

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis))
const shift = 5000

module.exports = async (bot) => {
  let died = []
  let alive = []
  const reportsCount = {}

  const usersCount = await User.countDocuments()

  for (let y = 0; y <= Math.ceil(usersCount / shift); y++) {
    const users = await User.find({}, { id: 1 }).limit(shift).skip(y * shift)
    const promises = users.map((user, i) =>
      bot.telegram
        .sendChatAction(user.id, 'typing')
        .then(() => ({ id: user.id, result: true }))
        .catch((e) => ({ id: user.id, result: e.description })),
    )

    const results = await Promise.all(promises)

    for (const result of results) {
      if (typeof result.result === 'string') {
        reportsCount[result.result] = (reportsCount[result.result] || 0) + 1
        died.push(result.id)
      } else {
        alive.push(result.id)
      }
    }

    // So‘rovlarni ortiqcha yubormaslik uchun kutish
    const successCount = results.filter((r) => r.result === true).length
    await sleep(successCount * 6)

    // Har 500 ta foydalanuvchi tekshirilgandan keyin bazani yangilash
    if ((y + 1) * shift % 500 === 0 || y === Math.ceil(usersCount / shift)) {
      await Promise.all([
        User.updateMany({ id: { $in: died } }, { alive: false }),
        User.updateMany({ id: { $in: alive } }, { alive: true }),
      ])
      died = []
      alive = []
    }
  }
}
