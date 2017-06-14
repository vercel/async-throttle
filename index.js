'use strict'

function createThrottle(max) {
  if (typeof max !== 'number') {
    throw new TypeError('`createThrottle` expects a valid Number')
  }

  let cur = 0
  const queue = []
  function throttle(fn) {
    function throttled() {
      const self = this
      const args = arguments
      return new Promise((resolve, reject) => {
        function handleFn() {
          if (cur < max) {
            throttle.current = ++cur
            Promise.resolve(fn.apply(self, args))
              .then(val => {
                resolve(val)
                throttle.current = --cur
                if (queue.length > 0) {
                  queue.shift()()
                }
              })
              .catch(err => {
                reject(err)
                throttle.current = --cur
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
    return throttled
  }

  // keep copies of the "state" for introspection
  throttle.current = cur
  throttle.queue = queue

  return throttle
}

module.exports = createThrottle
