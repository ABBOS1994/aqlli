

// middlewares/sessionHandler.js ichiga quyidagilar qo‘shiladi
const { confirmPayment } = require('../helpers/atmosPayment')

module.exports = () => async (ctx, next) => {
  ctx.session = ctx.session || {}

  return next()
}
