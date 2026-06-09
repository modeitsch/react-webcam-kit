# Professional Package Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a professional TypeScript npm package foundation for a React webcam library.

**Architecture:** The package will use a strict TypeScript source tree, a small public export surface, dual ESM/CJS builds, generated declarations, Vitest tests, ESLint flat config, Prettier formatting, and a Vite-powered example app placeholder. Public files must be polished and must not mention implementation tools or assistant tooling.

**Tech Stack:** TypeScript, React, tsup, Vitest, Testing Library, ESLint flat config, Prettier, Vite.

---

### Task 1: Package Metadata And Ignore Rules

**Files:**

- Create: `package.json`
- Create: `.gitignore`
- Create: `.npmignore`
- Create: `LICENSE`

- [ ] **Step 1: Create package metadata**

Create `package.json` with professional metadata, strict scripts, package exports, peer dependencies, and dev tooling.

```json
{
  "name": "@modeitsch/react-camera",
  "version": "0.1.0",
  "description": "A modern React camera component and hooks toolkit for webcam preview, capture, and device control.",
  "license": "MIT",
  "author": "modeitsch",
  "type": "module",
  "sideEffects": false,
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": ["react", "webcam", "camera", "media", "getusermedia", "typescript", "hooks"],
  "scripts": {
    "build": "tsup",
    "clean": "rimraf dist coverage",
    "dev": "vite --host 0.0.0.0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint . --max-warnings=0",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "verify": "npm run typecheck && npm run lint && npm run format:check && npm run test && npm run build",
    "prepublishOnly": "npm run verify"
  },
  "peerDependencies": {
    "react": ">=18.0.0 || >=19.0.0",
    "react-dom": ">=18.0.0 || >=19.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.29.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.5.1",
    "eslint": "^9.29.0",
    "eslint-config-prettier": "^10.1.5",
    "globals": "^15.15.0",
    "jsdom": "^26.1.0",
    "prettier": "^3.5.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "rimraf": "^6.0.1",
    "tsup": "^8.5.0",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.34.0",
    "vite": "^6.3.5",
    "vitest": "^3.2.3"
  }
}
```

- [ ] **Step 2: Create ignore rules**

Create `.gitignore`.

```gitignore
node_modules
dist
coverage
.DS_Store
.env
.env.*
!.env.example
*.log
```

Create `.npmignore`.

```gitignore
docs
examples
src
coverage
*.log
*.config.*
tsconfig*.json
vite.config.ts
vitest.setup.ts
```

- [ ] **Step 3: Create license**

Create `LICENSE` using the MIT License with the owner name `modeitsch`.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore .npmignore LICENSE
git commit -m "chore: add package metadata"
```

### Task 2: TypeScript And Build Configuration

**Files:**

- Create: `tsconfig.json`
- Create: `tsconfig.build.json`
- Create: `tsup.config.ts`
- Create: `src/index.ts`
- Create: `src/types.ts`

- [ ] **Step 1: Add TypeScript configuration**

Create `tsconfig.json`.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "examples", "*.config.ts", "vitest.setup.ts"]
}
```

Create `tsconfig.build.json`.

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": false,
    "noEmit": false,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Add tsup configuration**

Create `tsup.config.ts`.

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime'],
});
```

- [ ] **Step 3: Add initial public types**

Create `src/types.ts`.

```ts
import type { ReactNode } from 'react';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'stopping'
  | 'stopped'
  | 'denied'
  | 'unsupported'
  | 'error';

export type ScreenshotFormat = 'image/webp' | 'image/png' | 'image/jpeg';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  format?: ScreenshotFormat;
  quality?: number;
  mirrored?: boolean;
  imageSmoothing?: boolean;
  forceSourceSize?: boolean;
  minWidth?: number;
  minHeight?: number;
}

export interface CameraError {
  name: string;
  message: string;
  type:
    | 'unsupported'
    | 'permission-denied'
    | 'not-found'
    | 'not-readable'
    | 'overconstrained'
    | 'security'
    | 'unknown';
  cause?: unknown;
}

export interface WebcamFallbackProps {
  status: CameraStatus;
  error: CameraError | null;
}

export type WebcamFallback = ReactNode | ((props: WebcamFallbackProps) => ReactNode);
```

Create `src/index.ts`.

```ts
export type {
  CameraError,
  CameraStatus,
  ScreenshotFormat,
  ScreenshotOptions,
  WebcamFallback,
  WebcamFallbackProps,
} from './types';
```

- [ ] **Step 4: Run build checks**

Run: `npm run typecheck && npm run build`

Expected: both commands pass and `dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts` exist.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json tsconfig.build.json tsup.config.ts src
git commit -m "chore: add TypeScript build setup"
```

### Task 3: ESLint And Prettier

**Files:**

- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.prettierignore`

- [ ] **Step 1: Add ESLint flat config**

Create `eslint.config.js`.

```js
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  prettier,
);
```

- [ ] **Step 2: Add Prettier config**

Create `.prettierrc.json`.

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

Create `.prettierignore`.

```gitignore
node_modules
dist
coverage
package-lock.json
```

- [ ] **Step 3: Run lint and format check**

Run: `npm run lint && npm run format:check`

Expected: both commands pass or Prettier reports files to format.

- [ ] **Step 4: Format if needed**

Run: `npm run format`

Expected: Prettier formats repository files.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js .prettierrc.json .prettierignore .
git commit -m "chore: add lint and format tooling"
```

### Task 4: Test Harness

**Files:**

- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/index.test.ts`

- [ ] **Step 1: Add Vitest configuration**

Create `vitest.config.ts`.

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
```

Create `vitest.setup.ts`.

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Add export smoke test**

Create `src/index.test.ts`.

```ts
import { describe, expect, it } from 'vitest';

import type { CameraStatus, ScreenshotOptions } from './index';

describe('public types', () => {
  it('exposes camera status and screenshot option types', () => {
    const status: CameraStatus = 'idle';
    const options: ScreenshotOptions = {
      format: 'image/jpeg',
      quality: 0.92,
    };

    expect(status).toBe('idle');
    expect(options.format).toBe('image/jpeg');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm run test`

Expected: test passes.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts vitest.setup.ts src/index.test.ts
git commit -m "test: add Vitest harness"
```

### Task 5: Public README And Example Shell

**Files:**

- Create: `README.md`
- Create: `examples/basic/package.json`
- Create: `examples/basic/index.html`
- Create: `examples/basic/src/main.tsx`

- [ ] **Step 1: Add polished README**

Create `README.md` with a professional package overview, install command,
status note, and roadmap. Do not mention assistant tooling.

- [ ] **Step 2: Add example app shell**

Create a Vite React example under `examples/basic` that renders a simple heading
and states that camera controls will be added as the core API lands.

- [ ] **Step 3: Run full verification**

Run: `npm run verify`

Expected: typecheck, lint, format check, tests, and build all pass.

- [ ] **Step 4: Commit**

```bash
git add README.md examples
git commit -m "docs: add package README and example shell"
```
