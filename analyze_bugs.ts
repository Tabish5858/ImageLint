// Potential issues I'm analyzing:

// 1. updateReferences: replaceAll could match partial paths unintentionally
// Example: if you have images like "logo.png" and "logo-dark.png"
// Replacing "logo" would match both

// 2. getNonce: Using Math.random for nonce is weak, though not critical in this context

// 3. offsetToPosition: Assumes single-byte characters, could break with multibyte UTF-8

// 4. Test compilation error in test/tsconfig.json

// 5. ESLint config is .eslintrc.cjs but ESLint 9 wants eslint.config.js

// 6. gifsicle is called without error handling for missing binary
