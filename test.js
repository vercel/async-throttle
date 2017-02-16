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

  const fn = async () => {
    cur++
    t.is(cur, 1)
    await sleep(100)
    cur--
    t.is(cur, 0)
    total++
  }

  for (let a = 0; a < expected; a++) {
    pending.push(throttle(fn))
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

  const fn = async () => {
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
  }

  for (let a = 0; a < expected; a++) {
    pending.push(throttle(fn))
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

test('return values', async t => {
  const throttle = createThrottle(1)
  const val = await throttle(async () => {
    await sleep(100)
    return 'haha'
  })
  t.is(val, 'haha')
})

test('errors should not interrupt the queue', async t => {
  const throttle = createThrottle(1)
  const p1 = throttle(async () => {
    await sleep(100)
    throw new Error('haha')
  })
  const p2 = throttle(async () => {
    await sleep(100)
    return 'woot'
  })

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

test('retrospection', async t => {
  const throttle = createThrottle(3)
  t.is(throttle.current, 0)

  const p1 = throttle(async () => await sleep(100))
  t.is(throttle.current, 1)

  const p2 = throttle(async () => await sleep(100))
  t.is(throttle.current, 2)

  const p3 = throttle(async () => await sleep(100))
  t.is(throttle.current, 3)

  await Promise.all([p1, p2, p3])
  t.is(throttle.current, 0)
})
