const User = require('../models/user')

module.exports = async (ctx) => {
  if (ctx.chat?.type !== 'private') return

  return User.updateOne(
    { id: ctx.from.id },
    {
      alive: ctx.myChatMember.new_chat_member.status !== 'kicked'
    }
  )
}
