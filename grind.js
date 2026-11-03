const puppeteer = require('puppeteer');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    console.log("Launching headless browser on GitHub Actions...");
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const channelName = process.env.CHANNEL_NAME || 'UltimateTrioTitans';
    const channelPassword = process.env.CHANNEL_PASSWORD || 'UltimateTrioTitansOfficialChannel';

    await page.goto(`https://grinding.tnstats.dev/?channel=${encodeURIComponent(channelName)}`, { waitUntil: 'networkidle2' });
    console.log(`Connected to channel page for: ${channelName}`);

    await sleep(3000);

    // Step 1: Fill Password & Solve Math Captcha & Click Login
    const loginSuccess = await page.evaluate((pwd) => {
        console.log("Starting login evaluation...");
        
        // Find password input
        const inputs = document.querySelectorAll('input');
        let passInput = null;
        let ansInput = null;

        for (let inp of inputs) {
            const ph = (inp.placeholder || '').toLowerCase();
            const type = (inp.type || '').toLowerCase();
            if (ph.includes('password') || type === 'password') {
                passInput = inp;
            }
            if (ph.includes('answer') || ph.includes('your answer') || ph.placeholder === '') {
                // Look for an input near the math check
                if (inp.type !== 'password') {
                    ansInput = inp;
                }
            }
        }

        if (passInput && pwd) {
            passInput.value = pwd;
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("SUCCESS: Entered channel password.");
        } else {
            console.log("WARNING: Password input not found!");
        }

        // Find and solve math captcha on the page body
        const bodyText = document.body.innerText;
        console.log("Page text snippet:", bodyText.substring(0, 300));

        // Regex to find math expressions like "10 - 3" or "5 + 2"
        const match = bodyText.match(/(\d+)\s*([+\-*/–—])\s*(\d+)/);
        if (match && ansInput) {
            const num1 = parseInt(match[1], 10);
            const op = match[2];
            const num2 = parseInt(match[3], 10);
            let result = 0;

            if (op === '+') result = num1 + num2;
            else if (op === '-' || op === '–' || op === '—') result = num1 - num2;
            else if (op === '*') result = num1 * num2;
            else if (op === '/') result = num1 / num2;

            ansInput.value = result;
            ansInput.dispatchEvent(new Event('input', { bubbles: true }));
            ansInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`SUCCESS: Solved math check: ${num1} ${op} ${num2} = ${result}`);
        } else {
            console.log("WARNING: Math captcha or answer input not found.");
        }

        // Click Log In button
        let clicked = false;
        const elements = document.querySelectorAll('button, a, div');
        for (let el of elements) {
            const text = (el.textContent || '').trim().toLowerCase();
            if (el.offsetParent !== null && (text.includes('log in') || text.includes('login'))) {
                el.click();
                console.log("SUCCESS: Clicked Log In button.");
                clicked = true;
                break;
            }
        }

        return clicked;
    }, channelPassword);

    console.log("Login sequence finished. Waiting for dashboard to load...");
    await sleep(5000);

    // Step 2: Main Grinding Loop (3 minutes)
    const RUN_TIME = 3 * 60 * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < RUN_TIME) {
        try {
            await page.evaluate(() => {
                // Solve mid-grind captcha popup if it appears
                const inputs = document.querySelectorAll('input');
                let targetInput = null;
                for (let inp of inputs) {
                    const ph = (inp.placeholder || '').toLowerCase();
                    const rect = inp.getBoundingClientRect();
                    if (rect.top > 200 && inp.offsetParent !== null && !ph.includes('password')) {
                        targetInput = inp;
                        break;
                    }
                }

                if (targetInput) {
                    const pageText = document.body.innerText;
                    const match = pageText.match(/(\d+)\s*([+\-*/–—])\s*(\d+)/);
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

                        const elements = document.querySelectorAll('button, div, span');
                        for (let el of elements) {
                            if (el.textContent && el.textContent.trim().toLowerCase().includes('verify')) {
                                el.click();
                                break;
                            }
                        }
                        return;
                    }
                }

                // Regular Grinding Click ("Banger Song")
                const elements = document.querySelectorAll('div, button');
                for (let el of elements) {
                    if (el.offsetParent !== null && el.textContent.trim().startsWith('Banger Song')) {
                        el.click();
                        console.log("Clicked: Banger Song");
                        break;
                    }
                }
            });
        } catch (err) {
            console.log("Loop execution note:", err.message);
        }

        await sleep(900);
    }

    console.log("Run time limit reached. Closing browser.");
    await browser.close();
    process.exit(0);
})();