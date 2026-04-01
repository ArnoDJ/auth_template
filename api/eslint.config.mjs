// @ts-check
import eslint from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  {
    ignores: ["eslint.config.mjs"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // ✅ Formatting
      quotes: ["error", "double", { avoidEscape: true }],
      semi: ["error", "never"],
      indent: "off",
      "comma-spacing": "off",
      "object-curly-spacing": "off",
      "padded-blocks": "off",
      "space-before-blocks": "off",
      "space-before-function-paren": "off",
      "keyword-spacing": "off",

      // ⚙️ General Rules
      "no-unused-expressions": ["warn"],
      "@typescript-eslint/no-unused-vars": "off",
      camelcase: "off",
      "@typescript-eslint/interface-name-prefix": "off",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "no-extra-parens": ["error"],
      "no-throw-literal": ["error"],

      // ✅ TypeScript Best Practices
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/prefer-literal-enum-member": "error",
      "@typescript-eslint/prefer-enum-initializers": "error",
      "@typescript-eslint/prefer-includes": "error",
      "@typescript-eslint/prefer-for-of": "error",
      "@typescript-eslint/no-dynamic-delete": "error",
      "@typescript-eslint/no-dupe-class-members": "error",
      "@typescript-eslint/no-invalid-void-type": ["error", { allowInGenericTypeArguments: true }],
      "@typescript-eslint/no-unused-expressions": "error",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/return-await": ["error", "always"],
      "@typescript-eslint/method-signature-style": ["error", "property"],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-confusing-non-null-assertion": "error",
      "@typescript-eslint/no-invalid-this": "error",
      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "allow-as-parameter",
        },
      ],
      "@typescript-eslint/class-literal-property-style": ["error", "fields"],
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": [
        "error",
        { allowComparingNullableBooleansToTrue: false },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "variableLike", format: ["camelCase"] },
        { selector: "method", format: ["camelCase"] },
        { selector: "function", format: ["camelCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["UPPER_CASE"] },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "should", "has", "can", "did", "will"],
        },
        {
          selector: "parameter",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "should", "has", "can", "did", "will"],
        },
        {
          selector: "parameterProperty",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "should", "has", "can", "did", "will"],
        },
        {
          selector: "accessor",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "should", "has", "can", "did", "will"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          trailingUnderscore: "allow",
        },
      ],

      // Style
      "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
      "padding-line-between-statements": [
        "error",
        { blankLine: "never", prev: "*", next: "block-like" },
        { blankLine: "always", prev: "block", next: "*" },
        { blankLine: "never", prev: "import", next: "import" },
        { blankLine: "always", prev: "import", next: "block-like" },
        {
          blankLine: "always",
          prev: "multiline-block-like",
          next: "multiline-block-like",
        },
      ],
    },
  }
)
