const { Markup } = require('telegraf')
const mathpixAPI = require('../helpers/mathpix')
const fs = require('fs').promises
const path = require('path')
const os = require('os')
const axios = require('axios')

/**
 * Rasmdan matn/formulalar tanib olish uchun funksiya
 */
module.exports = async (ctx) => {
  try {
    // Agar foydalanuvchi rasmni yuborib bo'lgan bo'lsa
    if (ctx.callbackQuery && ctx.callbackQuery.data === 'mathpix_cancel') {
      await ctx.answerCbQuery()
      return ctx.editMessageText(ctx.i18n.t('mathpix.canceled'))
    }

    // Rasm mavjudligini tekshirish
    let fileId
    let waitMsg

    if (ctx.message && ctx.message.photo) {
      fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id
      waitMsg = await ctx.reply(ctx.i18n.t('mathpix.processing'), {
        reply_to_message_id: ctx.message.message_id
      })
    } else if (ctx.message && ctx.message.document && ctx.message.document.mime_type.startsWith('image/')) {
      fileId = ctx.message.document.file_id
      waitMsg = await ctx.reply(ctx.i18n.t('mathpix.processing'), {
        reply_to_message_id: ctx.message.message_id
      })
    } else {
      return ctx.reply(ctx.i18n.t('mathpix.send_image'), {
        reply_markup: {
          force_reply: true,
          selective: true
        }
      })
    }

    // Faylni olish
    const fileLink = await ctx.telegram.getFileLink(fileId)
    
    // Rasmni yuklab olish
    const response = await axios({
      method: 'get',
      url: fileLink.href || fileLink,
      responseType: 'arraybuffer'
    })
    
    // Vaqtinchalik fayl yaratish
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `mathpix_${Date.now()}.jpg`)
    await fs.writeFile(tempFilePath, response.data)
    
    // Mathpix API ga yuborish
    const result = await mathpixAPI.processImageFromFile(tempFilePath)
    
    // Vaqtinchalik faylni o'chirish
    await fs.unlink(tempFilePath).catch(() => {})
    
    // Natijani javatish
    if (result.error) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        waitMsg.message_id,
        null,
        ctx.i18n.t('mathpix.error', { error: result.error })
      )
      return
    }
    
    // Agar latex formatli natija bo'lsa
    let resultText = ''
    
    if (result.latex_styled) {
      resultText += `<b>LaTeX:</b>\n<code>${result.latex_styled}</code>\n\n`
    }
    
    if (result.text) {
      resultText += `<b>Text:</b>\n${result.text}`
    }
    
    if (!resultText) {
      resultText = ctx.i18n.t('mathpix.no_text')
    }
    
    // Natijani yuborish
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      waitMsg.message_id,
      null,
      resultText,
      {
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
          Markup.callbackButton(ctx.i18n.t('back'), 'mathpix_cancel')
        ])
      }
    )
    
  } catch (error) {
    console.error('Mathpix xatolik:', error.message)
    
    // Xatolik xabarini foydalanuvchiga yuborish
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
      return ctx.editMessageText(ctx.i18n.t('mathpix.error', { error: error.message }))
    } else {
      return ctx.reply(ctx.i18n.t('mathpix.error', { error: error.message }))
    }
  }
}
