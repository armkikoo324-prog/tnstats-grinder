const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching headless browser on GitHub Actions...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set a realistic user agent so the site doesn't flag the cloud runner
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto('https://grinding.tnstats.dev', { waitUntil: 'networkidle2' });
    console.log("Connected to https://grinding.tnstats.dev!");

    // Run for 10 minutes per GitHub Action execution
    const RUN_TIME = 10 * 60 * 1000;
    const startTime = Date.now();

    const interval = setInterval(async () => {
        if (Date.now() - startTime > RUN_TIME) {
            console.log("Run time limit reached. Closing browser.");
            clearInterval(interval);
            await browser.close();
            process.exit(0);
        }

        try {
            await page.evaluate(() => {
                // 1. Check and solve math captcha if present
                const inputs = document.querySelectorAll('input');
                let targetInput = null;
                for (let inp of inputs) {
                    const ph = (inp.placeholder || '').toLowerCase();
                    const rect = inp.getBoundingClientRect();
                    if (rect.top > 300 && inp.offsetParent !== null && !ph.includes('display')) {
                        targetInput = inp;
                        break;
                    }
                }

                if (targetInput) {
                    let captchaBox = targetInput.parentElement;
                    let questionText = '';
                    while (captchaBox && captchaBox !== document.body) {
                        const txt = captchaBox.textContent || '';
                        if (txt.includes('Quick check')) {
                            questionText = txt;
                            break;
                        }
                        captchaBox = captchaBox.parentElement;
                    }

                    if (captchaBox && questionText.includes('Quick check')) {
                        const match = questionText.match(/(-?\d+)\s*([+\-*/–—])\s*(-?\d+)/);
                        if (match) {
                            const num1 = parseInt(match[1], 10);
                            const op = match[2];
                            const num2 = parseInt(match[3], 10);
                            let result;

                            if (op === '+') result = num1 + num2;
                            else if (op === '-' || op === '–' || op === '—') result = num1 - num2;
                            else if (op === '*') result = num1 * num2;
                            else if (op === '/') result = num1 / num2;

                            if (targetInput.value !== String(result)) {
                                targetInput.value = result;
                                targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                                targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                            }

                            // Find and click verify button
                            const candidates = captchaBox.querySelectorAll('*');
                            for (let el of candidates) {
                                if (el.textContent && el.textContent.trim().includes('Verify')) {
                                    el.click();
                                    break;
                                }
                            }
                            return; // Skip grinding click if solving captcha
                        }
                    }
                }

                // 2. Regular Grinding Click ("Banger Song")
                const elements = document.querySelectorAll('div, button');
                for (let el of elements) {
                    if (el.offsetParent !== null && el.textContent.trim().startsWith('Banger Song')) {
                        el.click();
                        break;
                    }
                }
            });
        } catch (err) {
            console.log("Loop execution note:", err.message);
        }
    }, 900); // 0.9 second interval
})();