const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.goto('http://localhost:5173/login');
    
    // login as username to get to triage... wait, guest can't go to triage unless it's mock login.
    await page.evaluate(() => {
        localStorage.setItem('user', JSON.stringify({
            id: 'mock', name: 'Mock User', preferredLanguage: 'en', isGuest: false
        }));
    });
    
    await page.goto('http://localhost:5173/department/Cardiology');
    
    // wait for facilities
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // click first facility
    const facilities = await page.$$('div[style*="cursor: pointer"]');
    if (facilities.length > 0) {
        console.log('Clicking facility');
        await facilities[0].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // click Proceed to Booking
        const buttons = await page.$$('button');
        let proceedBtn = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text.includes('Proceed to Booking')) {
                proceedBtn = btn;
                break;
            }
        }
        
        if (proceedBtn) {
            console.log('Clicking Proceed to Booking');
            await proceedBtn.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            const url = page.url();
            console.log('Current URL after click:', url);
            const content = await page.content();
            if (content.includes('Complete Your Booking')) {
                console.log('Payment page rendered correctly.');
            } else {
                console.log('Payment page NOT rendered. Content snippet:', content.substring(0, 500));
            }
        } else {
            console.log('Proceed to Booking button not found');
        }
    } else {
        console.log('No facilities found');
    }
    
    await browser.close();
})();
