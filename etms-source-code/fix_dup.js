const fs = require('fs');

function fixDuplication(file, duplicateTextMarker) {
    let content = fs.readFileSync(file, 'utf8');
    const firstIndex = content.indexOf(duplicateTextMarker);
    if (firstIndex !== -1) {
        const secondIndex = content.indexOf(duplicateTextMarker, firstIndex + duplicateTextMarker.length);
        if (secondIndex !== -1) {
            console.log(`Fixing ${file}`);
            
            // The duplicated block ends when we reach the NEXT valid thing after the block.
            // Wait, in tasks.html:
            // First instance of the block ends at line 60: `    </div></div></div>`
            // Then line 61: `    <div class="loading-overlay" id="loadingOverlay"><div class="loading-spinner"></div></div>`
            // But wait! Look at tasks.html line 62: It STARTS the duplicate!
            // That means the block from 14 to 60 was duplicated AND INSERTED AT LINE 62!
            // Wait, if it was inserted at line 62, then we just need to REMOVE the second block.
            // What's the end of the second block?
            // The second block ends right before `<div class="loading-overlay"` or similar, OR we can just say:
            // The length of the injected block is exactly the same as the first block!
            // Let's just calculate the distance between firstIndex and secondIndex?
            // NO!
            // The first instance might have been modified slightly (like I added the active class to nav link?)
            // Actually, in users.html, the second instance of <a href="/issues-archives" is at index X.
            // And it continues until `</div></div></div>`.
            // Let's just find the second instance of `<a href="/issues-archives"`, and the second instance of `</div></div></div>`
            // and remove everything between them (inclusive).
            
            const startStr = '<a href="/issues-archives"';
            const endStr = '</div></div></div>';
            
            const idx1 = content.indexOf(startStr);
            const idx2 = content.indexOf(startStr, idx1 + 1);
            
            if (idx2 !== -1) {
                // Find the next `</div></div></div>` AFTER idx2
                let endIdx = content.indexOf(endStr, idx2);
                if (endIdx !== -1) {
                    endIdx += endStr.length;
                    
                    const newContent = content.substring(0, idx2) + content.substring(endIdx);
                    fs.writeFileSync(file, newContent, 'utf8');
                    console.log('Fixed', file);
                }
            }
        }
    }
}

fixDuplication('public/pages/tasks.html', '<a href="/issues-archives"');
fixDuplication('public/pages/users.html', '<a href="/issues-archives"');

