import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './estilo/tokens.css';
import './estilo/base.css';
import './estilo/componentes.css';
import './estilo/calculadora.css';
import { App } from './App';
import { aplicarTema, lerTema, type Tema } from './estilo/preferenciasDaInterface';

// O tema guardado entra antes do primeiro desenho: sem isto a tela piscava
// escura e trocava.
// `&tema=modern` no endereço vale só para o print sem janela (não grava).
const doEndereco = /[#&]tema=(dark|modern|paper)/.exec(location.hash)?.[1] as Tema | undefined;
aplicarTema(doEndereco ?? lerTema());

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
