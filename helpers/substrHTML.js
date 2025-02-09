module.exports = function substrHTML(string, length) {
  if (!string || typeof string !== 'string') return ''

  let match
  const tagRegex = /<([^>\s]*)[^>]*>/g
  const stack = []
  let lastIndex = 0
  let result = ''

  while ((match = tagRegex.exec(string)) && length > 0) {
    const temp = string.substring(lastIndex, match.index).substr(0, length)
    result += temp
    length -= temp.length
    lastIndex = tagRegex.lastIndex

    if (length > 0) {
      result += match[0]
      if (match[1].startsWith('/')) stack.pop()
      else if (!match[1].endsWith('/')) stack.push(match[1])
    }
  }

  result += string.substr(lastIndex, length)

  while (stack.length) {
    result += `</${stack.pop()}>`
  }

  return result
}
