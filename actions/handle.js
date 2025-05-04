// Math solver bot with fallback chain: Mathpix → Tesseract → GPTs → Others

const { ChatGPTAPI, ChatGPTUnofficialProxyAPI } = require('chatgpt')
const tesseract = require('node-tesseract-ocr')
const htmlToImage = require('../helpers/htmlToImage')
const { Markup } = require('telegraf')
const showView = require('./showView')
const User = require('../models/user')
const marked = require('marked')
const axios = require('axios')
const fs = require('fs')
const tmp = require('tmp')
const katex = require('katex')

marked.use({ tokenizer: { fences() {}, heading() {}, hr() {}, blockquote() {}, list() {}, def() {}, table() {}, lheading() {}, paragraph() {} } })

const escapeHTML = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
const parseText = (text) => marked.parse(text || '').replaceAll('<p>', '').replaceAll('</p>', '').replaceAll('<img', '')

const retryAndFallback = async (functions, maxRetries = 2) => {
  for (let fn of functions) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await fn()
        if (result && (typeof result === 'string' ? result.trim().length : true)) return result
      } catch (err) {
        console.warn(`⚠️ Fallback error [${fn.name || 'anonymous'}]:`, err.message)
      }
    }
  }
  return ''
}

const tryMultipleOCR = async (imageUrl, tmpFile) => {
  const ocrFallbacks = [
    async function mathpix() {
      const res = await axios.post(`https://api.mathpix.com/v3/text`,
        { src: imageUrl, formats: ['text'], include_latex: true },
        { headers: { app_id: process.env.MATHPIX_ID, app_key: process.env.MATHPIX_KEY } })
      return res.data.text
    },
    async function tesseractOCR() {
      try {
        return await tesseract.recognize(tmpFile.name, { lang: 'eng+rus+math' })
      } catch (err) {
        console.warn('⚠️ tesseractOCR error:', err.message)
        return ''
      }
    }
  ]
  return await retryAndFallback(ocrFallbacks)
}

