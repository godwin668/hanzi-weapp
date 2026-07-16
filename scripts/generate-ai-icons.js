const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons');

const prompts = [
  {
    name: 'icon-yong-01',
    prompt: 'App icon for Chinese writing learning app "汉字笔画小达人". A traditional Chinese calligraphy practice grid (田字格, a square divided into 4 equal parts by a cross) with the elegant Chinese character "永" written in bold golden calligraphy strokes filling the grid. The "永" character has 8 basic strokes (dot, horizontal, vertical, left-falling, right-falling, hook, bend, rise). Clean white background, rounded square icon, modern flat design with a subtle red accent brush tip in the corner. Professional educational app feel.'
  },
  {
    name: 'icon-yong-02',
    prompt: 'A beautiful app icon: Chinese field grid (田字格) with red grid lines, inside is the character "永" in dark ink black brush calligraphy style, each stroke showing elegant brush texture and varying thickness. A small red calligraphy brush diagonally placed at bottom-right. Light cream paper-textured background. Rounded square icon, premium calligraphy education app style, warm and traditional Chinese aesthetic.'
  },
  {
    name: 'icon-yong-03',
    prompt: 'Modern kids-friendly app icon: a cute rounded 田字格 (practice grid) with the Chinese character "永" drawn in colorful gradient strokes (warm orange to pink), each stroke of the character clearly visible. Soft pastel yellow background with subtle sparkle decorations. Rounded square icon, playful educational style for primary school children, bright and inviting.'
  },
  {
    name: 'icon-yong-04',
    prompt: 'Minimalist premium app icon: a clean white 田字格 grid with the character "永" rendered in elegant deep green calligraphy ink, showing clear stroke order with subtle numbered dots indicating stroke sequence (1-8). Small golden seal stamp in bottom-right corner. Soft off-white background with subtle paper texture. Rounded square, sophisticated Chinese education app style.'
  }
];

function download(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        download(response.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filepath, buffer);
        console.log(`  Saved: ${path.basename(filepath)} (${buffer.length} bytes)`);
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  const baseUrl = 'https://console.enterprise.trae.cn/api/ide/v1/text_to_image';
  
  for (const item of prompts) {
    const encoded = encodeURIComponent(item.prompt);
    const url = `${baseUrl}?prompt=${encoded}&image_size=square_hd`;
    const outPath = path.join(OUT_DIR, `${item.name}.png`);
    
    console.log(`Generating: ${item.name}...`);
    try {
      await download(url, outPath);
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }
  
  console.log('\nDone!');
}

main();
