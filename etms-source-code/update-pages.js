const fs = require('fs');
const path = require('path');
const d = './public/pages';

fs.readdirSync(d).filter(f => f.endsWith('.html')).forEach(file => {
    let c = fs.readFileSync(path.join(d, file), 'utf8');
    // Bump versions
    c = c.replace(/app\.js\?v=\d+/g, 'app.js?v=8');
    c = c.replace(/style\.css\?v=\d+/g, 'style.css?v=6');
    c = c.replace(/roles\.js\?v=\d+/g, 'roles.js?v=3');
    c = c.replace(/notifications\.js\?v=\d+/g, 'notifications.js?v=2');
    // Add version for bare references
    c = c.replace(/\/js\/roles\.js"/g, '/js/roles.js?v=3"');
    c = c.replace(/\/js\/notifications\.js"/g, '/js/notifications.js?v=2"');
    // Add sidebarLogoArea if missing
    if (!c.includes('sidebarLogoArea')) {
        // Find the sidebar-header block and wrap it
        c = c.replace('<div class="sidebar-header">', '<div id="sidebarLogoArea"><div class="sidebar-header">');
        // Close the wrapping div after the first </div> after sidebar-header
        // Simpler: just inject before nav
        c = c.replace('id="sidebarLogoArea"><div class="sidebar-header">', 'id="sidebarLogoArea">');
        // Remove the old static header block entirely since loadSidebarLogos handles it
        c = c.replace(/<div class="sidebar-header">[\s\S]*?<\/div>\s*<nav/, '<nav');
    }
    fs.writeFileSync(path.join(d, file), c);
    console.log('Updated:', file);
});
