const fs = require('fs');
const path = require('path');
const dir = 'public/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
    const p = path.join(dir, file);
    const content = fs.readFileSync(p, 'utf8');
    const startTag = '<a href="/issues-archives" class="nav-link"><i class="fas fa-box-open"></i> Issue Archives</a>';
    
    // Check if the file has duplicate startTags
    const firstIndex = content.indexOf(startTag);
    if (firstIndex !== -1) {
        const secondIndex = content.indexOf(startTag, firstIndex + startTag.length);
        if (secondIndex !== -1) {
            console.log(`Fixing duplicated file: ${file}`);
            // The file was duplicated from the start of the first startTag, all the way to the end?
            // Actually, in users.html, the text from line 22 (<a href="/issues-archives"...) 
            // up to the end of the first modal (line 94: </div></div></div>) was duplicated
            // wait, the duplication started at line 96!
            // Let's just slice the file until the secondIndex! 
            // Wait, does the secondIndex have the closing tags correctly?
            // Let's just remove everything from the secondIndex to the end of the file, except for any scripts at the end!
            
            // Safer way: Look at the file and manually fix it, or print out how many duplicates exist.
            console.log(file, 'has duplicate start tag');
        }
    }
}
