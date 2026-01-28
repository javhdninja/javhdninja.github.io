import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function scrapeImages() {
    const allImages = [];
    
    console.log('Starting to scrape images from JAV Library...');
    
    for (let page = 1; page <= 5; page++) {
        const url = `https://www.javlibrary.com/en/vl_update.php?&mode=&page=${page}`;
        
        try {
            console.log(`Scraping page ${page}...`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                continue;
            }
            
            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Mencari semua div dengan class "video" dan ambil img di dalamnya
            $('.video img').each((i, elem) => {
                let imgSrc = $(elem).attr('src');
                if (imgSrc) {
                    // Pastikan URL lengkap dengan https
                    if (imgSrc.startsWith('//')) {
                        imgSrc = 'https:' + imgSrc;
                    } else if (!imgSrc.startsWith('http')) {
                        imgSrc = 'https://www.javlibrary.com' + imgSrc;
                    }
                    allImages.push(imgSrc);
                }
            });
            
            console.log(`Page ${page}: Found ${$('.video img').length} images (Total so far: ${allImages.length})`);
            
            // Delay 2 detik untuk menghindari rate limiting
            if (page < 5) {
                console.log('Waiting 2 seconds before next page...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`Error scraping page ${page}:`, error.message);
        }
    }
    
    // Simpan ke file JSON
    const data = {
        images: allImages,
        lastUpdated: new Date().toISOString(),
        total: allImages.length
    };
    
    writeFileSync('images-data.json', JSON.stringify(data, null, 2));
    console.log(`\n✓ Successfully saved ${allImages.length} images to images-data.json`);
    console.log(`Last updated: ${data.lastUpdated}`);
}

// Jalankan scraper
scrapeImages().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
