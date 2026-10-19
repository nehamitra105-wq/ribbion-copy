import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
for (const file of ['dist/index.html','dist/styles.css','dist/app.js','dist/gift.html','dist/gift.css','dist/gift.js']) {
 if (!existsSync(file)) throw new Error(`Missing ${file}`);
}
for(const file of ['dist/app.js','dist/gift.js'])execFileSync(process.execPath,['--check',file]);
const html=readFileSync('dist/index.html','utf8');
if(!html.includes('name="viewport"')) throw new Error('Missing mobile viewport');
console.log('Static build checked: HTML, CSS, JavaScript, and portable recipient views ready.');
