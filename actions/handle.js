const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

module.exports = async (ctx) => {
  try {
    const prompt = ctx.message.reply_to_message || ctx.message
    const image = prompt?.photo?.pop()?.file_id
    let text = prompt?.text || prompt?.caption

    if (ctx.chat.type !== 'private') {
      text = text?.split(' ').slice(1).join(' ')
    }

    if (image) {
      await ctx.reply('📷 Rasm tahlil qilinmoqda, iltimos kuting...')
      return await processImage(ctx, image)
    }

    if (!text) {
      return ctx.reply('❌ Matn kiritilmadi.')
    }

    if (!(await checkUserLimits(ctx))) return
    await ctx.replyWithChatAction('typing')

    const resultText = await getOpenAIResponse(text)
    const formattedResult = formatMathExpression(resultText)

    console.log('🔹 AI javobi:', formattedResult)

    if (!formattedResult)
      return ctx.reply(
        "❌ AI javob bera olmadi. pul to'lanmagan bo'lishi mumkun"
      )

    return ctx.reply(formattedResult)
  } catch (error) {
    console.error('❌ Xatolik:', error)
    return ctx.reply('❌ Xatolik yuz berdi. Keyinroq qayta urinib ko‘ring.')
  }
}

async function checkUserLimits(ctx) {
  return true
}

async function processImage(ctx, image) {
  try {
    const fileLink = await ctx.telegram.getFileLink(image)

    const result = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            `Sen fizik, matematik, algebrik, geometrik, astranomik va kimyoviy formulalarni tahlil qiladigan AI botsan. ` +
            `Biz yuborgan natijalaringni foydalanuvchiga to'g'ri shaklda ko'rsatamiz.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Ushbu rasm ichidagi misolni top va qisqacha natija hamda to‘liq izoh bilan qaytar.'
            },
            { type: 'image_url', image_url: { url: fileLink } }
          ]
        }
      ]
    })

    const resultText =
      result.choices[0]?.message?.content || '❌ AI javob bera olmadi.'
    console.log('🔹 AI natijasi:', formatMathExpression(resultText))
    await ctx.reply(formatMathExpression(resultText))
  } catch (error) {
    console.error('❌ Rasm tahlil qilishda xatolik:', error)
    return ctx.reply('❌ Rasmni tahlil qilishda xatolik yuz berdi.')
  }
}

async function getOpenAIResponse(text) {
  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Sen faqat matematik va kimyoviy formulalarni aniq shaklda yechadigan AI botsan. ' +
            'Faqat to‘g‘ri matematik yoki kimyoviy ifoda bilan javob ber, masalan: "H₂ + O₂ → H₂O". ' +
            'Qo‘shimcha izoh yozma, faqat aniq natijani chiqar.'
        },
        { role: 'user', content: text }
      ]
    })

    return result.choices[0]?.message?.content
  } catch (error) {
    console.error('❌ OpenAI xatosi:', error)
    return ''
  }
}

function formatMathExpression(text) {
  if (!text) return ''
  const subscriptMap = {
    0: '₀',
    1: '₁',
    2: '₂',
    3: '₃',
    4: '₄',
    5: '₅',
    6: '₆',
    7: '₇',
    8: '₈',
    9: '₉'
  }
  const superscriptMap = {
    0: '⁰',
    1: '¹',
    2: '²',
    3: '³',
    4: '⁴',
    5: '⁵',
    6: '⁶',
    7: '⁷',
    8: '⁸',
    9: '⁹',
    '+': '⁺',
    '-': '⁻'
  }

  return text
    .replace(/\\text\{(.*?)\}/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\\\[|\\\]/g, '')
    .replace(/\\\(|\\\)/g, '')
    .replace(/_(\d+)/g, (_, num) =>
      num
        .split('')
        .map((n) => subscriptMap[n] || n)
        .join('')
    )
    .replace(/\^(\d+|\+|\-)/g, (_, num) =>
      num
        .split('')
        .map((n) => superscriptMap[n] || n)
        .join('')
    )
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1)/($2)')
    .replace(/\\sum/g, '∑')
    .replace(/\\int/g, '∫')
    .replace(/\\approx/g, '≈')
    .replace(/\\neq/g, '≠')
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(
      /([A-Z][a-z]*)_(\d+)/g,
      (_, element, num) => `${element}${subscriptMap[num] || num}`
    )
    .replace(/\\\[|\\\]/g, '')
    .replace(/\\\(|\\\)/g, '')
    .replace(/\\mu_k/g, 'μₖ')
}
