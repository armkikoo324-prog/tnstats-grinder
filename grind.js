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

    await page.goto('https://grinding.tnstats.dev', { waitUntil: 'networkidle2' });
    console.log("Connected to https://grinding.tnstats.dev!");

    await sleep(2500);

    // 1. Enter Channel Name, Password, Solve Math Check, and Click Log In
    await page.evaluate((chName, pwd) => {
        const inputs = document.querySelectorAll('input');
        let passInput = null;
        let ansInput = null;

        for (let inp of inputs) {
            const ph = (inp.placeholder || '').toLowerCase();
            const type = (inp.type || '').toLowerCase();
            if (ph.includes('password') || type === 'password') {
                passInput = inp;
            }
            if (ph.includes('answer') || ph.includes('your answer')) {
                ansInput = inp;
            }
        }

        if (passInput && pwd) {
            passInput.value = pwd;
            passInput.dispatchEvent(new Event('input', { bubbles: true }));
            passInput.dispatchEvent(new Event('change', { bubbles: true }));
            console.log("Entered channel password.");
        }

        if (ansInput) {
            let container = ansInput.parentElement;
            let questionText = '';
            while (container && container !== document.body) {
                const txt = container.textContent || '';
                if (txt.includes('Quick check')) {
                    questionText = txt;
                    break;
                }
                container = container.parentElement;
            }

            if (questionText) {
                const match = questionText.match(/(-?\d+)\s*([+\-*/–—])\s*(-?\d+)/);
                if (match) {
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
                    console.log(`Solved login check: ${num1} ${op} ${num2} = ${result}`);
                }
            }
        }

        // Click Log In button
        const buttons = document.querySelectorAll('button, a, div');
        for (let btn of buttons) {
            if (btn.offsetParent !== null && btn.textContent.trim().toLowerCase().includes('log in')) {
                btn.click();
                console.log("Clicked Log In button.");
                break;
            }
        }
    }, channelName, channelPassword);

    // Wait for dashboard to load after login
    await sleep(4000);

    // 2. Main Grinding Loop (3 minutes)
    const RUN_TIME = 3 * 60 * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < RUN_TIME) {
        try {
            await page.evaluate(() => {
                // Solve mid-grind captcha if present
                const inputs = document.querySelectorAll('input');
                let targetInput = null;
                for (let inp of inputs) {
                    const ph = (inp.placeholder || '').toLowerCase();
                    const rect = inp.getBoundingClientRect();
                    if (rect.top > 300 && inp.offsetParent !== null && !ph.includes('display') && !ph.includes('password')) {
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

                            const candidates = captchaBox.querySelectorAll('*');
                            for (let el of candidates) {
                                if (el.textContent && el.textContent.trim().includes('Verify')) {
                                    el.click();
                                    break;
                                }
                            }
                            return;
                        }
                    }
                }

                // Regular Grinding Click ("Banger Song")
                const elements = document.querySelectorAll('div, button');
                for (let el of elements) {
                    if (el.offsetParent !== null && el.textContent.trim().startsWith('Music Video')) {
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