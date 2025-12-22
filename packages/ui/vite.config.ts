import tailwindcss from '@tailwindcss/vite';
import { glob } from 'glob';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamically generate entry points for all components
const componentFiles = glob.sync('src/components/**/index.tsx', {
  cwd: __dirname,
  absolute: false
});

// Dynamically generate entry points for all CSS files in src/styles
const cssFiles = glob.sync('src/styles/*.css', {
  cwd: __dirname,
  absolute: false
});

const entry: Record<string, string> = {
  index: resolve(__dirname, 'src/index.ts')
};

// Create entry points for each component
componentFiles.forEach((file: string) => {
  const entryName = file
    .replace('src/', '')
    .replace('/index.tsx', '')
    .replace('.tsx', '');
  entry[entryName] = resolve(__dirname, file);
});

// Create entry points for each CSS file
cssFiles.forEach((file: string) => {
  const entryName = file.replace('src/', '').replace('.css', '');
  entry[entryName] = resolve(__dirname, file);
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    libInjectCss(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      rollupTypes: false,
      outDir: 'dist',
      entryRoot: 'src'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    copyPublicDir: false,
    cssCodeSplit: true,
    lib: {
      entry,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: [
        {
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: 'es/[name].js',
          chunkFileNames: 'es/[name].js',
          /**
           * Customize asset file names to keep CSS files organized
           */
          assetFileNames: (assetInfo) => {
            // Keep CSS files with their original names in a styles folder
            if (assetInfo.name?.endsWith('.css')) {
              return 'styles/[name][extname]';
            }
            return 'assets/[name][extname]';
          }
        },
        {
          format: 'cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: 'cjs/[name].js',
          chunkFileNames: 'cjs/[name].js',
          /**
           * Customize asset file names to keep CSS files organized
           */
          assetFileNames: (assetInfo) => {
            // Keep CSS files with their original names in a styles folder
            if (assetInfo.name?.endsWith('.css')) {
              return 'styles/[name][extname]';
            }
            return 'assets/[name][extname]';
          }
        }
      ]
    }
  }
});
