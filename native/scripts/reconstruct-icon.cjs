const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const root = path.resolve(__dirname, '..')
const partsDir = path.join(root, 'assets', 'icon-base64')
const output = path.join(root, 'assets', 'thought-of-icon-source.png')
const expectedBytes = 38363
const expectedSha256 = '7f2e895e035c82d8ca81268378f2dd125f20c8f8602a56a8fa594b0fa2451249'

const parts = fs.readdirSync(partsDir)
  .filter((name) => /^part-\d+\.txt$/.test(name))
  .sort()

if (parts.length !== 7) {
  throw new Error(`Expected 7 canonical icon chunks, found ${parts.length}.`)
}

const encoded = parts.map((name) => fs.readFileSync(path.join(partsDir, name), 'utf8').trim()).join('')
const data = Buffer.from(encoded, 'base64')
const sha256 = crypto.createHash('sha256').update(data).digest('hex')

if (data.length !== expectedBytes || sha256 !== expectedSha256) {
  throw new Error(`Canonical icon integrity check failed. bytes=${data.length}, sha256=${sha256}`)
}

fs.writeFileSync(output, data)
console.log(`Canonical Thought Of icon ready: ${data.length} bytes, sha256=${sha256}`)
