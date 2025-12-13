# Ícones do PWA

Este diretório deve conter os seguintes ícones para o PWA funcionar corretamente:

- `pwa-192x192.png` - Ícone 192x192 pixels
- `pwa-512x512.png` - Ícone 512x512 pixels
- `favicon.ico` - Favicon tradicional
- `apple-touch-icon.png` - Ícone para iOS (180x180 pixels)
- `mask-icon.svg` - Ícone SVG para máscara (opcional)

## Como gerar os ícones

Você pode usar o arquivo `icon.svg` como base e converter para PNG usando:

1. Ferramentas online como:
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/svg-png/

2. Ou ferramentas de linha de comando:
   - ImageMagick: `convert icon.svg -resize 512x512 pwa-512x512.png`
   - Inkscape: `inkscape icon.svg --export-filename=pwa-512x512.png --export-width=512 --export-height=512`

3. Para o favicon.ico, você pode usar:
   - https://favicon.io/favicon-converter/
   - Ou gerar a partir do PNG de 32x32

## Tamanhos necessários

- `pwa-192x192.png`: 192x192 pixels
- `pwa-512x512.png`: 512x512 pixels  
- `favicon.ico`: 32x32 pixels (ou múltiplos tamanhos)
- `apple-touch-icon.png`: 180x180 pixels

**Nota:** O app funcionará sem esses ícones, mas eles melhoram a experiência do usuário ao instalar o PWA.

