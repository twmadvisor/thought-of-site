const path = require('path')
const sharp = require('sharp')

const root = path.resolve(__dirname, '..')
const source = path.join(root, 'assets', 'thought-of-logo-locked-256.png')
const icon = path.join(root, 'assets', 'thought-of-icon-1024.png')

sharp(source)
  .resize(1024, 1024, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
  .flatten({ background: '#ffffff' })
  .png({ compressionLevel: 6, palette: false })
  .toFile(icon)
  .then(() => console.log('Prepared standard 1024x1024 Thought Of icon.'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
