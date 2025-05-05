let ChatGPTAPI
;(async () => {
  try {
    ChatGPTAPI = (await import('chatgpt')).ChatGPTAPI
    console.log('ChatGPT API moduli muvaffaqiyatli yuklandi')
  } catch (error) {
    console.error('ChatGPT API modulini yuklashda xatolik:', error.message)
  }
})()

const showView = require('./showView')

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis))

const User = require('../models/user')

// API kalitini tekshirish va validatsiya qilish
const validateApiKey = (apiKey) => {
  if (!apiKey) return false
  
  // OpenAI API kalitlari formatini tekshirish
  const isValidFormat = /^(sk-[a-zA-Z0-9]{32,}|sk-proj-[a-zA-Z0-9-_]{32,})$/.test(apiKey)
  
  if (!isValidFormat) {
    console.error('OpenAI API kaliti noto\'g\'ri formatda:', 
                 apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4))
  }
  
  return isValidFormat
}

const marked = require('marked')
marked.use({
  tokenizer: {
    fences() {},
    heading() {},
    hr() {},
    blockquote() {},
    list() {},
    def() {},
    table() {},
    lheading() {},
    paragraph() {}
  }
})
const parseText = (text, article) =>
  marked
    .parse(text)
    .replaceAll('<p>', '')
    .replaceAll('</p>', '')
    .replaceAll('<img', '')
    .replace(/Reshak.AI/gim, `<a href='${article}'>Reshak.AI</a>`)
    .replace(/chatgpt/gim, `<a href='${article}'>Reshak.AI</a>`)

const tesseract = require('node-tesseract-ocr')

const axios = require('axios')

const htmlToImage = require('../helpers/htmlToImage')

const { Markup } = require('telegraf')

