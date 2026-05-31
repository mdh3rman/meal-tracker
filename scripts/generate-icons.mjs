import sharp from 'sharp'

// SVG: indigo rounded-rect background + plate/fork shapes (no emoji for cross-platform compat)
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#4f46e5"/>
  <circle cx="256" cy="220" r="90" fill="white" opacity="0.9"/>
  <rect x="220" y="310" width="72" height="12" rx="6" fill="white" opacity="0.9"/>
  <rect x="192" y="330" width="128" height="12" rx="6" fill="white" opacity="0.9"/>
</svg>`

const svgBuf = Buffer.from(svg)

await sharp(svgBuf).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svgBuf).resize(512, 512).png().toFile('public/icon-512.png')
console.log('Icons generated.')
