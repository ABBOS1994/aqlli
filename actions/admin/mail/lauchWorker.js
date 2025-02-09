const { Worker } = require('worker_threads')
const path = require('path')

const launchWorker = (id) => {
  const worker = new Worker(path.join(__dirname, 'worker.js'), {
    workerData: id,
    env: process.env,
  })

  worker.on('message', () => {
    console.log(`📌 Worker ${id} muvaffaqiyatli bajarildi.`)
    worker.terminate()
  })

  worker.on('error', (err) => {
    console.error(`❌ Worker ${id} xatolik bilan tugadi:`, err)
  })

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`⚠️ Worker ${id} kod bilan chiqdi: ${code}`)
    }
  })
}

module.exports = launchWorker
