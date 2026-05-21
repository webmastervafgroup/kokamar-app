import sharp from "sharp"
import { readFileSync, copyFileSync, mkdirSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..")

const svgPath = "C:/wamp64/www/kokamar-medusajs/00-ZO/assets/favicon-white.svg"
const svgBuffer = readFileSync(svgPath)

// Android notification smallIcon — bela ikona na TRANSPARENTNOJ pozadini
// Velicine: mdpi=24, hdpi=36, xhdpi=48, xxhdpi=72, xxxhdpi=96
const sizes = [
  { name: "drawable-mdpi/ic_notification.png", size: 24 },
  { name: "drawable-hdpi/ic_notification.png", size: 36 },
  { name: "drawable-xhdpi/ic_notification.png", size: 48 },
  { name: "drawable-xxhdpi/ic_notification.png", size: 72 },
  { name: "drawable-xxxhdpi/ic_notification.png", size: 96 },
]

const resDir = join(ROOT, "android/app/src/main/res")

for (const { name, size } of sizes) {
  const outPath = join(resDir, name)
  const dir = dirname(outPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  await sharp(svgBuffer, { density: 300 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath)

  console.log(`✓ ${name} (${size}x${size})`)
}

// Kopiraj SVG i u assets/images za referencu
copyFileSync(svgPath, join(ROOT, "assets/images/icon-white.svg"))
console.log("✓ assets/images/icon-white.svg")

// Splash assets — kopiraj beli SVG u public folder storefront-a
const storefrontPublic = "C:/wamp64/www/kokamar-medusajs/apps/storefront/public"
copyFileSync(svgPath, join(storefrontPublic, "favicon-white.svg"))
console.log("✓ storefront/public/favicon-white.svg")

console.log("\nDone! Sad postavi u app.json:")
console.log('  "notification": { "icon": "./android/app/src/main/res/drawable-xxxhdpi/ic_notification.png", "color": "#da2128" }')