const tryMultipleFallbacks = async (text) => {
  const aiFallbacks = [
    async () => new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4' }).sendMessage(text),
    async () => new ChatGPTAPI({ apiKey: process.env.OPENAI_API_KEY, model: 'gpt-3.5-turbo' }).sendMessage(text),
    async () => new ChatGPTAPI({ apiKey: process.env.FALLBACK_OPENAI_KEY }).sendMessage(text),
    async () => new ChatGPTUnofficialProxyAPI({ accessToken: process.env.UNOFFICIAL_TOKEN }).sendMessage(text),
    async () => await axios.post('https://generativelanguage.googleapis.com/v1beta3/models/text-bison-001:generateText', { prompt: { text } }, { headers: { Authorization: `Bearer ${process.env.GEMINI_KEY}` } }).then(r => ({ text: r.data.candidates?.[0]?.output || '' })),
    async () => await axios.post('https://openrouter.ai/api/chat', { messages: [{ role: 'user', content: text }] }, { headers: { Authorization: `Bearer ${process.env.OPENROUTER_KEY}` } }).then(r => ({ text: r.data.choices?.[0]?.message?.content || '' })),
    async () => await axios.post('https://api.deepinfra.com/v1/chat', { prompt: text }, { headers: { Authorization: `Bearer ${process.env.DEEPINFRA_KEY}` } }).then(r => ({ text: r.data.text || '' })),
    async () => await axios.post('https://api.together.xyz/completion', { prompt: text }, { headers: { Authorization: `Bearer ${process.env.TOGETHER_KEY}` } }).then(r => ({ text: r.data.choices?.[0]?.text || '' })),
    async () => await axios.post('https://api-inference.huggingface.co/models/bigscience/bloom', { inputs: text }, { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_KEY}` } }).then(r => ({ text: r.data[0]?.generated_text || '' })),
    async () => await axios.post('https://api.perplexity.ai/completion', { prompt: text }, { headers: { Authorization: `Bearer ${process.env.PERPLEXITY_KEY}` } }).then(r => ({ text: r.data.text || '' })),
    async () => await axios.post('https://api.cohere.ai/generate', { prompt: text }, { headers: { Authorization: `Bearer ${process.env.COHERE_KEY}` } }).then(r => ({ text: r.data.generations?.[0]?.text || '' })),
    async () => await axios.post('https://groq.com/api/generate', { prompt: text }, { headers: { Authorization: `Bearer ${process.env.GROQ_KEY}` } }).then(r => ({ text: r.data.response || '' })),
    async () => ({ text: `⚠️ Barcha AI xizmatlari ishlamadi.` })
  ]
  for (let fn of aiFallbacks) {
    try {
      const result = await fn()
      if (result?.text) return result
    } catch (e) {
      console.warn('⚠️ AI fallback error:', e.message)
    }
  }
  return null
}

const renderMathHTML = (text) => {
  try {
    return katex.renderToString(text, { throwOnError: false, output: 'html', displayMode: true })
  } catch (err) {
    console.warn('KaTeX error:', err.message)
    return `<pre style="font-size:16px">${escapeHTML(text)}</pre>`
  }
}

module.exports = async (ctx) => {
  const replyMessage = await ctx.replyWithHTML(ctx.i18n.t('generation'), {
    reply_to_message_id: ctx.message.message_id,
    allow_sending_without_reply: true
  })

  const editMessageText = async (text) =>
    ctx.telegram.editMessageText(ctx.chat.id, replyMessage.message_id, null, text, {
      parse_mode: 'HTML', disable_web_page_preview: true
    }).catch(console.error)

  let prompt = ctx.message.reply_to_message || ctx.message
  const image = prompt?.photo?.[prompt.photo.length - 1]?.file_id
  let text = prompt?.text || prompt?.caption || ''
  if (ctx.chat.type !== 'private') text = text?.split(' ').slice(1).join(' ')
  if (!text && !image) return ctx.replyWithHTML(ctx.i18n.t('noPrompt'))

  if (ctx.user.requests <= 0 && !(ctx.user.vip && ctx.user.vip > new Date())) {
    return ctx.replyWithHTML(
      ctx.i18n.t('noRequests.text'),
      Markup.inlineKeyboard([Markup.button.callback(ctx.i18n.t('noRequests.key'), 'vip')])
    )
  }

  if (image) {
    const fileLink = await ctx.telegram.getFile(image)
    const imageUrl = fileLink?.file_path ? `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${fileLink.file_path}` : null
    if (!imageUrl) return ctx.replyWithHTML('❌ Rasm havolasini olishda xatolik.')

    const tmpFile = tmp.fileSync({ postfix: '.jpg' })
    const writer = fs.createWriteStream(tmpFile.name)
    const response = await axios({ method: 'get', url: imageUrl, responseType: 'stream' }).catch(() => null)
    if (!response) return ctx.replyWithHTML('❌ Rasmni yuklab olishda xatolik.')

    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    const ocrText = await tryMultipleOCR(imageUrl, tmpFile)
    tmpFile.removeCallback()
    if (ocrText && typeof ocrText === 'string' && ocrText.trim().length > 3) {
      text = ocrText
    }
  }

  await User.updateOne({ id: ctx.user.id }, { $inc: { requests: -1 } })
  ctx.user.requests -= 1

  const result = await tryMultipleFallbacks(text)
  if (!result?.text) return editMessageText('❌ Barcha AI xizmatlari ishlamadi.')

  const trimmed = result.text.trim()
  const isMath = /^[\d\s\-+*/=.]+$/g.test(text.trim())
  const isShort = trimmed.length < 60 && /^[\d\s\-+*/=.]+$/.test(trimmed)

  const actions = [
    editMessageText(parseText(trimmed)),
    showView(ctx),
    ctx.user.requests >= 0 ? ctx.replyWithHTML(ctx.i18n.t('left', { n: ctx.user.requests })) : null
  ]

  if ((image || isMath) && isShort) {
    try {
      const html = `<!DOCTYPE html><html><head><meta charset='UTF-8'><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"></head><body><div style="font-size:18px; white-space:pre-wrap;">${renderMathHTML(trimmed)}</div></body></html>`
      const buffer = await htmlToImage(html)
      if (buffer instanceof Buffer) actions.push(ctx.replyWithPhoto({ source: buffer }))
    } catch (err) {
      console.warn('❌ Image rendering xatolik:', err.message)
    }
  }

  return Promise.all(actions.filter(Boolean))
}
