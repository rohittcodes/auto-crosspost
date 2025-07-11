const fs = require('fs');
const path = require('path');

/**
 * Fix CLI shebang for proper execution
 * Adds shebang line to CLI files after TypeScript compilation
 */
function fixShebang() {
  const cliFiles = [
    path.join(__dirname, '../dist/cli/index.js'),
    path.join(__dirname, '../dist/cli/batch.js')
  ];

  const shebang = '#!/usr/bin/env node\n';

  cliFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check if shebang already exists
      if (!content.startsWith('#!')) {
        const newContent = shebang + content;
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Added shebang to ${path.relative(process.cwd(), filePath)}`);
      } else {
        console.log(`✅ Shebang already exists in ${path.relative(process.cwd(), filePath)}`);
      }
    } else {
      console.log(`⚠️  File not found: ${path.relative(process.cwd(), filePath)}`);
    }
  });
}

if (require.main === module) {
  fixShebang();
}

module.exports = { fixShebang };
