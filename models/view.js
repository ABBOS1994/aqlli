const mongoose = require('mongoose')

const viewSchema = new mongoose.Schema(
  {
    message: { type: Object, required: true }, // Xabar obyektini saqlaydi
    keyboard: { type: Array, default: [] },
    status: { type: String, default: 'notStarted', index: true },
    quantity: { type: Number, default: 0 },
    preview: { type: Boolean, default: true },
    unique: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    users: { type: Array, default: [] }, // Agar bo‘sh bo‘lsa, [] bo‘lib qoladi
    startDate: { type: Date, index: true },
    endDate: { type: Date, index: true },
  },
  { timestamps: true }, // ✅ Avtomatik `createdAt` va `updatedAt` maydonlari qo‘shiladi
)

const View = mongoose.model('View', viewSchema)

module.exports = View
