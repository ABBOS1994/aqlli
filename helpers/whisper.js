const shell = require('shelljs')

module.exports = (path, params) => {
  const cmdParams = Object.keys(params).map((key) => `--${key} ${params[key]}`)
  let command = `whisper ${cmdParams.join(' ')} ${path}`

  return new Promise((resolve, reject) => {
    shell.exec(
      command,
      {
        silent: true,
      },
      (code, stdout, stderr) => {
        if (code === 0) resolve(stdout)
        else reject(stderr)
      },
    )
  })
}
