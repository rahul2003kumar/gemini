document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const numberDisplayEl = document.getElementById('number-display');
    const qrCanvasEl = document.getElementById('qr-code');

    const LINKS = [
        'https://m.indiamart.com/impcat/washing-ball.html?utm_source=insta_show2.0&utm_medium=affiliate&utm_campaign=0525&utm_content=9',
        'https://m.indiamart.com/proddetail/23456124662.html?utm_source=picksby_me_&utm_medium=affiliate&utm_campaign=0425&utm_content=41',
        'https://m.indiamart.com/proddetail/26269935273.html?utm_source=picksby_me_&utm_medium=affiliate&utm_campaign=0425&utm_content=45'
    ];
    const ADSTERRA_LINK = 'https://www.profitableratecpm.com/mwbg7v2g0r?key=c6aaa3a2635e2ddc891a9c145928f823';
    const GOOGLE_SHEET_ENDPOINT = 'https://script.google.com/macros/s/REPLACE_ME/exec';
    const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000;

    let clickCounter = 0;
    let lastClickTime = Date.now();
    let inactivityTimer;
    let qrInstance = null;
    let currentAnimationIntervals = [null, null, null, null]; // Holds intervals for number animation

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
        resetInactivityTimer();
        if (clickCounter === 0) {
             clearDisplay();
        }
    }

    function sendLog(type, value) {
        const payload = {
            timestamp: new Date().toISOString(),
            type: type,
            value: value,
            clickCount: clickCounter
        };
        fetch(GOOGLE_SHEET_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify(payload)
        })
        .then(() => console.log('Log sent. Type:', type, "Value:", value))
        .catch(error => console.error('Error sending log:', error));
    }

    function generateValidRandomNumber() {
        let randomNumber;
        do {
            randomNumber = Math.floor(1000 + Math.random() * 9000);
        } while (randomNumber >= 1950 && randomNumber <= 2025);
        return randomNumber.toString();
    }

    function clearDisplay() {
        numberDisplayEl.innerHTML = '';
        if (qrCanvasEl) {
            const ctx = qrCanvasEl.getContext('2d');
            ctx.clearRect(0, 0, qrCanvasEl.width, qrCanvasEl.height);
            qrCanvasEl.style.display = 'none';
        }
        // Clear any ongoing animation intervals
        currentAnimationIntervals.forEach(intervalId => {
            if (intervalId) clearInterval(intervalId);
        });
        currentAnimationIntervals = [null, null, null, null]; // Reset the array
    }

    function animateNumberDisplay(numberString) {
        clearDisplay(); // Clear previous number, QR, and any running animation intervals
        // numberDisplayEl.innerHTML = ''; // Already done in clearDisplay

        const finalDigits = numberString.split('');
        const digitSpans = [];

        // Create spans for each digit
        for (let i = 0; i < 4; i++) {
            const span = document.createElement('span');
            span.innerHTML = '&nbsp;'; // Initial non-breaking space for layout
            // Styling for consistent width is now in CSS: #number-display span
            numberDisplayEl.appendChild(span);
            digitSpans.push(span);
        }

        function spinDigit(spanIndex) {
            // Clear any existing interval for this span before starting a new one
            if (currentAnimationIntervals[spanIndex]) {
                clearInterval(currentAnimationIntervals[spanIndex]);
            }
            currentAnimationIntervals[spanIndex] = setInterval(() => {
                digitSpans[spanIndex].textContent = Math.floor(Math.random() * 10);
            }, 60); // Speed of spinning (ms), adjust as needed
        }

        function settleDigitRecursive(currentIndex) {
            if (currentIndex >= 4) { // All digits are set
                // Ensure all intervals are cleared (should be, but defensive)
                currentAnimationIntervals.forEach(id => { if(id) clearInterval(id); });
                currentAnimationIntervals = [null, null, null, null];

                setTimeout(() => generateQRCode(numberString), 50); // Generate QR slightly after last digit animation
                return;
            }

            // Start/continue spinning for all digits from currentIndex to the end
            for (let i = currentIndex; i < 4; i++) {
                spinDigit(i);
            }

            // After 1 second, settle the current digit (currentIndex)
            setTimeout(() => {
                if (currentAnimationIntervals[currentIndex]) {
                    clearInterval(currentAnimationIntervals[currentIndex]);
                    currentAnimationIntervals[currentIndex] = null; // Mark as cleared
                }
                digitSpans[currentIndex].textContent = finalDigits[currentIndex];
                // Optional: Add class for "settled" state styling
                // digitSpans[currentIndex].classList.add('digit-settled');
                // digitSpans[currentIndex].classList.remove('digit-animating'); // If using animation classes

                // Proceed to settle the next digit
                settleDigitRecursive(currentIndex + 1);
            }, 1000); // 1-second delay for each digit to settle
        }

        settleDigitRecursive(0); // Start the animation with the first digit (index 0)
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
                size: 150,
                padding: 10,
                level: 'H',
                background: '#ffffff',
                foreground: '#333333'
            });
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
        localStorage.setItem('lastClickTime', Date.now().toString());
        
        clearDisplay(); // This will also clear number animations
        
        sendLog('reset', reason);
        resetInactivityTimer();
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

        if (clickCounter === 1 || clickCounter === 3 || clickCounter === 5 || clickCounter === 7) {
            const randomNumber = generateValidRandomNumber();
            animateNumberDisplay(randomNumber);
        } else if (clickCounter === 2) {
            redirectToUrl(LINKS[0]);
        } else if (clickCounter === 4) {
            redirectToUrl(LINKS[1]);
        } else if (clickCounter === 6) {
            redirectToUrl(LINKS[2]);
        } else {
            redirectToUrl(ADSTERRA_LINK);
        }
    }

    initializeApp();
});
