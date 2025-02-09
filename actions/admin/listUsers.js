const User = require('../../models/user')
const Markup = require('telegraf/markup')

const exportTemplate = {
  _id: '',
  id: '',
  name: '',
  username: '',
  state: '',
  lang: '',
  ban: '',
  langCode: '',
  alive: '',
  from: '',
  lastMessage: '',
  createdAt: '',
  updatedAt: '',
}

module.exports = async (ctx) => {
  if (ctx.state[0]) {
    await ctx.answerCbQuery('📤 Foydalanuvchilar eksport qilinmoqda...', true)

    let contentUsers = []
    let users = []

    switch (ctx.state[0]) {
      case 'alive':
        users = await User.find({ alive: true }, '-_id id').lean()
        contentUsers = users.map((value) => Object.values(value))
        break
      case 'all':
        users = await User.find({}, '-_id id').lean()
        contentUsers = users.map((value) => Object.values(value))
        break
      case 'full':
        users = await User.find(
          {},
          Object.keys(exportTemplate).join(' '),
        ).lean()

        contentUsers = [Object.keys(exportTemplate).join(';')]
        contentUsers.push(
          users.map((value) =>
            Object.values({ ...exportTemplate, ...value }).join(';'),
          ),
        )
        break
    }

    return ctx.replyWithDocument({
      source: Buffer.from(contentUsers.join('\n'), 'utf8'),
      filename: 'foydalanuvchilar.csv',
    })
  } else {
    await ctx.answerCbQuery()

    return ctx.editMessageText(
      '📥 **Qaysi formatda eksport qilishni tanlang:**',
      Markup.inlineKeyboard([
        [
          Markup.callbackButton('📂 To‘liq ma’lumotlar', 'admin_listUsers_all'),
          Markup.callbackButton('🟢 Faqat aktivlar', 'admin_listUsers_alive'),
        ],
        [Markup.callbackButton('🔙 Orqaga', 'admin_back')],
      ]).extra(),
    )
  }
}
