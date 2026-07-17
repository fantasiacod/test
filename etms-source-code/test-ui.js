const puppeteer = require('puppeteer');
const jwt = require('jsonwebtoken');

(async () => {
    try {
        const secret = 'enterprise_task_system_jwt_secret_key_2024_very_secure';
        const token = jwt.sign({ id: '330865a5-4422-4522-88c9-3c98c0333bcc', username: 'admin' }, secret, { expiresIn: '1h' });
        
        const userObj = {
            id: '330865a5-4422-4522-88c9-3c98c0333bcc',
            username: 'admin',
            fullName: 'Admin User',
            role: 'Admin',
            avatarUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
        };

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        // Go to login page first just to set local storage on the correct domain
        await page.goto('http://localhost:3000/');
        
        // Inject localStorage
        await page.evaluate((token, user) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        }, token, userObj);
        
        // Now go to dashboard
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
        
        // Wait for page to fully render
        await new Promise(r => setTimeout(r, 2000));
        
        // Take screenshot of the header
        await page.screenshot({ path: 'C:\\Users\\GAMING PC\\.gemini\\antigravity\\brain\\27ff13e4-dee2-480c-8a4d-705f7c861a7d\\dashboard_header.png', fullPage: true });

        // Go to profile page
        await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'C:\\Users\\GAMING PC\\.gemini\\antigravity\\brain\\27ff13e4-dee2-480c-8a4d-705f7c861a7d\\profile_page.png', fullPage: true });
        
        console.log('Screenshots taken');
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
