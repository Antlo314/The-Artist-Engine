const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const mappings = [
    // Purple -> Black/Gray/Red
    [/text-purple-900/g, 'text-black'],
    [/text-purple-800/g, 'text-gray-900'],
    [/text-purple-[4-7]00/g, 'text-gray-800'],
    [/border-purple-/g, 'border-gray-'],
    [/bg-purple-/g, 'bg-gray-'],
    [/text-purple-/g, 'text-gray-'],

    // Blue -> Black/Gray/Red
    [/text-blue-900/g, 'text-black'],
    [/text-blue-800/g, 'text-gray-900'],
    [/text-blue-[4-7]00/g, 'text-gray-800'],
    [/border-blue-/g, 'border-gray-'],
    [/bg-blue-/g, 'bg-gray-'],
    [/text-blue-/g, 'text-gray-'],

    // Cyan -> Black/Red
    [/text-cyan-900/g, 'text-black'],
    [/text-cyan-800/g, 'text-gray-900'],
    [/text-cyan-[4-7]00/g, 'text-red-700'],
    [/border-cyan-/g, 'border-red-'],
    [/bg-cyan-/g, 'bg-red-'],
    [/text-cyan-/g, 'text-red-'],

    // Green/Emerald/Yellow/Amber -> Gray/Red
    [/text-green-/g, 'text-gray-'],
    [/border-green-/g, 'border-gray-'],
    [/bg-green-/g, 'bg-gray-'],
    [/emerald/g, 'gray'],
    [/text-yellow-/g, 'text-gray-'],
    [/bg-yellow-/g, 'bg-gray-'],
    [/border-yellow-/g, 'border-gray-'],
    [/amber-/g, 'gray-']
];

files.forEach(file => {
    // Skip ZionSentinel as we already styled it manually with specific red highlights
    if (file === 'ZionSentinel.tsx') return;

    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    mappings.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
    });

    fs.writeFileSync(filePath, content);
});
console.log('Colors replaced in components.');
