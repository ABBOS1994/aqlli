const { Markup } = require('telegraf')
const Mail = require('../../../models/mail')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}

const statuses = {
  stopped: '⏹ Jo‘natish to‘xtatildi',
  paused: '⏸ Jo‘natish to‘xtatib qo‘yildi',
  ended: '📬 Jo‘natish tugallandi',
  doing: '🕒 Jo‘natish davom etmoqda',
  notStarted: '🛠 Jo‘natish hali boshlanmadi',
}

const progressBars = [
  '░░░░░░░░░░',
  '█░░░░░░░░░',
  '██░░░░░░░░',
  '███░░░░░░░',
  '████░░░░░░',
  '█████░░░░░',
  '██████░░░░',
  '███████░░░',
  '████████░░',
  '█████████░',
  '██████████',
]

module.exports = async (ctx) => {
  await ctx.answerCbQuery()
  const mail = await Mail.findById(ctx.state[0])

  if (!mail) {
    return ctx.editMessageText('❌ Xatolik: Jo‘natish topilmadi.')
  }

  const completed = mail.success + mail.unsuccess
  const progress = completed / mail.all
  const remainingTime = Math.round(
    ((mail.all - completed) * 0.016 * 60) / 60,
  ) // daqiqaga o‘girilgan

  let result = `${statuses[mail.status]}\n\n`

  if (mail.status === 'notStarted') {
    result += mail.startDate
      ? `📅 Rejalashtirilgan vaqt: ${new Date(mail.startDate).toLocaleString(
        'uz-UZ',
        dateConfig,
      )}`
      : '⏳ Rejalashtirilmagan'
  } else {
    result += `${
      mail.status !== 'completed'
        ? `🏃 Progress: [${progressBars[Math.round(progress * 10)]}] - ${completed}/${mail.all} - ${Math.floor(
        progress * 100,
        )}%\n\n`
        : ''
    }📊 Statistika:\n📬 Muvaffaqiyatli: ${mail.success}\n📭 Muvaffaqiyatsiz: ${
      mail.unsuccess
    }\n\n`

    if (ctx.from.id === Number(process.env.DEV_ID)) {
      result += `⚠️ Xatoliklar: ${Object.entries(mail.errorsCount)
        .map(([key, value]) => `${key} - ${value}`)
        .join(', ')}\n\n`
    }

    if (mail.status === 'doing') {
      result += `⌚️ Tugashiga taxminan ${remainingTime} min. qoldi\n`
    } else if (mail.status !== 'notStarted') {
      const duration = Math.round(
        ((mail.endDate ? new Date(mail.endDate) : new Date()) -
          new Date(mail.startDate)) /
        (1000 * 60),
      )
      result += `🕰 Davomiyligi: ${duration} min.\n`
    }
  }

  return ctx.editMessageText(result, {
    parse_mode: 'HTML',
    reply_markup: Markup.inlineKeyboard([
      Markup.callbackButton('🔄 Yangilash', `inlineUpdateMail_${mail._id}`),
    ]),
  })
}
