#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to check file modularity and enforce size limits
 */

const MAX_LINES = 400;
const WARN_LINES = 300;
const TARGET_LINES = 200;

const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Count non-empty, non-comment lines
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*') && 
             !trimmed.startsWith('*') &&
             !trimmed.startsWith('*/');
    });
    
    return {
      total: lines.length,
      code: codeLines.length
    };
  } catch (error) {
    return { total: 0, code: 0 };
  }
}

function analyzeFile(filePath) {
  const { total, code } = countLines(filePath);
  const relativePath = path.relative(process.cwd(), filePath);
  
  let status = 'good';
  let color = colors.green;
  let message = '';
  
  if (code > MAX_LINES) {
    status = 'critical';
    color = colors.red;
    message = 'IMMEDIATE REFACTORING REQUIRED';
  } else if (code > WARN_LINES) {
    status = 'warning';
    color = colors.yellow;
    message = 'Consider splitting';
  } else if (code > TARGET_LINES) {
    status = 'caution';
    color = colors.blue;
    message = 'Monitor growth';
  } else {
    message = 'Good size';
  }
  
  return {
    file: relativePath,
    total,
    code,
    status,
    color,
    message
  };
}

function scanDirectory(dir, extensions = ['.ts', '.js']) {
  const results = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, dist, and .git directories
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(item)) {
          scan(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          results.push(analyzeFile(fullPath));
        }
      }
    }
  }
  
  scan(dir);
  return results;
}

function generateReport(results) {
  console.log(`${colors.blue}📊 File Modularity Report${colors.reset}\n`);
  
  // Sort by code lines descending
  results.sort((a, b) => b.code - a.code);
  
  const critical = results.filter(r => r.status === 'critical');
  const warnings = results.filter(r => r.status === 'warning');
  const cautions = results.filter(r => r.status === 'caution');
  const good = results.filter(r => r.status === 'good');
  
  // Summary
  console.log(`${colors.blue}📋 Summary:${colors.reset}`);
  console.log(`  Total files: ${results.length}`);
  console.log(`  ${colors.red}Critical (>${MAX_LINES} lines): ${critical.length}${colors.reset}`);
  console.log(`  ${colors.yellow}Warning (>${WARN_LINES} lines): ${warnings.length}${colors.reset}`);
  console.log(`  ${colors.blue}Caution (>${TARGET_LINES} lines): ${cautions.length}${colors.reset}`);
  console.log(`  ${colors.green}Good (≤${TARGET_LINES} lines): ${good.length}${colors.reset}\n`);
  
  // Critical files (need immediate attention)
  if (critical.length > 0) {
    console.log(`${colors.red}🚨 Files requiring immediate refactoring:${colors.reset}`);
    critical.forEach(result => {
      console.log(`  ${result.color}${result.file} (${result.code} lines) - ${result.message}${colors.reset}`);
    });
    console.log();
  }
  
  // Warning files
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Files to consider for refactoring:${colors.reset}`);
    warnings.forEach(result => {
      console.log(`  ${result.color}${result.file} (${result.code} lines) - ${result.message}${colors.reset}`);
    });
    console.log();
  }
  
  // Top 10 largest files
  console.log(`${colors.blue}📏 Top 10 largest files:${colors.reset}`);
  results.slice(0, 10).forEach((result, index) => {
    console.log(`  ${index + 1}. ${result.color}${result.file} (${result.code} lines)${colors.reset}`);
  });
  console.log();
  
  // Suggestions
  if (critical.length > 0 || warnings.length > 0) {
    console.log(`${colors.blue}💡 Refactoring suggestions:${colors.reset}`);
    console.log('  1. Split large classes into smaller, focused components');
    console.log('  2. Extract utility functions into separate files');
    console.log('  3. Separate API logic from data transformation');
    console.log('  4. Move constants and types to dedicated files');
    console.log('  5. Use composition over inheritance');
    console.log(`  6. Refer to .github/copilot-modularity-rules.md for detailed guidance${colors.reset}\n`);
  }
  
  // Return exit code based on critical files
  return critical.length > 0 ? 1 : 0;
}

// Main execution
function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error(`${colors.red}Error: src directory not found${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.blue}🔍 Scanning TypeScript files in src/...${colors.reset}\n`);
  
  const results = scanDirectory(srcDir);
  const exitCode = generateReport(results);
  
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeFile,
  scanDirectory,
  generateReport,
  countLines
};
