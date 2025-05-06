const axios = require('axios')
const OAuth = require('./oauth')
const https = require('https')

class AtmosAPI {
  constructor() {
    this.partnerUrl = 'https://partner.atmos.uz'
    this.storeId = process.env.ATMOS_STORE_ID

    this.oauth = new OAuth(
      process.env.ATMOS_CONSUMER_KEY,
      process.env.ATMOS_CONSUMER_SECRET
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
    return `${this.partnerUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`
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
        params: method.toUpperCase() === 'GET' ? queryParams : undefined,
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
          code: error.code || 'UNKNOWN',
          statusCode: statusCode || 0,
          isTimeout: isConnectionError
        }
      })
    }
  }

  async getPaymentsHistory(from, to, limit = 10, offset = 0) {
    try {
      const response = await this.makeApiRequest('GET', '/api/payments/history', {
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
}

module.exports = new AtmosAPI()
