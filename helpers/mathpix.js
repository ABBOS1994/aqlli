const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs').promises

/**
 * Mathpix API bilan ishlash uchun yordamchi funksiyalar
 */
class MathpixAPI {
  constructor() {
    this.baseUrl = 'https://api.mathpix.com/v3'
    this.headers = {
      'app_id': process.env.MATHPIX_APP_ID,
      'app_key': process.env.MATHPIX_APP_KEY
    }
  }

  /**
   * Rasmdan matnni aniqlash
   * @param {string} imageBuffer - Rasm buffer yoki base64 formatida
   * @param {Object} options - Qo'shimcha parametrlar
   * @returns {Promise<Object>} - Aniqlangan matn ma'lumotlarini qaytaradi
   */
  async processImage(imageBuffer, options = {}) {
    try {
      const defaultOptions = {
        formats: ['text', 'data', 'latex_styled'],
        include_line_data: true,
        include_asciimath: true
      }
      
      const requestOptions = { ...defaultOptions, ...options }
      
      let data
      let headers = { ...this.headers }
      
      // Agar imageBuffer base64 formatida bo'lsa
      if (typeof imageBuffer === 'string' && imageBuffer.startsWith('data:image')) {
        // base64 formatidan URL formatiga o'tkazamiz
        data = {
          src: imageBuffer,
          ...requestOptions
        }
        headers['Content-Type'] = 'application/json'
      } else {
        // Agar imageBuffer fayl yo'li bo'lsa, FormData yaratamiz
        const formData = new FormData()
        formData.append('file', imageBuffer)
        
        // FormData ga options qo'shamiz
        Object.keys(requestOptions).forEach(key => {
          if (Array.isArray(requestOptions[key])) {
            requestOptions[key].forEach(value => {
              formData.append(`${key}[]`, value)
            })
          } else {
            formData.append(key, requestOptions[key])
          }
        })
        
        data = formData
        headers = {
          ...headers,
          ...formData.getHeaders()
        }
      }
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/text`,
        headers,
        data
      })
      
      return response.data
    } catch (error) {
      console.error('Mathpix rasmni qayta ishlashda xatolik:', error.message)
      if (error.response) {
        console.error('Response data:', error.response.data)
      }
      throw error
    }
  }

  /**
   * Fayl yo'lidan rasmni qayta ishlash
   * @param {string} filePath - Rasm fayl yo'li
   * @param {Object} options - Qo'shimcha parametrlar
   * @returns {Promise<Object>} - Aniqlangan matn ma'lumotlarini qaytaradi
   */
  async processImageFromFile(filePath, options = {}) {
    try {
      const imageBuffer = await fs.readFile(filePath)
      return this.processImage(imageBuffer, options)
    } catch (error) {
      console.error(`Mathpix faylni o'qishda xatolik: ${filePath}`, error.message)
      throw error
    }
  }

  /**
   * URL dan rasmni qayta ishlash
   * @param {string} imageUrl - Rasm URL manzili
   * @param {Object} options - Qo'shimcha parametrlar
   * @returns {Promise<Object>} - Aniqlangan matn ma'lumotlarini qaytaradi
   */
  async processImageFromUrl(imageUrl, options = {}) {
    try {
      const data = {
        src: imageUrl,
        ...options
      }
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/text`,
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        },
        data
      })
      
      return response.data
    } catch (error) {
      console.error('Mathpix URL dan rasmni qayta ishlashda xatolik:', error.message)
      if (error.response) {
        console.error('Response data:', error.response.data)
      }
      throw error
    }
  }
}

module.exports = new MathpixAPI()
