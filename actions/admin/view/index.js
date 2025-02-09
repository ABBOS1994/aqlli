const { Markup } = require('telegraf')
const { ObjectId } = require('mongodb')

const dateConfig = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
}

const statuses = {
  notStarted: '🛠 Ko‘rishlar hali boshlanmagan',
  doing: '🕒 Ko‘rishlar davom etmoqda',
  ended: '📬 Ko‘rishlar tugallandi',
}

module.exports = async (ctx) => {
  let a

  if (!ctx.state[0]) a = 0
  else if (isNaN(ctx.state[0])) {
    a =
      (await ctx.View.countDocuments({
        _id: { $gte: ObjectId(ctx.state[0]) },
      })) - 1
  } else a = Number(ctx.state[0])

  if (a < 0) return ctx.answerCbQuery('⛔️ Chegara!')

  const count = await ctx.View.countDocuments()
  if (a !== 0 && a + 1 > count) return ctx.answerCbQuery('⛔️ Chegara!')

  await ctx.answerCbQuery()
  ctx.user.state = null

  if (count === 0) {
    return ctx.editMessageText('⚠️ Ko‘rishlar mavjud emas.', {
      reply_markup: Markup.inlineKeyboard([
        [Markup.callbackButton('➕ Qo‘shish', 'admin_view_add')],
        [Markup.callbackButton('🔙 Ortga', 'admin_back')],
      ]),
      parse_mode: 'HTML',
    })
  } else {
    await ctx.deleteMessage()
    const result = await ctx.View.findOne().skip(a).sort({ _id: -1 })

    if (ctx.state[1]) {
      const index = Object.keys(statuses).indexOf(result.status) + 1
      const length = Object.keys(statuses).length
      const pureIndex = index % length

      result.status =
        Object.keys(statuses)[pureIndex >= 0 ? pureIndex : length + pureIndex]
      await result.save()
    }

    let extraKeyboard = [
      [
        Markup.callbackButton('◀️', `admin_view_id_${a - 1}`),
        Markup.callbackButton(`${a + 1}/${count} 🔄`, `admin_view_id_${a}`),
        Markup.callbackButton('▶️', `admin_view_id_${a + 1}`),
      ],
      [
        Markup.callbackButton(
          `👉 ${statuses[result.status]} 👈`,
          `admin_view_id_${a}_${result._id}`,
        ),
      ],
    ]

    if (result.status === 'notStarted') {
      extraKeyboard = extraKeyboard.concat([
        [
          Markup.callbackButton(
            `🔘 Tugmalar ${result.keyboard.length ? '✅' : '❌'}`,
            `admin_view_keyboard_${result._id}`,
          ),
          Markup.callbackButton('🗑 O‘chirish', `admin_view_keyboard_${result._id}_del`),
        ],
        [
          Markup.callbackButton(
            `🕓 Boshlanish vaqti ${
              result.startDate
                ? new Date(result.startDate).toLocaleString('uz', dateConfig)
                : '❌'
            }`,
            `admin_view_startDate_${result._id}`,
          ),
          Markup.callbackButton('🗑 O‘chirish', `admin_view_startDate_${result._id}_del`),
        ],
        [
          Markup.callbackButton(
            `🕤 Tugash vaqti ${
              result.endDate
                ? new Date(result.endDate).toLocaleString('uz', dateConfig)
                : '❌'
            }`,
            `admin_view_endDate_${result._id}`,
          ),
          Markup.callbackButton('🗑 O‘chirish', `admin_view_endDate_${result._id}_del`),
        ],
        [
          Markup.callbackButton(
            `🫂 Maksimal soni ${result.quantity === 0 ? '♾️' : result.quantity}`,
            `admin_view_quantity_${result._id}`,
          ),
          Markup.callbackButton('🗑 O‘chirish', `admin_view_quantity_${result._id}_del`),
        ],
        [
          Markup.callbackButton(
            `🏳️ Til ${result.lang === null ? 'Barcha' : result.lang}`,
            `admin_view_lang_${result._id}`,
          ),
          Markup.callbackButton('🗑 O‘chirish', `admin_view_lang_${result._id}_del`),
        ],
        [
          Markup.callbackButton(
            `🌐 Preview ${result.preview ? '✅' : '❌'}`,
            `admin_view_preview_${result._id}`,
          ),
          Markup.callbackButton(
            `✉️ Unikal ${result.unique ? '✅' : '❌'}`,
            `admin_view_unique_${result._id}`,
          ),
          Markup.callbackButton(
            '📃 Postni o‘zgartirish',
            `admin_view_editPost_${result._id}`,
          ),
        ],
      ])
    }

    if (['doing', 'ended'].includes(result.status)) {
      extraKeyboard = extraKeyboard.concat([
        [
          Markup.callbackButton(
            `👁 Ko‘rishlar soni: ${result.views}`,
            'admin_view_none',
          ),
        ],
      ])
    }

    extraKeyboard = extraKeyboard.concat([
      [
        Markup.switchToChatButton('✈️ Ulashish', `view_${result._id}`),
        Markup.callbackButton('🗑 O‘chirish', `admin_view_delete_${result._id}`),
      ],
      [
        Markup.callbackButton('➕ Ko‘rish qo‘shish', 'admin_view_add'),
        Markup.callbackButton('🔙 Ortga', 'admin_back'),
      ],
    ])

    const keyboard = result.keyboard.concat(extraKeyboard)
    delete result.message.chat

    return ctx.telegram.sendCopy(ctx.from.id, result.message, {
      reply_markup: Markup.inlineKeyboard(keyboard),
      disable_web_page_preview: !result.preview,
    })
  }
}
