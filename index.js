"use strict"

module.exports = function createThrottle (max) {
  if (typeof max !== 'number') {
    throw new TypeError('`createThrottle` expects a valid Number')
  }

  let cur = 0
  const queue = []
  return function throttled (fn) {
    return new Promise(function (resolve, reject) {
      if (cur < max) {
        cur++
        fn()
        .then(function (val) {
          resolve(val)
          cur--
          if (queue.length) queue.shift()()
        })
        .catch(function (err) {
          reject(err)
          cur--
          if (queue.length) queue.shift()()
        })
      } else {
        if (cur < max) {
          // avoid a race condition where the
          // concurrency went down prior to this
          // promise being executed in a microtask
          cur++
          fn()
          .then(function (val) {
            resolve(val)
            cur--
            if (queue.length) queue.shift()()
          })
          .catch(function (err) {
            reject(err)
            cur--
            if (queue.length) queue.shift()()
          })
        } else {
          queue.push(function () {
            cur++
            fn()
            .then(function (val) {
              resolve(val)
              cur--
              if (queue.length) queue.shift()()
            })
            .catch(function (err) {
              reject(err)
              cur--
              if (queue.length) queue.shift()()
            })
          })
        }
      }
    })
  }
}
