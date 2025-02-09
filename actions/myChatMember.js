const User = require('../models/user')

module.exports = async (ctx) => {
  if (!ctx.chat || ctx.chat.type !== 'private') return

  try {
    await User.updateOne(
      { id: ctx.from.id },
      { alive: ctx.myChatMember?.new_chat_member?.status !== 'kicked' },
    )
  } catch (error) {
    console.error(`❌ Xatolik: ${error.message}`)
  }
}
