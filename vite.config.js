import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.tsx'),
      name: 'bpenvModeler',
      fileName: 'bpenv-modeler',
      formats: ['es'], // oppure 'umd' se vuoi compatibilità <script>
    },
    rollupOptions: {
      // Estrai React come peerDependency
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      '5174-iyshibp2l4h67ue67g6k7-af56deff.manus.computer',
      '.manus.computer'
    ]
  }
})
