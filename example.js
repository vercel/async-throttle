const fetch = require('node-fetch')
const cheerio = require('cheerio').load
const createThrottle = require('./')

// code
const throttle = createThrottle(2)
const urls = ['https://zeit.co', 'https://google.com', 'https://bing.com', 'https://test.com', 'http://cnn.com', 'https://woot.com']
Promise.all(urls.map(url => throttle(async () => {
  console.log('Processing', url)
  const res = await fetch(url)
  const data = await res.text()
  const $ = cheerio(data)
  return $('title').text()
})))
.then(titles => console.log('Titles:', titles))
.catch(err => console.error(err.stack))
