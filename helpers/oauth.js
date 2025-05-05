//helpers/oauth.js
const crypto = require('crypto')

/**
 * OAuth 1.0a imzolari yaratish uchun yordamchi funksiya
 * Atmos.uz to'lov tizimiga mos ravishda optimallashtirilgan
 */
class OAuth {
  constructor(consumerKey, consumerSecret, tokenSecret = '') {
    this.consumerKey = consumerKey
    this.consumerSecret = consumerSecret
    this.tokenSecret = tokenSecret
  }

  /**
   * OAuth 1.0a imzosini yaratish uchun funksiya
   * @param {string} method - HTTP metodi (GET, POST, PUT, DELETE)
   * @param {string} url - To'liq URL manzili (domen va yo'l, parametrlarsiz)
   * @param {Object} parameters - So'rov parametrlari va ma'lumotlari
   * @returns {string} - OAuth Authorization header qiymati
   */
  getAuthorizationHeader(method, url, parameters = {}) {
    // OAuth asosiy parametrlarini yaratish
    const oauthParams = {
      oauth_consumer_key: this.consumerKey,
      oauth_nonce: this.generateNonce(),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_version: '1.0'
    }

    // URL manzildan domen va yo'lni ajratib olish (query parametrlarsiz)
    const urlObj = new URL(url)
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`
    
    // So'rov URL parametrlarini ajratib olish
    const urlParams = {}
    if (urlObj.search) {
      for (const [key, value] of urlObj.searchParams.entries()) {
        urlParams[key] = value
      }
    }
    
    // Barcha parametrlarni birlashtirish
    const allParams = { ...parameters, ...urlParams, ...oauthParams }
    
    // Parametrlarni saralash va string formatga o'tkazish
    const paramString = this.createParamString(allParams)
    
    // Asosiy imzo uchun string yaratish
    const baseString = [
      method.toUpperCase(),
      this.percentEncode(baseUrl),
      this.percentEncode(paramString)
    ].join('&')
    
    // Imzo kalitini yaratish
    const signingKey = `${this.percentEncode(this.consumerSecret)}&${this.percentEncode(this.tokenSecret)}`
    
    // Imzoni yaratish
    const signature = crypto
      .createHmac('sha1', signingKey)
      .update(baseString)
      .digest('base64')
    
    // OAuth headerga imzoni qo'shish
    oauthParams.oauth_signature = signature
    
    // Header formatini tayyorlash
    const headerParts = Object.keys(oauthParams).map(key => {
      return `${this.percentEncode(key)}="${this.percentEncode(oauthParams[key])}"`
    })
    
    return `OAuth ${headerParts.join(', ')}`
  }

  /**
   * Tasodifiy nonce yaratish
   * Atmos talablariga ko'ra RFC-compliant
   */
  generateNonce() {
    // UUID v4 formatidagi tasodifiy qiymat - barcha qurilmalarda ishlaydi
    return 'n' + crypto.randomUUID().replace(/-/g, '')
  }

  /**
   * Parametrlar stringini yaratish uchun funksiya
   * Atmos.uz uchun optimallashtirilgan
   */
  createParamString(params) {
    // Parametrlarni ASCII tartibida saralash (OAuth1.0a spec)
    return Object.keys(params)
      .sort()
      .map(key => {
        // null/undefined qiymatlarni e'tiborga olmaslik
        if (params[key] === null || params[key] === undefined) return '';
        return `${this.percentEncode(key)}=${this.percentEncode(params[key].toString())}`
      })
      .filter(pair => pair !== '') // Bo'sh qiymatlarni filtrlash
      .join('&')
  }

  /**
   * OAuth 1.0a uchun URL enkoding (RFC 3986 ga muvofiq)
   * Atmos talablari uchun to'g'ri format
   */
  percentEncode(str) {
    if (!str) return '';
    
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/\*/g, '%2A')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\+/g, '%20') // + belgisi %20 ga o'zgartirilishi kerak
  }
}
  
module.exports = OAuth
