const fs = require('fs');
const path = require('path');

const files = [
  'GigRadar.tsx',
  'LegalCore.tsx',
  'ZionSentinel.tsx',
  'TheCodex.tsx',
  'RecoupmentSandbox.tsx',
  'SplitSheetGenerator.tsx',
  'StudioCore.tsx'
].map(f => path.join(__dirname, 'src/components', f));

// Targeted regex specifically for the feature tab colors requested by the user.
// (orange, purple, blue, sky, cyan, fuchsia, amber, red)
const colorRegex = /(?<![a-z\-]:)\b(text-(?:orange|purple|fuchsia|blue|sky|cyan|amber|red|indigo)-(?:[1-9]00|50)(?:\/\d+)?)\b(?! drop-shadow-\[0_1px_1px_rgba\(0,0,0,0\.8\)\])/g;

files.forEach(f => {
  if (!fs.existsSync(f)) {
      console.log('Skipping missing file: ' + f);
      return;
  }
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content.replace(colorRegex, "$1 font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]");
  fs.writeFileSync(f, newContent);
  console.log('Updated ' + f);
});
