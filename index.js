'use strict'

module.exports = function (max) {
  if (typeof max !== 'number') {
    throw new TypeError('`createThrottle` expects a valid Number')
  }

  let cur = 0
  const queue = []
  return function (fn) {
    return new Promise((resolve, reject) => {
      function handleFn() {
        if (cur < max) {
          cur++
          fn()
            .then(val => {
              resolve(val)
              cur--
              if (queue.length > 0) {
                queue.shift()()
              }
            })
            .catch(err => {
              reject(err)
              cur--
              if (queue.length > 0) {
                queue.shift()()
              }
            })
        } else {
          queue.push(handleFn)
        }
      }

      handleFn()
    })
  }
}
