// ==UserScript==
// @name         Auto Grinder with Fixed Captcha Solver (Version 6.0)
// @namespace    https://github.com/armkikoo324-prog/tnstats-grinder
// @version      6.0
// @description  The powerful script that automatically grinds when you're not at home.
// @author       UltimateTrioTitans
// @match        https://grinding.tnstats.dev/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const INTERVAL = 900; // 0.9 seconds
    let intervalId = null;
    let isRunning = false;
    let lastCaptchaTime = 0;

    // Create Large UI Panel in Top-Right
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '25px';
    panel.style.right = '25px';
    panel.style.zIndex = '999999';
    panel.style.backgroundColor = '#181920';
    panel.style.color = '#ffffff';
    panel.style.padding = '20px 24px';
    panel.style.borderRadius = '14px';
    panel.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
    panel.style.border = '2px solid #2d323f';
    panel.style.fontFamily = 'Inter, system-ui, sans-serif';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.alignItems = 'center';
    panel.style.gap = '12px';
    panel.style.minWidth = '220px';

    const titleText = document.createElement('div');
    titleText.innerText = 'AUTOFARM CONTROL';
    titleText.style.fontSize = '12px';
    titleText.style.fontWeight = '800';
    titleText.style.letterSpacing = '1.5px';
    titleText.style.color = '#8f9bba';

    const statusBadge = document.createElement('div');
    statusBadge.innerText = 'STATUS: STOPPED';
    statusBadge.style.fontSize = '13px';
    statusBadge.style.fontWeight = '700';
    statusBadge.style.color = '#ff6b6b';
    statusBadge.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';
    statusBadge.style.padding = '6px 14px';
    statusBadge.style.borderRadius = '20px';

    const toggleButton = document.createElement('button');
    toggleButton.innerText = 'START';
    toggleButton.style.width = '100%';
    toggleButton.style.padding = '14px 0';
    toggleButton.style.backgroundColor = '#00b894';
    toggleButton.style.color = '#ffffff';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '10px';
    toggleButton.style.cursor = 'pointer';
    toggleButton.style.fontSize = '18px';
    toggleButton.style.fontWeight = '800';
    toggleButton.style.letterSpacing = '1px';
    toggleButton.style.boxShadow = '0 4px 12px rgba(0, 184, 148, 0.4)';
    toggleButton.style.transition = 'all 0.2s ease';

    toggleButton.onmouseover = () => { toggleButton.style.transform = 'scale(1.03)'; };
    toggleButton.onmouseout = () => { toggleButton.style.transform = 'scale(1)'; };

    panel.appendChild(titleText);
    panel.appendChild(statusBadge);
    panel.appendChild(toggleButton);

    if (document.body) {
        document.body.appendChild(panel);
    } else {
        window.addEventListener('DOMContentLoaded', () => document.body.appendChild(panel));
    }

    function fireClick(element) {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const opts = {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        };
        ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(eventType => {
            element.dispatchEvent(new MouseEvent(eventType, opts));
        });
        element.click();
        return true;
    }

    function solveCaptchaIfNeeded() {
        if (Date.now() - lastCaptchaTime < 4000) {
            return true;
        }

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

        if (!targetInput) return false;

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

        if (!captchaBox || !questionText.includes('Quick check')) return false;

        const match = questionText.match(/(-?\d+)\s*([+\-*/–—])\s*(-?\d+)/);
        if (!match) return false;

        const num1 = parseInt(match[1], 10);
        const op = match[2];
        const num2 = parseInt(match[3], 10);
        let result;

        if (op === '+') result = num1 + num2;
        else if (op === '-' || op === '–' || op === '—') result = num1 - num2;
        else if (op === '*') result = num1 * num2;
        else if (op === '/') result = num1 / num2;

        lastCaptchaTime = Date.now();

        if (targetInput.value !== String(result)) {
            console.log(`[AutoGrinder] Solving captcha: ${num1} ${op} ${num2} = ${result}`);
            targetInput.focus();

            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(targetInput, result);
            } else {
                targetInput.value = result;
            }

            const tracker = targetInput._valueTracker;
            if (tracker) {
                tracker.setValue('');
            }

            targetInput.dispatchEvent(new Event('input', { bubbles: true }));
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setTimeout(() => {
            ['keydown', 'keypress', 'keyup'].forEach(eventType => {
                targetInput.dispatchEvent(new KeyboardEvent(eventType, {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                }));
            });

            let verifyBtn = null;
            const candidates = captchaBox.querySelectorAll('*');
            for (let el of candidates) {
                if (el.textContent && el.textContent.trim().includes('Verify')) {
                    if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || el.classList.toString().includes('btn') || el.style.cursor === 'pointer' || el.children.length <= 2) {
                        verifyBtn = el;
                        break;
                    }
                }
            }
            if (verifyBtn) {
                fireClick(verifyBtn);
            }
        }, 150);

        return true;
    }

    function clickMainButton() {
        const elements = document.querySelectorAll('div, button');
        for (let el of elements) {
            if (el.offsetParent !== null && el.textContent.trim().startsWith('Music Video')) {
                fireClick(el);
                return true;
            }
        }
        return false;
    }

    function clickBoost() {
        const elements = document.querySelectorAll('div, button');
        for (let el of elements) {
            if (el.offsetParent !== null && el.textContent.includes('Boost') && !el.contains(panel)) {
                const text = el.textContent.trim();
                if (text.startsWith('Boost')) {
                    fireClick(el);
                    return true;
                }
            }
        }
        return false;
    }

    toggleButton.addEventListener('click', () => {
        isRunning = !isRunning;

        if (isRunning) {
            toggleButton.innerText = 'STOP';
            toggleButton.style.backgroundColor = '#d63031';
            toggleButton.style.boxShadow = '0 4px 12px rgba(214, 48, 49, 0.4)';
            statusBadge.innerText = 'STATUS: RUNNING';
            statusBadge.style.color = '#55efc4';
            statusBadge.style.backgroundColor = 'rgba(85, 239, 196, 0.15)';

            intervalId = setInterval(() => {
                if (solveCaptchaIfNeeded()) return;

                clickMainButton();

                setTimeout(() => {
                    clickBoost();
                }, 150);

                setTimeout(() => {
                    clickBoost();
                }, 300);

            }, INTERVAL);

        } else {
            toggleButton.innerText = 'START';
            toggleButton.style.backgroundColor = '#00b894';
            toggleButton.style.boxShadow = '0 4px 12px rgba(0, 184, 148, 0.4)';
            statusBadge.innerText = 'STATUS: STOPPED';
            statusBadge.style.color = '#ff6b6b';
            statusBadge.style.backgroundColor = 'rgba(255, 107, 107, 0.15)';

            clearInterval(intervalId);
            intervalId = null;
        }
    });
})();
