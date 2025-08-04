import { defineConfig, UserConfig, ConfigEnv } from 'vite';
import path from 'path';

export default defineConfig((env: ConfigEnv): UserConfig => {
  let common: UserConfig = {
    server: {
      port: 5000,
    },
    root: './',
    base: '/',
    publicDir: './public',
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@framework': path.resolve(__dirname, '../../../Framework/src'),
      }
    },
    build: {
      target: 'modules',
      assetsDir: 'assets',
      outDir: './dist',
      sourcemap: env.mode == 'development' ? true : false,
      lib: {
        entry: path.resolve(__dirname, 'src/main.ts'),
        name: 'CubismDemo',
        fileName: (format) => `cubism-demo.${format}.js`,
        formats: ['umd', 'es']
      },
      rollupOptions: {
        external: ['Live2DCubismCore'],
        output: {
          globals: {
            'Live2DCubismCore': 'Live2DCubismCore'
          }
        }
      }
    },
  };
  return common;
});
