module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    // File size enforcement - Maximum 400 lines per file
    'max-lines': ['error', {
      max: 400,
      skipBlankLines: true,
      skipComments: true
    }],
    
    // Function size limits to encourage modularity
    'max-lines-per-function': ['warn', {
      max: 50,
      skipBlankLines: true,
      skipComments: true
    }],
    
    // Class size limits
    'max-classes-per-file': ['error', 1],
    
    // Complexity limits to encourage splitting
    'complexity': ['warn', 10],
    'max-depth': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'max-params': ['error', 5],
    
    // Import organization for better modularity
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: false,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      allowSeparatedGroups: false
    }],
    
    // Encourage proper exports for modularity
    'prefer-const': 'error',
    'no-var': 'error',
    
    // TypeScript specific rules for better modularity
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-interface': 'off',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    
    // Modularity encouraging rules
    'no-duplicate-imports': 'error',
    'import/no-circular': 'off', // Would need eslint-plugin-import
    
    // Documentation for public APIs
    'require-jsdoc': ['warn', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true,
        ArrowFunctionExpression: false,
        FunctionExpression: false
      }
    }]
  },
  overrides: [
    {
      // Stricter rules for main source files
      files: ['src/**/*.ts'],
      excludedFiles: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      rules: {
        'max-lines': ['error', {
          max: 400,
          skipBlankLines: true,
          skipComments: true
        }]
      }
    },
    {
      // More lenient rules for test files
      files: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'test/**/*.ts'],
      rules: {
        'max-lines': ['warn', {
          max: 500,
          skipBlankLines: true,
          skipComments: true
        }],
        '@typescript-eslint/no-explicit-any': 'off',
        'require-jsdoc': 'off'
      }
    },
    {
      // Special rules for CLI files (can be slightly larger due to command definitions)
      files: ['src/cli/**/*.ts'],
      rules: {
        'max-lines': ['error', {
          max: 450,
          skipBlankLines: true,
          skipComments: true
        }]
      }
    }
  ]
};
