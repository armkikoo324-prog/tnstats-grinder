const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://grinding.tnstats.dev', { waitUntil: 'networkidle2' });
    console.log("Successfully connected to site!");

    // Set run time limit (10 minutes)
    const RUN_TIME = 10 * 60 * 1000;
    const startTime = Date.now();

    const interval = setInterval(async () => {
        if (Date.now() - startTime > RUN_TIME) {
            console.log("Run complete. Closing browser...");
            clearInterval(interval);
            await browser.close();
            process.exit(0);
        }

        try {
            await page.evaluate(() => {
                const elements = document.querySelectorAll('div, button');
                for (let el of elements) {
                    if (el.offsetParent !== null && el.textContent.trim().startsWith('Banger Song')) {
                        el.click();
                        break;
                    }
                }
            });
        } catch (err) {
            console.log("Execution note:", err.message);
        }
    }, 900);
})();