import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'src/generated/**',
            'prisma/**'
        ],
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    }
);