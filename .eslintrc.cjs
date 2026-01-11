module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    'react-hooks',
    '@typescript-eslint',
    'import',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React規則
    'react/prop-types': 'off', // 使用TypeScript進行類型檢查
    'react/react-in-jsx-scope': 'off', // React 17+ 不需要
    '@typescript-eslint/no-explicit-any': 'warn',

    // 架構層次依賴規則
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Layer 4 (UI) 不能直接引用 Layer 2 (Domain)
          {
            target: './src/layers/4-ui',
            from: './src/layers/2-domain',
            message: '❌ UI layer 不能直接引用 Domain layer。請通過 Business layer (Layer 3) 引用。',
          },

          // Layer 4 (UI) 不能直接引用 Layer 1 (Data)
          {
            target: './src/layers/4-ui',
            from: './src/layers/1-data',
            message: '❌ UI layer 不能直接引用 Data layer。請通過 Business layer (Layer 3) 引用。',
          },

          // Layer 3 (Business) 不能直接引用 Layer 1 (Data)
          {
            target: './src/layers/3-business',
            from: './src/layers/1-data',
            message: '❌ Business layer 不能直接引用 Data layer。請通過 Domain layer (Layer 2) 引用。',
          },

          // Layer 2 (Domain) 不能引用 React（保持框架無關）
          {
            target: './src/layers/2-domain',
            from: 'react',
            message: '❌ Domain layer 必須保持框架無關，不能引用 React。',
          },

          // Layer 2 (Domain) 不能引用上層
          {
            target: './src/layers/2-domain',
            from: './src/layers/3-business',
            message: '❌ Domain layer 不能引用 Business layer。依賴方向錯誤。',
          },
          {
            target: './src/layers/2-domain',
            from: './src/layers/4-ui',
            message: '❌ Domain layer 不能引用 UI layer。依賴方向錯誤。',
          },

          // Layer 1 (Data) 不能引用 React
          {
            target: './src/layers/1-data',
            from: 'react',
            message: '❌ Data layer 必須保持框架無關，不能引用 React。',
          },

          // Layer 1 (Data) 不能引用上層
          {
            target: './src/layers/1-data',
            from: './src/layers/2-domain',
            message: '❌ Data layer 不能引用 Domain layer。依賴方向錯誤。',
          },
          {
            target: './src/layers/1-data',
            from: './src/layers/3-business',
            message: '❌ Data layer 不能引用 Business layer。依賴方向錯誤。',
          },
          {
            target: './src/layers/1-data',
            from: './src/layers/4-ui',
            message: '❌ Data layer 不能引用 UI layer。依賴方向錯誤。',
          },
        ],
      },
    ],
  },
};
