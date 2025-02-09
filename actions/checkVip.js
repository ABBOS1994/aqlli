const User = require('../models/user')
const { Markup } = require('telegraf')

module.exports = async (bot, i18n) => {
  try {
    const now = new Date()
    const minuteLast = new Date(now.getTime() - 60000) // 1 daqiqa oldingi vaqt

    // VIP muddati tugayotgan foydalanuvchilarni olish
    const users = await User.find({
      vip: { $gte: minuteLast, $lte: now },
    })

    if (users.length === 0) return

    // Foydalanuvchilarga VIP tugayotgani haqida xabar yuborish
    await Promise.all(
      users.map((user) =>
        bot.telegram.sendMessage(
          user.id,
          i18n.t('uz', 'Sizning VIP obunangiz tugash arafasida. Uni yangilashni unutmang!'),
          {
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
              Markup.callbackButton(i18n.t('uz', 'VIPni yangilash'), 'vip'),
            ]),
          },
        ),
      ),
    )

    console.log(`✅ ${users.length} foydalanuvchiga VIP muddati haqida xabar yuborildi.`)
  } catch (error) {
    console.error(`❌ Xatolik yuz berdi: ${error.message}`)
  }
}
