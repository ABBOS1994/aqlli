const User = require('../../models/user')
const Deposit = require('../../models/deposit')

const Markup = require('telegraf/markup')

module.exports = async (ctx) => {
  await ctx.answerCbQuery(`Получаю статистику, ожидайте`)

  const now = new Date()
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0,
  )
  const yesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    0,
    0,
    0,
    0,
  )
  const week = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 7,
    0,
    0,
    0,
    0,
  )
  const month = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 30,
    0,
    0,
    0,
    0,
  )

  const promises = [
    User.countDocuments(),
    User.countDocuments({ alive: true }),
    User.countDocuments({ alive: true, subscribed: true }),

    User.countDocuments({ alive: true, lastMessage: { $gte: today } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: week } }),
    User.countDocuments({ alive: true, lastMessage: { $gte: month } }),

    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ alive: true, createdAt: { $gte: today } }),

    User.countDocuments({ createdAt: { $gte: yesterday, $lte: today } }),
    User.countDocuments({
      alive: true,
      createdAt: { $gte: yesterday, $lte: today },
    }),

    User.countDocuments({ createdAt: { $gte: month } }),
    User.countDocuments({ alive: true, createdAt: { $gte: month } }),

    User.aggregate([
      { $match: { alive: true } },
      { $group: { _id: '$langCode', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Deposit.aggregate([
      { $match: { status: 'paid' } },
      { $project: { amount: 1 } },
      {
        $group: {
          _id: 'amount',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: today } } },
      { $project: { amount: 1 } },
      {
        $group: {
          _id: 'amount',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: week } } },
      { $project: { amount: 1 } },
      {
        $group: {
          _id: 'amount',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: month } } },
      { $project: { amount: 1 } },
      {
        $group: {
          _id: 'amount',
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
    Deposit.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$per', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]

  const [
    all,
    alive,
    subscribed,
    dau,
    wau,
    mau,
    forDay,
    aliveForDay,
    forYesterday,
    aliveForYesterday,
    forMonth,
    aliveForMonth,
    langCodes,
    deposit,
    depositForDay,
    depositForWeek,
    depositForMonth,
    depositByPer,
  ] = await Promise.all(promises)

  const text = `
📊 <b>Статистика</b>

<b>Пользователей:</b>
Всего: ${all.format(0)}
Живых: ${alive.format(0)} (${Math.round((alive / all) * 100)}%)
Прошедщих ОП: ${subscribed.format(0)} (${Math.round(
    (subscribed / alive) * 100,
  )}%)

DAU: ${dau.format(0)} (${Math.round((dau / wau) * 100)}%)
WAU: ${wau.format(0)} (${Math.round((wau / mau) * 100)}%)
MAU: ${mau.format(0)} (${Math.round((mau / alive) * 100)}%)

Сегодня: +${forDay.format(0)} (+${aliveForDay.format(0)})
Вчера: +${forYesterday.format(0)} (+${aliveForYesterday.format(0)})
Месяц: +${forMonth.format(0)} (+${aliveForMonth.format(0)}) 

Языки: ${langCodes
    .filter((lang) => lang.count > (langCodes[0].count / 100) * 1)
    .map(
      (lang) =>
        `${lang._id?.toUpperCase()}: ${lang.count.format(0)} (${Math.round(
          (lang.count / alive) * 100,
        )}%)`,
    )
    .join(', ')}

<b>Платежей:</b>
Депозитов: ${deposit[0]?.count.format(0) || 0} на ${
    deposit[0]?.amount.format(0) || 0
  } UZS (${Math.round((deposit[0]?.count / alive) * 100) || 0}%)
Сегодня: ${depositForDay[0]?.count.format(0) || 0} на ${
    depositForDay[0]?.amount.format(0) || 0
  } UZS (${
    Math.round((depositForDay[0]?.count / depositForWeek[0]?.count) * 100) || 0
  }%)
Неделя: ${depositForWeek[0]?.count.format(0) || 0} на ${
    depositForWeek[0]?.amount.format(0) || 0
  } UZS (${
    Math.round((depositForWeek[0]?.count / depositForMonth[0]?.count) * 100) ||
    0
  }%)
Месяц: ${depositForMonth[0]?.count.format(0) || 0} на ${
    depositForMonth[0]?.amount.format(0) || 0
  } UZS (${
    Math.round((depositForMonth[0]?.count / deposit[0]?.count) * 100) || 0
  }%)
Типы подписки (в часах): ${depositByPer
    .map(
      (lang) =>
        `${lang._id?.toUpperCase()}: ${lang.count.format(0)} (${Math.round(
          (lang.count / deposit[0]?.count) * 100,
        )}%)`,
    )
    .join(', ')}`

  return ctx.editMessageText(
    text,
    Markup.inlineKeyboard([
      [Markup.callbackButton('Обновить', 'admin_stat')],
      [Markup.callbackButton('‹ Назад', 'admin_back')],
    ]).extra({ parse_mode: 'HTML' }),
  )
}
