const config = require('../config.json')
const User = require('../models/user')
const convertChars = require('../helpers/convertChars')

module.exports = async (ctx) => {
  try {
    const find = config.joinChannels?.find((channel) => channel.id === ctx.chat.id)
    if (!find) return

    // Foydalanuvchini chatga qo‘shish
    await ctx.telegram.approveChatJoinRequest(ctx.chat.id, ctx.from.id)

    // Foydalanuvchiga xabar yuborish
    await ctx.telegram.sendMessage(ctx.from.id, '✅ Siz guruhga muvaffaqiyatli qo‘shildingiz!', {
      parse_mode: 'HTML',
    })

    // Yangi foydalanuvchini bazaga qo‘shish
    await User.create({
      id: ctx.from.id,
      name: convertChars(ctx.from.first_name || 'Noma’lum'),
      username: ctx.from.username || 'Noma’lum',
      alive: true,
      from: `chatJoin-${ctx.chat.id}`,
    }).catch(() => {
    })
  } catch (error) {
    console.error(`❌ Xatolik: ${error.message}`)
  }
}
