const fs = require('fs');
const path = require('path');
const dir = 'public/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const badFooter = 'Ù†Ø¸Ø§Ù… Ø§Ø¯Ø§Ø±Ø© Ø§Ù„ÙˆÙ‚Øª Ù„Ø´Ø±ÙƒØ§Øª ÙˆØ§Ù„Ù…Ø¤Ø³Ø³Ø§Øª. ØªÙ… ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¨Ø±Ù†Ø§Ù…Ø¬ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ø¨ÙˆØ§Ø³Ø·Ø© Ø§Ù„Ù…Ù‡Ù†Ø¯Ø³ Ø¹Ø¨Ø¯Ø§Ù„Ù…Ø¬ÙŠØ¯ Ø³Ø¹ÙŠØ¯.';
const goodFooter = 'نظام ادارة الوقت لشركات والمؤسسات. تم تصميم البرنامج بالكامل بواسطة المهندس عبدالمجيد سعيد.';
const badDash = 'â€”';
const goodDash = '—';

for (const file of files) {
    if (file === 'settings.html') continue;
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Remove BOM
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    // Replace footer
    content = content.split(badFooter).join(goodFooter);
    
    // Replace dash
    content = content.split(badDash).join(goodDash);
    
    fs.writeFileSync(p, content, 'utf8');
    console.log('Fixed', file);
}
