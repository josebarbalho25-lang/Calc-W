/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { servidorDePdf } from './scripts/servidorDePdf.ts';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));

/*
  ⚠️ PORTA 5180, NÃO 5173. A 5173 é a do A-PORT: com os dois abertos, o
  segundo a subir pegaria outra porta calado e o atalho do ABRIR.bat abriria o
  programa errado.
*/
export default defineConfig({
  plugins: [react(), servidorDePdf(RAIZ)],
  server: { port: 5180, strictPort: true, open: false },
  preview: { port: 5181, strictPort: true },
  // O pedaço do 3D passa de 500 kB (é o three.js) e carrega só quando a janela
  // dos comprimentos abre — o aviso de tamanho não diz nada novo.
  build: { target: 'es2022', chunkSizeWarningLimit: 1100 },
  test: { exclude: [...configDefaults.exclude, '.claude/**'] },
});