module.exports = async (ctx) => {
  const editMessageText = async (text) =>
    ctx.telegram
      .editMessageText(ctx.chat.id, message.message_id, null, text, {
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
      .catch((err) => {
        console.error(err)
      })

  let prompt = ctx.message
  if (
    ctx.message.reply_to_message?.text ||
    ctx.message.reply_to_message?.caption
  )
    prompt = ctx.message.reply_to_message

  const image = prompt?.photo && prompt.photo[prompt.photo.length - 1].file_id
  let text = prompt?.text || prompt?.caption
  if (ctx.chat.type !== 'private') text = text.split(' ').slice(1).join(' ')

  if (!text && !image) return ctx.replyWithHTML(ctx.i18n.t('noPrompt'))

  const isPremium = ctx.user.vip && ctx.user.vip > new Date()

  if (ctx.user.requests <= 0 && !isPremium)
    return ctx.replyWithHTML(
      ctx.i18n.t('noRequests.text'),
      Markup.inlineKeyboard([
        Markup.callbackButton(ctx.i18n.t('noRequests.key'), 'vip')
      ]).extra()
    )

  const message = await ctx.replyWithHTML(ctx.i18n.t('generation'), {
    reply_to_message_id: ctx.message.message_id,
    allow_sending_without_reply: true
  })

  const math = image && ctx.state[1] === 'math'
  if (image) {
    const fileLink = await ctx.telegram.getFileLink(image)

    let result
    if (math) {
      const responce = await axios.post(
        `https://api.mathpix.com/v3/text`,
        {
          src: fileLink,
          formats: ['text'],
          include_detected_alphabets: true
        },
        {
          headers: {
            app_id: process.env.MATHPIX_ID,
            app_key: process.env.MATHPIX_KEY
          }
        }
      )

      result = responce.data.text
    } else
      result = await tesseract.recognize(fileLink, {
        lang: `rus`
      })
    console.log('OCR: ', result)

    text = result || '' + text || ''
  }

  await ctx.replyWithChatAction('typing')

  const entity = prompt.entities ? prompt.entities[0] : {}
  let conversationId
  let parentMessageId
  if (
    entity.offset === 0 &&
    entity.length === 1 &&
    entity.type === 'text_link'
  ) {
    ;[conversationId, parentMessageId] = entity.url
      .replace('http://noting.com/', '')
      .split('|||')
  }

  await User.updateOne({ id: ctx.user.id }, { $inc: { requests: -1 } })
  ctx.user.requests -= 1

  // API kalitini tekshirish
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const isValidApiKey = validateApiKey(openaiApiKey);
  
  if (!isValidApiKey) {
    console.error('OpenAI API kaliti noto\'g\'ri yoki yo\'q. Kalitni .env faylida tekshiring');
    await editMessageText(ctx.i18n.t('error', { error: 'API kaliti xatoligi. Administrator bilan bog\'laning.' }));
    await User.updateOne({ id: ctx.user.id }, { $inc: { requests: 1 } }); // Foydalanuvchiga so'rovni qaytarish
    ctx.user.requests += 1;
    return;
  }
  
  const api = new ChatGPTAPI({
    apiKey: openaiApiKey
  })

  const unofAPI = new ChatGPTAPI({
    apiKey: 'test',
    apiBaseUrl: 'http://31.222.229.214:8080/v1'
  })

  let lastMessageUpdate = new Date()

  const question = `${
    ctx.i18n.locale() === 'ru' && !conversationId
      ? ctx.i18n.t('promptPrefix', {
          date: new Date().toLocaleString()
        })
      : ''
  }${text}`
  let result
  try {
    // Norasmiy API orqali so'rov yuborish
    console.log('Norasmiy API orqali so\'rov yuborilmoqda...')
    result = await unofAPI.sendMessage(question, {
      conversationId,
      parentMessageId,
      onProgress: async (result) => {
        if (
          new Date() - lastMessageUpdate > 3000 &&
          result.text !== '' &&
          result.text !== question
        ) {
          lastMessageUpdate = new Date()
          await Promise.all([
            ctx.replyWithChatAction('typing'),
            editMessageText(
              `<a href='http://noting.com/${result.conversationId}|||${
                result.parentMessageId
              }'>‍</a>${parseText(result.text)}`
            )
          ])
        }
      }
    })
    console.log('Norasmiy API so\'rovi muvaffaqiyatli bajarildi')
  } catch (unofficialError) {
    console.error(`Norasmiy API xatoligi:`, unofficialError.message || unofficialError)
    
    try {
      // Rasmiy OpenAI API orqali so'rov yuborish
      console.log('Rasmiy OpenAI API orqali so\'rov yuborilmoqda...')
      result = await api.sendMessage(question, {
        conversationId,
        parentMessageId,
        onProgress: async (result) => {
          if (
            new Date() - lastMessageUpdate > 3000 &&
            result.text !== '' &&
            result.text !== question
          ) {
            lastMessageUpdate = new Date()
            await Promise.all([
              ctx.replyWithChatAction('typing'),
              editMessageText(
                `<a href='http://noting.com/${result.conversationId}|||${
                  result.parentMessageId
                }'>‍</a>${parseText(result.text)}`
              )
            ])
          }
        }
      })
      console.log('Rasmiy OpenAI API so\'rovi muvaffaqiyatli bajarildi')
    } catch (officialError) {
      console.error(`Rasmiy API xatoligi:`, officialError.message || officialError)
      
      // API xatoligi turini tekshirish
      let errorMessage = '';
      if (officialError.message && officialError.message.includes('401')) {
        errorMessage = 'API kalit xatoligi. Administrator bilan bog\'laning.';
        console.error('401 xatolik: API kaliti noto\'g\'ri yoki yaroqsiz');
      } else if (officialError.message && officialError.message.includes('429')) {
        errorMessage = 'API so\'rovlar limiti tugadi. Keyinroq urinib ko\'ring.';
      } else {
        errorMessage = 'Xatolik yuz berdi. Keyinroq urinib ko\'ring.';
      }
  
      // Foydalanuvchiga so'rovni qaytarish
      await User.updateOne({ id: ctx.user.id }, { $inc: { requests: 1 } })
      ctx.user.requests += 1
  
      return editMessageText(errorMessage)
    }
  }

  try {
    // Natijani Mathpix orqali konvertatsiya qilish
    const id = await axios.post(
      `https://api.mathpix.com/v3/converter`,
      {
        mmd: result.text,
        formats: { html: true }
      },
      {
        headers: {
          app_id: process.env.MATHPIX_ID,
          app_key: process.env.MATHPIX_KEY
        }
      }
    )
  
    await sleep(3000)
  
    const html = await axios.get(
      `https://api.mathpix.com/v3/converter/${id.data.conversion_id}.html`,
      {
        headers: {
          app_id: process.env.MATHPIX_ID,
          app_key: process.env.MATHPIX_KEY
        }
      }
    )
  
    const buffer = await htmlToImage(html.data)
    
    // Natijalarni yuborish
    return Promise.all([
      editMessageText(
        `<a href='http://noting.com/${result.conversationId}|||${
          result.parentMessageId
        }'>‍</a>${parseText(result.text)}`
      ),
      ctx.replyWithPhoto({ source: buffer }),
      showView(ctx),
      ctx.user.requests >= 0
        ? ctx.replyWithHTML(ctx.i18n.t('left', { n: ctx.user.requests }))
        : undefined
    ])
  } catch (mathpixError) {
    console.error('Mathpix konvertatsiya xatoligi:', mathpixError.message)
    
    // Rasm yaratish imkoni bo'lmasa, faqat matnni yuborish
    return Promise.all([
      editMessageText(
        `<a href='http://noting.com/${result.conversationId}|||${
          result.parentMessageId
        }'>‍</a>${parseText(result.text)}`
      ),
      showView(ctx),
      ctx.user.requests >= 0
        ? ctx.replyWithHTML(ctx.i18n.t('left', { n: ctx.user.requests }))
        : undefined
    ])
  }

  // Bu qism yuqoridagi try-catch ichiga ko'chirildi
}
