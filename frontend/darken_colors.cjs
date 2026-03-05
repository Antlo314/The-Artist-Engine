const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const mappings = {
    'GigRadar.tsx': [
        // Make orange darker
        [/orange-300/g, 'orange-600'],
        [/orange-400/g, 'orange-700'],
        [/orange-500/g, 'orange-800'],
        [/orange-600/g, 'orange-900'],
        [/text-white/g, 'text-black'],
        [/border-white/g, 'border-gray-500'],
        [/text-gray-400/g, 'text-gray-800'],
        [/text-gray-500/g, 'text-gray-900'],
    ],
    'StudioCore.tsx': [
        // Make blue/cyan darker
        [/blue-300/g, 'blue-600'],
        [/blue-400/g, 'blue-800'],
        [/blue-500/g, 'blue-900'],
        [/blue-600/g, 'blue-950'],
        [/cyan-400/g, 'blue-800'],
        [/cyan-500/g, 'blue-900'],
        [/text-white/g, 'text-black'],
        [/border-white/g, 'border-gray-500'],
        [/text-gray-400/g, 'text-gray-800'],
        [/text-gray-500/g, 'text-gray-900'],
    ],
    'LegalCore.tsx': [
        [/purple-300/g, 'purple-700'],
        [/purple-400/g, 'purple-800'],
        [/purple-500/g, 'purple-900'],
        [/purple-600/g, 'purple-950'],
        [/border-white/g, 'border-gray-500'],
        [/text-white/g, 'text-black'],
    ],
    'ZionSentinel.tsx': [
        [/purple-300/g, 'purple-700'],
        [/purple-400/g, 'purple-800'],
        [/purple-500/g, 'purple-900'],
        [/purple-600/g, 'purple-950'],
        [/border-white/g, 'border-gray-500'],
        [/text-white/g, 'text-black'],
    ],
    'TheCodex.tsx': [
        [/purple-300/g, 'purple-700'],
        [/purple-400/g, 'purple-800'],
        [/purple-500/g, 'purple-900'],
        [/purple-600/g, 'purple-950'],
        [/border-white/g, 'border-gray-500'],
        [/text-white/g, 'text-black'],
        [/text-gray-400/g, 'text-gray-800'],
    ],
    'SplitSheetGenerator.tsx': [
        [/purple-300/g, 'purple-700'],
        [/purple-400/g, 'purple-800'],
        [/purple-500/g, 'purple-900'],
        [/purple-600/g, 'purple-950'],
        [/border-white/g, 'border-gray-500'],
        [/text-white/g, 'text-black'],
    ],
    'ArtistProfile.tsx': [
        // Make yellow darker to contrast with gray
        [/yellow-300/g, 'yellow-700'],
        [/yellow-400/g, 'yellow-800'],
        [/yellow-500/g, 'yellow-900'],
        [/yellow-600/g, 'orange-900'],
        [/text-white/g, 'text-black'],
        [/border-white/g, 'border-gray-500'],
        [/text-gray-400/g, 'text-gray-800'],
        [/text-gray-500/g, 'text-gray-900'],
        // Fix the specific invisible aliases
        [/text-yellow-300\/70/g, 'text-yellow-900/90'],
        [/text-yellow-500\/70/g, 'text-yellow-900'],
        [/bg-yellow-900\/20/g, 'bg-yellow-900/10'],
        [/text-yellow-500/g, 'text-yellow-900'],
        [/bg-yellow-500\/30/g, 'bg-yellow-900/20'],
        [/border-yellow-500\/30/g, 'border-yellow-900/50'],
    ]
};

files.forEach(file => {
    if (mappings[file]) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        mappings[file].forEach(([regex, replacement]) => {
            content = content.replace(regex, replacement);
        });

        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
});
