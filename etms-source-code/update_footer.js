const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'public', 'pages');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the recent footer with the new one containing the name
    const oldFooter = /&copy; 2026 نظام ادارة الوقت لشركات والمؤسسات/g;
    const newFooter = '&copy; 2026 نظام ادارة الوقت لشركات والمؤسسات. تم تصميم البرنامج بالكامل بواسطة المهندس عبدالمجيد سعيد.';
    
    content = content.replace(oldFooter, newFooter);

    // Prevent double replacing if script is run multiple times
    content = content.replace(/سعيد\.\. تم تصميم/g, 'سعيد.');

    fs.writeFileSync(filePath, content, 'utf8');
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.html')) {
            replaceInFile(fullPath);
            console.log('Updated:', fullPath);
        }
    }
}

// Also check index.html in public
const rootIndex = path.join(__dirname, 'public', 'index.html');
if (fs.existsSync(rootIndex)) {
    replaceInFile(rootIndex);
    console.log('Updated:', rootIndex);
}

processDirectory(directoryPath);
console.log('All footers updated successfully with the designer name!');
