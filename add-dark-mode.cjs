const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replacements
    content = content.replace(/bg-white(?!\/)/g, 'bg-white dark:bg-slate-900');
    content = content.replace(/bg-slate-50(?!\/)/g, 'bg-slate-50 dark:bg-slate-950');
    content = content.replace(/bg-slate-100(?!\/)/g, 'bg-slate-100 dark:bg-slate-800');
    content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-white');
    content = content.replace(/text-slate-700/g, 'text-slate-700 dark:text-slate-200');
    content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
    content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-800');
    content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-700');
    
    // Fix potential double dark classes if they already existed
    content = content.replace(/dark:bg-slate-900 dark:bg-slate-900/g, 'dark:bg-slate-900');
    content = content.replace(/dark:bg-slate-950 dark:bg-slate-950/g, 'dark:bg-slate-950');
    content = content.replace(/dark:bg-slate-800 dark:bg-slate-800/g, 'dark:bg-slate-800');
    content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
    content = content.replace(/dark:text-slate-200 dark:text-slate-200/g, 'dark:text-slate-200');
    content = content.replace(/dark:text-slate-300 dark:text-slate-300/g, 'dark:text-slate-300');
    content = content.replace(/dark:text-slate-400 dark:text-slate-400/g, 'dark:text-slate-400');
    content = content.replace(/dark:border-slate-800 dark:border-slate-800/g, 'dark:border-slate-800');
    content = content.replace(/dark:border-slate-700 dark:border-slate-700/g, 'dark:border-slate-700');

    fs.writeFileSync(filePath, content, 'utf8');
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

processFile('./App.tsx');
walkDir('./components');
console.log('Done');
