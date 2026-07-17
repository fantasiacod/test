/**
 * Script to add preflight inline script and fix version numbers in all HTML pages
 */
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'public', 'pages');
const indexFile = path.join(__dirname, 'public', 'index.html');

const preflightInline = `<script>
(function(){try{
var t=localStorage.getItem('theme')||'light';
document.documentElement.setAttribute('data-theme',t);
var l=localStorage.getItem('lang')||'ar';
document.documentElement.setAttribute('dir',l==='ar'?'rtl':'ltr');
document.documentElement.setAttribute('lang',l);
var isLogin=window.location.pathname==='/'||window.location.pathname==='/login';
if(!isLogin&&!localStorage.getItem('token')){document.documentElement.style.display='none';window.location.replace('/');}
}catch(e){}}());
</script>`;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has our inline preflight
    if (content.includes('(function(){try{')) {
        console.log('Already patched:', path.basename(filePath));
        return;
    }
    
    // Update CSS version
    content = content.replace(/style\.css\?v=\d+/g, 'style.css?v=9');
    content = content.replace(/style\.css"/g, 'style.css?v=9"');
    
    // Remove old preflight script tag if exists
    content = content.replace(/<script src="\/js\/preflight\.js"><\/script>/g, '');
    
    // Add inline preflight right after <head>
    content = content.replace('<head>', '<head>' + preflightInline);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', path.basename(filePath));
}

// Process all pages
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));
pages.forEach(p => processFile(path.join(pagesDir, p)));

// Process index.html
processFile(indexFile);

console.log('Done! Processed', pages.length + 1, 'files.');
