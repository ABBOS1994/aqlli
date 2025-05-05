//helpers/atmos.js
const axios = require('axios')
const crypto = require('crypto')
const OAuth = require('./oauth')
const https = require('https')

/**
 * Atmos API bilan ishlash uchun yordamchi funksiyalar
 * Atmos.uz OAuth 1.0a bilan yangilangan
 */
class AtmosAPI {
  constructor() {
    // Atmos to'lov tizimi API manzillari
    this.apiUrl = 'https://api.atmos.uz' // Rasmiy to'lov API manzili

    // Store/Merchant ID
    this.storeId = '1961'

    // OAuth 1.0a konfiguratsiyasi
    this.oauth = new OAuth(
      'Vb7eMJzHros5E0vQIQtZL6U_ziAa', // Consumer key
      'i701e_cJQCZ6OfBfETk7B_TguZoa' // Consumer secret
    )

    this.httpClient = axios.create({
      timeout: 30000,
      maxRedirects: 3,
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: true,
        timeout: 30000,
        family: 4
      }),
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AtmosNodeClient/1.0'
      }
    })

    this.maxRetries = 3
  }

  getApiUrl(endpoint) {
    return `${this.apiUrl}/api${endpoint}`
  }

  async makeApiRequest(method, endpoint, options = {}) {
    const { data = {}, params = {}, retryCount = 0 } = options
    const serverUrl = this.getApiUrl(endpoint)

    const requestData = { ...data, merchant_id: this.storeId }
    const queryParams = { ...params, merchant_id: this.storeId }

    const authHeader = this.oauth.getAuthorizationHeader(
      method,
      serverUrl,
      method.toUpperCase() === 'GET' ? queryParams : requestData
    )

    try {
      const response = await this.httpClient({
        method: method.toLowerCase(),
        url: serverUrl,
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        params: method.toUpperCase() === 'GET' ? queryParams : {},
        data: method.toUpperCase() !== 'GET' ? requestData : undefined
      })

      return response.data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      const statusCode = error.response?.status
      const isConnectionError = [
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ECONNABORTED'
      ].includes(error.code)

      if (retryCount < this.maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        )
        return this.makeApiRequest(method, endpoint, {
          ...options,
          retryCount: retryCount + 1
        })
      }

      throw Object.assign(error, {
        details: {
          message: errorMessage,
          code: error.code || 'UNKNOWN_ERROR',
          statusCode: statusCode || 0,
          isTimeout: isConnectionError
        }
      })
    }
  }

  async createPayment(amount, description, returnUrl, orderId = null)
  {
    const paymentData = {
      amount,
      description,
      return_url: returnUrl,
      reference_id: this.generateReferenceId()
    }
    if (orderId) paymentData.order_id = orderId

    try {
      const response = await this.makeApiRequest('POST', '/payments/create', {
        data: paymentData
      })
      console.log('qarash kere: ', response)

      return response && response.payment_url
        ? response
        : {
            ...response,
            payment_url: null,
            error: 'No payment_url returned by API'
          }
    } catch (error) {
      return {
        payment_url: null,
        reference_id: paymentData.reference_id,
        error: error.message || 'Unknown error'
      }
    }
  }

  async getPaymentsHistory(from, to, limit = 10, offset = 0) {
    try {
      const response = await this.makeApiRequest('GET', '/payments/history', {
        params: { from, to, limit, offset }
      })
      return response && response.payments ? response : { payments: [] }
    } catch (error) {
      return {
        payments: [],
        error: {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR'
        }
      }
    }
  }

  async checkPayment(paymentId) {
    try {
      return await this.makeApiRequest('POST', '/payments/check', {
        data: { payment_id: paymentId }
      })
    } catch (error) {
      return { status: 'unknown', error: error.message }
    }
  }

  generateReferenceId() {
    const timestamp = Date.now().toString()
    const random = crypto.randomBytes(4).toString('hex')
    return `${timestamp}-${random}`
  }
}

module.exports = new AtmosAPI()
