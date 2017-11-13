const test = require('ava')
const sleep = require('then-sleep')
const createThrottle = require('./')

test('test concurrency of 1', async t => {
  const throttle = createThrottle(1)
  const pending = []

  // measure concurrent executions
  let cur = 0

  // measure total executions
  let total = 0
  const expected = 10

  const fn = throttle(async () => {
    cur++
    t.is(cur, 1)
    await sleep(100)
    cur--
    t.is(cur, 0)
    total++
  })

  for (let a = 0; a < expected; a++) {
    pending.push(fn())
  }

  // wait on all tasks
  await Promise.all(pending)

  // make sure they all executed
  t.is(total, expected)
})

test('test concurrency of 2', async t => {
  const throttle = createThrottle(2)
  const pending = []

  // measure concurrent executions
  let cur = 0

  // measure total executions
  let total = 0
  const expected = 10
  let wasTwo = false
  let wasZero = false

  const fn = throttle(async () => {
    cur++
    t.true(cur <= 2)
    if (cur === 2) {
      wasTwo = true
    }
    await sleep(100)
    cur--
    t.true(cur <= 2)
    if (cur === 0) {
      wasZero = true
    }
    total++
  })

  for (let a = 0; a < expected; a++) {
    pending.push(fn())
  }

  // wait on all tasks
  await Promise.all(pending)

  // make sure they all executed
  t.is(total, expected)
  t.true(wasZero)
  t.true(wasTwo)
})

test('error', t => {
  try {
    createThrottle(null)
  } catch (err) {
    t.true(err instanceof TypeError)
  }
})

test('return values async', async t => {
  const throttle = createThrottle(1)
  const throttled = throttle(async () => {
    await sleep(100)
    return 'haha'
  })
  const val = await throttled()
  t.is(val, 'haha')
})

test('return values sync', async t => {
  const throttle = createThrottle(1)
  const throttled = throttle(() => 1)
  const val = await throttled()
  t.is(val, 1)
})

test('errors should not interrupt the queue', async t => {
  const throttle = createThrottle(1)
  const t1 = throttle(async () => {
    await sleep(100)
    throw new Error('haha')
  })
  const t2 = throttle(async () => {
    await sleep(100)
    return 'woot'
  })

  const p1 = t1()
  const p2 = t2()

  // make sure it threw
  await new Promise(resolve => {
    p1.catch(err => {
      t.true(err instanceof Error)
      p2.then(data => {
        t.is(data, 'woot')
        resolve()
      })
    })
  })
})

test('introspection', async t => {
  const throttle = createThrottle(3)
  const fn = throttle(async () => await sleep(100))

  t.is(throttle.current, 0)

  const p1 = fn()
  t.is(throttle.current, 1)

  const p2 = fn()
  t.is(throttle.current, 2)

  const p3 = fn()
  t.is(throttle.current, 3)

  await Promise.all([p1, p2, p3])
  t.is(throttle.current, 0)
})

test('this', async t => {
  const throttle = createThrottle(3)
  const fn = throttle(function () {
    t.is(this.foo, 'bar')
  })
  fn.call({foo: 'bar'})
})

test('arguments', async t => {
  const throttle = createThrottle(3)

  let invokeCount = 0
  const fn = throttle(async (a, b, c) => {
    invokeCount++
    t.is(a, invokeCount)
    t.is(b, 2 * invokeCount)
    t.is(c, String.fromCharCode('a'.charCodeAt(0) + invokeCount - 1))
  })

  fn(1, 2, 'a')
  fn(2, 4, 'b')
  fn(3, 6, 'c')
})
