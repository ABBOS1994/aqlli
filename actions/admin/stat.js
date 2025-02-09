const User = require('../../models/user')
const Deposit = require('../../models/deposit')
const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery('📊 Statistika tayyorlanmoqda, kuting...')

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0)
  const month = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 0, 0, 0, 0)

  const stats = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ alive: true }),
    User.countDocuments({ alive: true, subscribed: true }),
    User.countDocuments({ alive: true, lastMessage: { $gte: today } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: week } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: month } }),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ alive: true, createdAt: { $gte: today } }),
    User.countDocuments({ createdAt: { $gte: month } }),
    User.countDocuments({ alive: true, createdAt: { $gte: month } }),
    User.aggregate([
      { $match: { alive: true } },
      { $group: { _id: '$langCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: 'amount', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: today } } },
      { $group: { _id: 'amount', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: month } } },
      { $group: { _id: 'amount', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ])

  const [
    allUsers, aliveUsers, subscribedUsers, dailyActive, weeklyActive, monthlyActive,
    newToday, aliveNewToday, newMonthly, aliveNewMonthly, langStats,
    totalDeposits, dailyDeposits, monthlyDeposits,
  ] = stats

  const text = `
📊 <b>Bot statistikasi</b>

👥 <b>Foydalanuvchilar:</b>
- Jami: ${allUsers}
- Faol: ${aliveUsers} (${Math.round((aliveUsers / allUsers) * 100)}%)
- Obuna bo‘lgan: ${subscribedUsers} (${Math.round((subscribedUsers / aliveUsers) * 100)}%)

📈 <b>Faollik:</b>
- Kunlik faol foydalanuvchilar: ${dailyActive}
- Haftalik faol foydalanuvchilar: ${weeklyActive}
- Oylik faol foydalanuvchilar: ${monthlyActive}

🆕 <b>Yangi foydalanuvchilar:</b>
- Bugun: +${newToday} (Faol: +${aliveNewToday})
- Oylik: +${newMonthly} (Faol: +${aliveNewMonthly})

🌍 <b>Tillarga ko‘ra:</b>
${langStats.map(lang => `${lang._id?.toUpperCase()}: ${lang.count} (${Math.round((lang.count / aliveUsers) * 100)}%)`).join(', ')}

💰 <b>To‘lovlar:</b>
- Jami: ${totalDeposits[0]?.count || 0} ta tranzaksiya, ${totalDeposits[0]?.amount || 0} UZS
- Bugungi: ${dailyDeposits[0]?.count || 0} ta tranzaksiya, ${dailyDeposits[0]?.amount || 0} UZS
- Oylik: ${monthlyDeposits[0]?.count || 0} ta tranzaksiya, ${monthlyDeposits[0]?.amount || 0} UZS
  `

  return ctx.editMessageText(
    text,
    Markup.inlineKeyboard([
      [Markup.callbackButton('🔄 Yangilash', 'admin_stat')],
      [Markup.callbackButton('⬅️ Orqaga', 'admin_back')],
    ]).extra({ parse_mode: 'HTML' }),
  )
}
