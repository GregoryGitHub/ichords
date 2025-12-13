import sharp from 'sharp';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const iconSvg = join(publicDir, 'icon.svg');

if (!existsSync(iconSvg)) {
  console.error('❌ Arquivo icon.svg não encontrado em public/');
  process.exit(1);
}

const svgBuffer = readFileSync(iconSvg);

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.png', size: 32 }
];

console.log('🎨 Gerando ícones do PWA...\n');

for (const { name, size } of sizes) {
  const outputPath = join(publicDir, name);
  try {
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a
      })
      .png()
      .toFile(outputPath);
    console.log(`✅ ${name} (${size}x${size}) criado`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${name}:`, error.message);
  }
}

// Nota: favicon.ico precisa ser criado manualmente
// Você pode usar: https://favicon.io/favicon-converter/
// ou converter o favicon.png usando uma ferramenta online
console.log('\n💡 Dica: Para criar o favicon.ico, use uma ferramenta online como:');
console.log('   https://favicon.io/favicon-converter/');
console.log('   ou converta o favicon.png manualmente');

console.log('\n✨ Ícones gerados com sucesso!');

