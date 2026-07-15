import fs from 'fs';
import path from 'path';

// Usage: node scripts/translate-helper.js <path-to-react-file> [key-prefix]
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log('Usage: node scripts/translate-helper.js <path-to-react-file> [key-prefix]');
  process.exit(1);
}

const targetPath = path.resolve(args[0]);
const prefix = args[1] || 'key';

if (!fs.existsSync(targetPath)) {
  console.error(`File not found: ${targetPath}`);
  process.exit(1);
}

let content = fs.readFileSync(targetPath, 'utf8');

// Regex patterns to find hardcoded English strings:
// 1. Text inside tag: >Some Text Here< (excluding code tags, JS brackets, imports, etc.)
// 2. Prop strings: label="Some Label", placeholder="Enter text", title="Hello"
const textInsideTagPattern = />([^<>{}\n\r\t]+)</g;
const propStringPattern = /\b(placeholder|label|title|text|desc|heading|subject)="([^"]+)"/g;

const foundStrings = new Map();
let keyIndex = 1;

// Find tag text
let match;
while ((match = textInsideTagPattern.exec(content)) !== null) {
  const text = match[1].trim();
  if (text && text.length > 1 && !/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(text) && !foundStrings.has(text)) {
    const suggestedKey = `${prefix}_${text.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase()}`.replace(/_$/, '');
    foundStrings.set(text, { key: suggestedKey, type: 'tag', rawMatch: match[0] });
  }
}

// Find prop strings
while ((match = propStringPattern.exec(content)) !== null) {
  const prop = match[1];
  const text = match[2].trim();
  if (text && text.length > 1 && !/^[0-9\s.,\/#!$%\^&\*;:{}=\-_`~()]+$/.test(text) && !foundStrings.has(text)) {
    const suggestedKey = `${prefix}_${text.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').toLowerCase()}`.replace(/_$/, '');
    foundStrings.set(text, { key: suggestedKey, type: 'prop', prop, rawMatch: match[0] });
  }
}

if (foundStrings.size === 0) {
  console.log('No hardcoded strings detected.');
  process.exit(0);
}

console.log(`\n🔍 Found ${foundStrings.size} hardcoded strings in: ${path.basename(targetPath)}`);
console.log('==================================================');

// Generate translations block
const translationsBlock = {};
foundStrings.forEach((value, text) => {
  translationsBlock[value.key] = text;
});

console.log('\n📥 Translations JSON to paste into translations.js (en section):');
console.log(JSON.stringify(translationsBlock, null, 2));

// Generate updated file
let updatedContent = content;

// Sort by length descending to avoid replacing substrings inside longer strings
const sortedTexts = Array.from(foundStrings.keys()).sort((a, b) => b.length - a.length);

for (const text of sortedTexts) {
  const info = foundStrings.get(text);
  if (info.type === 'tag') {
    // Replace text inside tag with {t('key')}
    // Escaping regex special chars in text
    const escapedText = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`>(\\s*)${escapedText}(\\s*)<`, 'g');
    updatedContent = updatedContent.replace(regex, `>{t('${info.key}')}<`);
  } else if (info.type === 'prop') {
    // Replace prop="text" with prop={t('key')}
    const escapedText = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${info.prop}="${escapedText}"`, 'g');
    updatedContent = updatedContent.replace(regex, `${info.prop}={t('${info.key}')}`);
  }
}

// Write the preview/update suggestion
const outputPath = targetPath.replace(/\.jsx?$/, '.translated.jsx');
fs.writeFileSync(outputPath, updatedContent, 'utf8');

console.log('\n🚀 Generated translated file preview:');
console.log(`👉 ${outputPath}`);
console.log('Review it and overwrite your original file if you are happy with the changes!');
console.log('Don\'t forget to import t: const { t } = useLang(); at the top of your component!\n');
