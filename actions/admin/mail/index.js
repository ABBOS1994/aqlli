const Markup = require('telegraf/markup')
const { ObjectId } = require('mongodb')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}

const statuses = {
  stopped: '⏹ Tarqatish to‘xtatildi',
  paused: '⏸ Tarqatish to‘xtatildi',
  ended: '📬 Tarqatish yakunlandi',
  doing: '🕒 Tarqatish davom etmoqda',
  notStarted: '🛠 Tarqatish hali boshlanmadi',
}

const progressBars = [
  '▓▓▓▓▓▓▓▓▓▓', '█▓▓▓▓▓▓▓▓▓', '██▓▓▓▓▓▓▓▓', '███▓▓▓▓▓▓▓',
  '████▓▓▓▓▓▓', '█████▓▓▓▓▓', '██████▓▓▓▓', '███████▓▓▓',
  '████████▓▓', '█████████▓', '██████████',
]

module.exports = async (ctx) => {
  try {
    let index = ctx.state[0] ? (!isNaN(ctx.state[0]) ? Number(ctx.state[0]) :
      (await ctx.Mail.countDocuments({ _id: { $gte: ObjectId(ctx.state[0]) } })) - 1) : 0

    if (index < 0) return ctx.answerCbQuery('Bunday amal mumkin emas!', true)

    const count = await ctx.Mail.countDocuments()
    if (index !== 0 && index + 1 > count) return ctx.answerCbQuery('Bunday amal mumkin emas!', true)

    await ctx.answerCbQuery()
    ctx.user.state = null

    if (count === 0) {
      return ctx.editMessageText('Hali hech qanday tarqatish mavjud emas.', {
        reply_markup: Markup.inlineKeyboard([
          [Markup.callbackButton('➕ Tarqatish qo‘shish', 'admin_mail_add')],
          [Markup.callbackButton('⬅️ Orqaga', 'admin_back')],
        ]),
        parse_mode: 'HTML',
      })
    }

    await ctx.deleteMessage().catch(() => {
    })
    const mail = await ctx.Mail.findOne().skip(index).sort({ _id: -1 })

    let extraKeyboard = [
      [
        Markup.callbackButton('◀️', `admin_mail_id_${index - 1}`),
        Markup.callbackButton('🔄', `admin_mail_id_${index}`),
        Markup.callbackButton('▶️', `admin_mail_id_${index + 1}`),
      ],
      [Markup.callbackButton(statuses[mail.status], 'admin_mail_none')],
    ]

    const progress = mail.all > 0 ? (mail.success + mail.unsuccess) / mail.all : 0
    const progressBar = progressBars[Math.round(progress * 10)] || progressBars[0]

    let startTimeInfo = ''
    if (mail.status === 'notStarted') {
      startTimeInfo = mail.startDate
        ? `<b>Boshlanish vaqti:</b> ${new Date(mail.startDate).toLocaleString('uz', dateConfig)}`
        : '<b>Boshlanish vaqti belgilanmagan</b>'
    } else if (mail.status !== 'completed') {
      startTimeInfo = `<b>📊 Jarayon:</b> [${progressBar}] - ${(mail.success + mail.unsuccess).toLocaleString()}/${mail.all.toLocaleString()} - ${Math.floor(progress * 100)}%`
    }

    const estimatedTime = new Date()
    estimatedTime.setSeconds(
      estimatedTime.getSeconds() + (mail.all - mail.success - mail.unsuccess) * 0.016,
    )

    const text = `
<b>${statuses[mail.status]}</b>

${startTimeInfo}

<b>📈 Statistika:</b>
✅ Muvaffaqiyatli: ${mail.success.toLocaleString()}
❌ Muvaffaqiyatsiz: ${mail.unsuccess.toLocaleString()}

${
      mail.status === 'doing'
        ? `<b>⌛️ Tugash vaqti:</b> ≈${Math.round((estimatedTime - new Date()) / (1000 * 60))} daqiqa`
        : mail.status !== 'notStarted'
        ? `<b>🕰 Davomiyligi:</b> ${Math.round(((mail.endDate ? new Date(mail.endDate) : new Date()) - new Date(mail.startDate)) / (1000 * 60))} daqiqa`
        : ''
    }
`

    return ctx.replyWithHTML(text, {
      reply_markup: Markup.inlineKeyboard(extraKeyboard),
      disable_web_page_preview: !mail.preview,
    })

  } catch (error) {
    console.error('❌ Xatolik:', error)
    return ctx.answerCbQuery('❌ Xatolik yuz berdi!')
  }
}
