const Ref = require('../../models/ref')
const User = require('../../models/user')
const Markup = require('telegraf/markup')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}

const defaultShift = 20

module.exports = async (ctx) => {
  if (!ctx.state[0]) ctx.state[0] = 0

  if (ctx.message?.text && ctx.state[1] === 'price') {
    ctx.user.state = null
    await Ref.updateOne({ name: ctx.state[0] }, { price: ctx.message.text })
  }

  if (isNaN(ctx.state[0]) || Number(ctx.state[0]) > 10000) {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    if (ctx.state[1] === 'price' && ctx.callbackQuery) {
      ctx.user.state = `admin_sysRef_${ctx.state[0]}_price`

      return ctx.editMessageText(
        '💰 Narxni kiriting:',
        Markup.inlineKeyboard([
          [Markup.callbackButton('🔙 Orqaga', `admin_sysRef_${ctx.state[0]}`)],
        ]).extra({ parse_mode: 'HTML' }),
      )
    }

    const [result, alive, subscribed, deposited] = await Promise.all([
      Ref.findOne({ name: ctx.state[0] }),
      User.countDocuments({ from: `ref-${ctx.state[0]}`, alive: true }),
      User.countDocuments({ from: `ref-${ctx.state[0]}`, subscribed: true }),
      User.countDocuments({ from: `ref-${ctx.state[0]}`, deposit: { $gt: 0 } }),
    ])

    return ctx[ctx.message ? 'reply' : 'editMessageText'](
      `
📊 **Statistika:**
🔗 Havoladan foydalanganlar: ${result.count.format(0)}
🔎 Unikal o‘tishlar: ${result.uniqueCount.format(0)} (${Math.round(
        (result.uniqueCount / result.count) * 100,
      )}%)
🆕 Yangi foydalanuvchilar: ${result.newCount.format(0)} (${Math.round(
        (result.newCount / result.uniqueCount) * 100,
      )}%)
✅ Obuna bo‘lganlar: ${subscribed.format(0)} (${Math.round(
        (subscribed / result.newCount) * 100,
      )}%)
💰 To‘lov qilganlar: ${deposited.format(0)} (${Math.round(
        (deposited / result.newCount) * 100,
      )}%)
👤 Aktiv foydalanuvchilar: ${alive.format(0)} (${Math.round(
        (alive / result.newCount) * 100,
      )}%)

🕰 **Birinchi o‘tish:** ${new Date(result.first).toLocaleString(
        'uz',
        dateConfig,
      )}
🕰 **Oxirgi o‘tish:** ${new Date(result.last).toLocaleString(
        'uz',
        dateConfig,
      )}

🔗 **Havola:** [T.me/${process.env.BOT_USERNAME}?start=ref-${result.name}](https://t.me/${process.env.BOT_USERNAME}?start=ref-${result.name})
`,
      Markup.inlineKeyboard([
        [Markup.callbackButton('💰 Narxni o‘zgartirish', `admin_sysRef_${result.name}_price`)],
        [Markup.callbackButton('🔄 Yangilash', `admin_sysRef_${result.name}`)],
        [Markup.callbackButton('🔙 Orqaga', 'admin_sysRef')],
      ]).extra({
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    )
  }

  const shift = Number(ctx.state[0])
  const count = await Ref.countDocuments()

  if (!count) {
    return ctx.editMessageText(
      `⚠️ Hozircha referal havolalar mavjud emas.\n\n💡 Havola yaratish uchun quyidagi formatdan foydalaning:\n\`https://t.me/${process.env.BOT_USERNAME}?start=ref-KOD\`\nBu havola orqali foydalanuvchilar tizimga qo‘shiladi.`,
      Markup.inlineKeyboard([
        Markup.callbackButton('🔙 Orqaga', 'admin_back'),
      ]).extra({
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    )
  }

  if (shift < 0 || shift >= count) return ctx.answerCbQuery('❌ Boshqa ma’lumot yo‘q!', true)
  await ctx.answerCbQuery()

  const results = await Ref.find().skip(shift).limit(defaultShift).sort({ _id: -1 })

  const content = results.map(
    (result) =>
      `🔹 **${result.name}**: ${result.count} / ${result.uniqueCount}`,
  )

  const keyboard = results.map((result) =>
    Markup.callbackButton(`${result.name} (${result.count})`, `admin_sysRef_${result.name}`),
  )

  return ctx.editMessageText(
    `
📋 **Referal havolalar:**
\`https://t.me/${process.env.BOT_USERNAME}?start=ref-\`KOD

${content.join('\n')}
`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: Markup.inlineKeyboard(keyboard, {
          columns: 2,
        }).inline_keyboard.concat([
          [
            Markup.callbackButton('◀️', `admin_sysRef_${shift - defaultShift}`),
            Markup.callbackButton(`${shift + results.length}/${count} 🔄`, `admin_sysRef_${shift}`),
            Markup.callbackButton('▶️', `admin_sysRef_${shift + defaultShift}`),
          ],
          [Markup.callbackButton('🔙 Orqaga', 'admin_back')],
        ]),
      },
    },
  )
}
