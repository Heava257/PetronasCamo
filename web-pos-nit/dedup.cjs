const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\pongc\\Desktop\\PO_System\\family_finances\\web-pos-nit\\src\\locales\\TranslationContext.jsx';
let content = fs.readFileSync(filePath, 'utf8');

function deduplicateSection(sectionName, content) {
    const startPattern = new RegExp(`${sectionName}: \\{`);
    const match = content.match(startPattern);
    if (!match) return content;

    const startIdx = match.index + match[0].length;
    let endIdx = -1;
    let braceCount = 1;

    for (let i = startIdx; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
            endIdx = i;
            break;
        }
    }

    if (endIdx === -1) return content;

    const sectionContent = content.substring(startIdx, endIdx);
    const lines = sectionContent.split('\n');
    const keyMap = new Map();
    const otherLines = [];

    lines.forEach(line => {
        const keyMatch = line.match(/^\s*"([^"]+)":\s*(.+),?$/);
        if (keyMatch) {
            const key = keyMatch[1];
            const value = keyMatch[2];
            keyMap.set(key, value);
        } else if (line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('...')) {
            // Keep other lines like comments or spread
            otherLines.push(line);
        }
    });

    // Reconstruct
    let newContent = '\n    ...' + (sectionName === 'km' ? 'km' : 'en') + 'Translations,\n';
    for (let [key, value] of keyMap) {
        newContent += `    "${key}": ${value.replace(/,$/, '')},\n`;
    }

    return content.substring(0, startIdx) + newContent + content.substring(endIdx);
}

content = deduplicateSection('km', content);
content = deduplicateSection('en', content);

fs.writeFileSync(filePath, content);
console.log('Deduplication complete!');
