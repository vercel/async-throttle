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
      }

      if (cur < max) {
        handleFn()
      } else if (cur < max) {
        // avoid a race condition where the
        // concurrency went down prior to this
        // promise being executed in a microtask
        handleFn()
      } else {
        queue.push(() => {
          handleFn()
        })
      }
    })
  }
}
