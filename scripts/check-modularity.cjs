const fs = require('fs');
const path = require('path');

/**
 * Check modularity rules for TypeScript files
 * Ensures no file exceeds the maximum line limit
 */
function checkModularity() {
  const srcDir = path.join(__dirname, '../src');
  const maxLines = 400;
  const warningLines = 300;
  
  function getLineCount(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  }
  
  function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    const issues = [];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        issues.push(...checkDirectory(filePath));
      } else if (file.endsWith('.ts')) {
        const lineCount = getLineCount(filePath);
        const relativePath = path.relative(srcDir, filePath);
        
        if (lineCount > maxLines) {
          issues.push({
            type: 'error',
            file: relativePath,
            lines: lineCount,
            message: `File exceeds ${maxLines} lines (${lineCount} lines) - IMMEDIATE refactoring required`
          });
        } else if (lineCount > warningLines) {
          issues.push({
            type: 'warning',
            file: relativePath,
            lines: lineCount,
            message: `File approaching limit (${lineCount} lines) - consider refactoring`
          });
        }
      }
    }
    
    return issues;
  }
  
  console.log('🔍 Checking file modularity...\n');
  
  const issues = checkDirectory(srcDir);
  
  if (issues.length === 0) {
    console.log('✅ All files comply with modularity rules!');
    return;
  }
  
  const errors = issues.filter(issue => issue.type === 'error');
  const warnings = issues.filter(issue => issue.type === 'warning');
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.forEach(warning => {
      console.log(`   ${warning.file}: ${warning.message}`);
    });
    console.log('');
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.forEach(error => {
      console.log(`   ${error.file}: ${error.message}`);
    });
    console.log('');
    console.log('Please refactor files exceeding the line limit before proceeding.');
    process.exit(1);
  }
}

if (require.main === module) {
  checkModularity();
}

module.exports = { checkModularity };
