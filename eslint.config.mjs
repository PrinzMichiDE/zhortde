import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // WCAG 2.1 AA / 2.2: Enforce accessible React patterns via jsx-a11y.
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      // Elements must use appropriate role attribute.
      "jsx-a11y/role-has-required-aria-props": "error",
      // Elements with ARIA roles must have all required attributes.
      "jsx-a11y/aria-props": "error",
      // ARIA attributes must be used with correct values for their role.
      "jsx-a11y/aria-unsupported-elements": "error",
      // HTML elements must have valid, supported ARIA roles.
      "jsx-a11y/role-supports-aria-props": "error",
      // Alt text should be descriptive and not just "image".
      "jsx-a11y/alt-text": ["error", { elements: ["img"], components: ["Image", "Picture"] }],
      // All anchor elements must have accessible content or aria-label.
      "jsx-a11y/anchor-has-content": ["error", { components: [] }],
      // Elements using ARIA labels must have non-empty values.
      "jsx-a11y/aria-label": "error",
      // Auto-complete should be explicit to prevent data leaks.
      "jsx-a11y/autocomplete-valid": "error",
      // Click events should not rely solely on mouse (tactile + keyboard).
      "jsx-a11y/click-events-have-key-events": "error",
      // Media elements must have captions.
      "jsx-a11y/media-has-caption": "warn",
      // Accessible heading hierarchy (no skipping levels).
      "jsx-a11y/heading-has-content": "error",
      // HTML5 semantic elements should have appropriate ARIA roles.
      "jsx-a11y/no-duplicate-aria-id": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-noninteractive-element-to-interactive-role": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      // Label must be associated with a form control.
      "jsx-a11y/label-has-associated-control": "error",
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
