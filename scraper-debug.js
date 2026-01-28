import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function scrapeImages() {
    const allImages = [];
    
    console.log('Starting to scrape images from JAV Library...');
    console.log('===============================================\n');
    
    for (let page = 1; page <= 2; page++) {  // Test dengan 2 page dulu
        const url = `https://www.javlibrary.com/en/vl_update.php?&mode=&page=${page}`;
        
        try {
            console.log(`Scraping page ${page}: ${url}`);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Referer': 'https://www.javlibrary.com/',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });
            
            console.log(`Response status: ${response.status}`);
            console.log(`Response headers:`, Object.fromEntries(response.headers));
            
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                continue;
            }
            
            const html = await response.text();
            console.log(`HTML length: ${html.length} characters`);
            
            // Save HTML untuk debugging (hanya page 1)
            if (page === 1) {
                writeFileSync('debug-page1.html', html);
                console.log('Saved HTML to debug-page1.html for inspection');
            }
            
            const $ = cheerio.load(html);
            
            // Debug: Cari berbagai kemungkinan selector
            console.log('\n--- Debugging Selectors ---');
            console.log(`Found .video elements: ${$('.video').length}`);
            console.log(`Found .video img: ${$('.video img').length}`);
            console.log(`Found img elements total: ${$('img').length}`);
            console.log(`Found div elements: ${$('div').length}`);
            
            // Coba ambil semua img dan lihat src-nya
            console.log('\n--- All IMG tags found (first 10) ---');
            $('img').slice(0, 10).each((i, elem) => {
                const src = $(elem).attr('src');
                const alt = $(elem).attr('alt');
                const parent = $(elem).parent().attr('class');
                console.log(`${i + 1}. src: ${src}`);
                console.log(`   alt: ${alt}`);
                console.log(`   parent class: ${parent}\n`);
            });
            
            // Cari dengan berbagai selector
            const selectors = [
                '.video img',
                'div.video img',
                '.videos img',
                'img[src*="pics.dmm"]',
                'img[src*="javlibrary"]',
                'a img'
            ];
            
            console.log('\n--- Testing Different Selectors ---');
            selectors.forEach(selector => {
                const count = $(selector).length;
                console.log(`${selector}: ${count} found`);
                if (count > 0) {
                    const firstSrc = $(selector).first().attr('src');
                    console.log(`  First src: ${firstSrc}`);
                }
            });
            
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
                    console.log(`Found image: ${imgSrc}`);
                }
            });
            
            console.log(`\nPage ${page}: Found ${$('.video img').length} images (Total so far: ${allImages.length})`);
            console.log('===============================================\n');
            
            // Delay 3 detik untuk menghindari rate limiting
            if (page < 2) {
                console.log('Waiting 3 seconds before next page...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        } catch (error) {
            console.error(`Error scraping page ${page}:`, error.message);
            console.error('Stack trace:', error.stack);
        }
    }
    
    // Simpan ke file JSON
    const data = {
        images: allImages,
        lastUpdated: new Date().toISOString(),
        total: allImages.length,
        debug: 'Check console logs for details'
    };
    
    writeFileSync('images-data.json', JSON.stringify(data, null, 2));
    console.log(`\n✓ Saved ${allImages.length} images to images-data.json`);
    console.log(`Last updated: ${data.lastUpdated}`);
    
    if (allImages.length === 0) {
        console.log('\n⚠️  WARNING: No images found!');
        console.log('Check debug-page1.html to see the actual HTML structure');
    }
}

// Jalankan scraper
scrapeImages().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});