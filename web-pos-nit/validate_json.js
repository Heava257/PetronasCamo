const fs = require('fs');

const files = [
    'c:/Users/pongc/Desktop/PO_System/family_finances/web-pos-nit/src/locales/en/translation.json',
    'c:/Users/pongc/Desktop/PO_System/family_finances/web-pos-nit/src/locales/km/translation.json'
];

files.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
        console.log(`✅ ${file} is valid JSON`);
    } catch (e) {
        console.error(`❌ ${file} is INVALID JSON:`, e.message);
        // Try to find the line number
        const matches = e.message.match(/at position (\d+)/);
        if (matches) {
            const pos = parseInt(matches[1]);
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.substring(0, pos).split('\n');
            console.error(`Error around line ${lines.length}`);
        }
    }
});
