const fs = require('fs');
const path = './public/pages';

const files = fs.readdirSync(path).filter(f => f.endsWith('.html'));

files.forEach(f => {
    let content = fs.readFileSync(path + '/' + f, 'utf8');
    
    // Replace the generic Archives link with two specific links
    const target = '<a href="/archives" class="nav-link"><i class="fas fa-archive"></i> Archives</a>';
    const targetActive = '<a href="/archives" class="nav-link active"><i class="fas fa-archive"></i> Archives</a>';
    
    const replacement = `<a href="/archives" class="nav-link"><i class="fas fa-archive"></i> Task Archives</a>
<a href="/issues-archives" class="nav-link"><i class="fas fa-box-open"></i> Issue Archives</a>`;
    
    const replacementActive = `<a href="/archives" class="nav-link active"><i class="fas fa-archive"></i> Task Archives</a>
<a href="/issues-archives" class="nav-link"><i class="fas fa-box-open"></i> Issue Archives</a>`;

    content = content.replace(target, replacement);
    content = content.replace(targetActive, replacementActive);
    
    // Also remove tabs from technical-issues.html if it's that file
    if (f === 'technical-issues.html') {
        content = content.replace(/<ul class="nav nav-tabs mb-4" id="issueTabs">[\s\S]*?<\/ul>\s*/, '');
    }

    fs.writeFileSync(path + '/' + f, content);
});

console.log('Sidebar updated in all HTML files.');
