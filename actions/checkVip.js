const User = require('../models/user')

const { Markup } = require('telegraf')

module.exports = async (bot, i18n) => {
  const now = new Date()
  const minuteLast = new Date()
  minuteLast.setMinutes(minuteLast.getMinutes() - 1)

  const users = await User.find({
    vip: { $gte: minuteLast, $lte: now },
  })

  return Promise.all(
    users.map((user) =>
      bot.telegram.sendMessage(
        user.id,
        i18n.t('uz', 'vipExpires.text'),
        Markup.inlineKeyboard([
          Markup.callbackButton(i18n.t('uz', 'vipExpires.key'), 'vip'),
        ]).extra({ parse_mode: 'HTML' }),
      ),
    ),
  )
}
