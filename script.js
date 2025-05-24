document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const numberDisplayEl = document.getElementById('number-display');
    const qrCanvasEl = document.getElementById('qr-code');

    const LINKS = [
        'https://m.indiamart.com/impcat/washing-ball.html?utm_source=insta_show2.0&utm_medium=affiliate&utm_campaign=0525&utm_content=9', // Link 1
        'https://m.indiamart.com/proddetail/23456124662.html?utm_source=picksby_me_&utm_medium=affiliate&utm_campaign=0425&utm_content=41', // Link 2
        'https://m.indiamart.com/proddetail/26269935273.html?utm_source=picksby_me_&utm_medium=affiliate&utm_campaign=0425&utm_content=45'  // Link 3
    ];
    const ADSTERRA_LINK = 'https://www.profitableratecpm.com/mwbg7v2g0r?key=c6aaa3a2635e2ddc891a9c145928f823';
    const GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/REPLACE_ME/exec'; // Placeholder
    const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

    let clickCounter = 0;
    let lastClickTime = Date.now();
    let inactivityTimer;
    let qrInstance = null;

    function initializeApp() {
        const storedClickCounter = localStorage.getItem('clickCounter');
        clickCounter = storedClickCounter ? parseInt(storedClickCounter) : 0;

        const storedLastClickTime = localStorage.getItem('lastClickTime');
        lastClickTime = storedLastClickTime ? parseInt(storedLastClickTime) : Date.now();

        if (storedLastClickTime) {
            checkAndResetInactivity();
        } else {
            localStorage.setItem('lastClickTime', lastClickTime.toString());
        }
        
        startButton.addEventListener('click', handleStartClick);
        resetInactivityTimer(); // Start the inactivity timer on load
        // Clear any previous display if page reloads before timeout
        if (clickCounter === 0) {
             clearDisplay();
        }
    }

    function sendLog(type, value) {
        const payload = {
            timestamp: new Date().toISOString(),
            type: type,
            value: value,
            clickCount: clickCounter // Send current click count for context
        };

        fetch(GOOGLE_SHEET_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors', // Important for simple Google Apps Script web app endpoints
            cache: 'no-cache',
            headers: {
                // 'Content-Type': 'application/json' // Google Apps Script often prefers 'text/plain' or form data for simple POSTs
                                                     // For 'no-cors' this header might not actually be sent or processed by server
            },
            body: JSON.stringify(payload) // if your Apps Script is set up to parse JSON from request body
            // For a typical Google Apps Script doPost(e), you might send as form data:
            // body: new URLSearchParams(payload)
        })
        .then(() => console.log('Log sent (or no-cors opaque response). Type:', type, "Value:", value))
        .catch(error => console.error('Error sending log:', error));
    }

    function generateValidRandomNumber() {
        let randomNumber;
        do {
            randomNumber = Math.floor(1000 + Math.random() * 9000);
        } while (randomNumber >= 1950 && randomNumber <= 2025);
        return randomNumber.toString();
    }

    function animateNumberDisplay(numberString) {
        clearDisplay(); // Clear previous number and QR before starting new animation
        numberDisplayEl.innerHTML = ''; // Clear previous digits

        const digits = numberString.split('');
        let currentDelay = 0;

        digits.forEach((digit, index) => {
            setTimeout(() => {
                const digitSpan = document.createElement('span');
                digitSpan.textContent = digit;
                numberDisplayEl.appendChild(digitSpan);

                // Generate QR code after the last digit is displayed
                if (index === digits.length - 1) {
                    setTimeout(() => { // Ensure this runs after the digit is in DOM
                         generateQRCode(numberString);
                    }, 100); // Small delay to ensure digit span is rendered
                }
            }, currentDelay);
            currentDelay += 1000; // 1s gap for next digit
        });
    }

    function generateQRCode(text) {
        if (!text) return;
        qrCanvasEl.style.display = 'block';
        if (qrInstance) {
            qrInstance.set({ value: text, size: 150 });
        } else {
            qrInstance = new QRious({
                element: qrCanvasEl,
                value: text,
                size: 150, // QR code size in pixels
                padding: 10, // Padding around QR
                level: 'H', // High error correction
                background: '#ffffff',
                foreground: '#333333'
            });
        }
    }
    
    function clearDisplay() {
        numberDisplayEl.innerHTML = '';
        if (qrCanvasEl) {
            const ctx = qrCanvasEl.getContext('2d');
            ctx.clearRect(0, 0, qrCanvasEl.width, qrCanvasEl.height);
            qrCanvasEl.style.display = 'none';
        }
    }

    function redirectToUrl(url) {
        sendLog('redirect', url);
        window.location.href = url;
    }

    function resetUserCycle(reason = 'inactivity') {
        console.log(`User cycle reset due to ${reason}.`);
        clickCounter = 0;
        localStorage.setItem('clickCounter', clickCounter.toString());
        localStorage.setItem('lastClickTime', Date.now().toString()); // Reset last click time on cycle reset
        
        clearDisplay();
        
        sendLog('reset', reason);
        // Optional: alert('Session has been reset.');
        resetInactivityTimer(); // Restart timer after reset
    }

    function checkAndResetInactivity() {
        const now = Date.now();
        if (now - lastClickTime > INACTIVITY_TIMEOUT_MS) {
            resetUserCycle('inactivity_check_on_load');
        }
    }

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            resetUserCycle('timeout');
        }, INACTIVITY_TIMEOUT_MS);
    }

    function handleStartClick() {
        lastClickTime = Date.now();
        localStorage.setItem('lastClickTime', lastClickTime.toString());
        resetInactivityTimer();

        clickCounter++;
        localStorage.setItem('clickCounter', clickCounter.toString());
        sendLog('click', `Button click #${clickCounter}`);

        // Clicks 1, 3, 5, 7: Generate number
        if (clickCounter === 1 || clickCounter === 3 || clickCounter === 5 || clickCounter === 7) {
            const randomNumber = generateValidRandomNumber();
            animateNumberDisplay(randomNumber);
        }
        // Clicks 2, 4, 6: Redirect to specific links
        else if (clickCounter === 2) {
            redirectToUrl(LINKS[0]);
        } else if (clickCounter === 4) {
            redirectToUrl(LINKS[1]);
        } else if (clickCounter === 6) {
            redirectToUrl(LINKS[2]);
        }
        // Click 8 and beyond: Redirect to Adsterra link
        else { // Handles 8th click and any subsequent clicks
            redirectToUrl(ADSTERRA_LINK);
        }
    }

    initializeApp();
});S