import tailwindcss from '@tailwindcss/vite';
import { glob } from 'glob';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamically generate entry points for all components
const componentFiles = glob.sync('src/components/**/index.tsx', {
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    dts({
      tsconfigPath: './tsconfig.json',
      include: ['src'],
      rollupTypes: false,
      outDir: 'dist'
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
          chunkFileNames: 'es/[name].js'
        },
        {
          format: 'cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: 'cjs/[name].js',
          chunkFileNames: 'cjs/[name].js'
        }
      ]
    }
  }
});
