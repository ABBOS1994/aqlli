const { Markup } = require('telegraf')
const XlsxStreamWriter = require('xlsx-stream-writer')
const User = require('../models/user')

module.exports = async (ctx) => {
  try {
    if (ctx.callbackQuery) await ctx.answerCbQuery()

    if (ctx.state[0] === 'list') {
      const referrals = await User.find({ from: `r-${ctx.from.id}` })

      if (!referrals.length) {
        return ctx.reply('❌ Sizning referallingiz yo‘q.')
      }

      const rows = [
        ['ID', 'Ism', 'Foydalanuvchi nomi', 'Depozit', 'Ro‘yxatdan o‘tgan sana'],
      ]

      referrals.forEach((user) => {
        rows.push([
          user.id,
          user.name || 'Noma\'lum',
          user.username ? `@${user.username}` : 'Noma\'lum',
          user.deposit || 0,
          user.createdAt.toLocaleString('uz-UZ'),
        ])
      })

      const xlsx = new XlsxStreamWriter()
      xlsx.addRows(rows)

      return xlsx.getFile().then((buffer) =>
        ctx.replyWithDocument({
          source: buffer,
          filename: `referallar.xlsx`,
        }),
      )
    }

    if (ctx.state[0] === 'withdraw') {
      return ctx.editMessageText(
        '💰 Pul yechib olish uchun quyidagi havolaga o‘ting:',
        Markup.inlineKeyboard([
          [Markup.button.url('🔗 Pul yechib olish', 'https://t.me/support')],
          [Markup.button.callback('🔙 Orqaga', 'partner')],
        ]),
      )
    }

    const refLink = `https://t.me/${process.env.BOT_USERNAME}?start=r-${ctx.from.id}`

    const messageText = `
      🤝 *Hamkorlik dasturi*
      ───────────────────
      🏷️ *Referallar soni:* ${ctx.user.refCount}
      💰 *Topilgan daromad:* ${ctx.user.earned.toLocaleString()} so‘m
      🔻 *Yechildi:* ${ctx.user.withdraw.toLocaleString()} so‘m
      🔼 *Qolgan:* ${(ctx.user.earned - ctx.user.withdraw).toLocaleString()} so‘m
      ───────────────────
      📩 *Referal havolangiz:* [Referal orqali qo‘shilish](${refLink})
    `

    return ctx[ctx.message ? 'replyWithMarkdownV2' : 'editMessageText'](messageText, {
      parse_mode: 'MarkdownV2',
      disable_web_page_preview: true,
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📜 Referallar ro‘yxati', 'partner_list')],
        [Markup.button.callback('💸 Pul yechib olish', 'partner_withdraw')],
      ]),
    })

  } catch (error) {
    console.error('[❌] Partner xatosi:', error)
    return ctx.reply('❌ Xatolik yuz berdi, qayta urinib ko‘ring!')
  }
}
