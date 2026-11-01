// ═══════════════════════════════════════════════════════════════════════════
//  motor/combinados.ts — força axial com momentos (NBR 8800:2024, 5.5.1.2)
// ---------------------------------------------------------------------------
//  A interação usa a resistência axial QUE SE APLICA: Nt,Rd se a barra
//  traciona, Nc,Rd se comprime. A planilha tinha dois campos e tomava a maior
//  das duas razões; aqui o N tem sinal (positivo comprime, como no A-PORT) e
//  a escolha é direta.
//
//  Os momentos entram em módulo: a equação de interação é de valores
//  absolutos — o sinal só diz qual mesa comprime, e o Mx,Rd já é o da mesa
//  mais desfavorável.
// ═══════════════════════════════════════════════════════════════════════════

import { fr, n, par, situacaoPelaRazao, v, x, type Passo, type Verificacao } from './memoria';

export interface ResultadoCombinado {
  razaoN: number;
  razaoMx: number;
  razaoMy: number;
  /** a) NSd/NRd ≥ 0,2 ou b) abaixo. */
  alinea: 'a' | 'b';
  valor: number;
  verificacao: Verificacao;
}

export function verificarCombinados(
  N: number,
  NtRd: number,
  NcRd: number,
  Mx: number,
  MxRd: number,
  My: number,
  MyRd: number,
): ResultadoCombinado {
  const comprime = N > 0;
  const NRd = comprime ? NcRd : NtRd;
  const NSd = Math.abs(N);
  const razaoN = NSd / NRd;
  const razaoMx = Math.abs(Mx) / MxRd;
  const razaoMy = Math.abs(My) / MyRd;
  const alinea = razaoN >= 0.2 ? 'a' : 'b';
  const valor = alinea === 'a' ? razaoN + (8 / 9) * (razaoMx + razaoMy) : razaoN / 2 + (razaoMx + razaoMy);

  const iN = comprime ? 'c,' : 't,';
  const momentos = x(fr(v('M', 'x,Sd'), v('M', 'x,Rd')), ' + ', fr(v('M', 'y,Sd'), v('M', 'y,Rd')));
  const momentosN = x(fr(n(Math.abs(Mx)), n(MxRd)), ' + ', fr(n(Math.abs(My)), n(MyRd)));

  const passos: Passo[] = [
    {
      ref: '5.5.1.2',
      titulo: 'Equação de interação',
      contas: [
        {
          simbolo: fr(v('N', 'Sd'), v('N', 'Rd')),
          numeros: fr(n(NSd), n(NRd)),
          valor: razaoN,
          casas: 3,
          rotulo: `${N === 0 ? 'sem força axial' : comprime ? `compressão, N${iN}Rd` : `tração, N${iN}Rd`} · ${alinea === 'a' ? '≥ 0,2 → alínea a)' : '< 0,2 → alínea b)'}`,
        },
        // A fórmula da alínea fica no lugar do símbolo: a interação não tem
        // nome próprio, e "a) = …" se lia como se "a)" fosse uma grandeza.
        alinea === 'a'
          ? {
              simbolo: x(fr(v('N', 'Sd'), v('N', 'Rd')), ' + ', fr(8, 9), ' ', par(momentos)),
              numeros: x(n(razaoN, 3), ' + ', fr(8, 9), ' · ', par(momentosN)),
              valor,
              casas: 3,
              rotulo: `alínea a) · ${valor <= 1 ? '≤ 1,0' : '> 1,0'}`,
            }
          : {
              simbolo: x(fr(v('N', 'Sd'), x('2 ', v('N', 'Rd'))), ' + ', par(momentos)),
              numeros: x(fr(n(razaoN, 3), 2), ' + ', par(momentosN)),
              valor,
              casas: 3,
              rotulo: `alínea b) · ${valor <= 1 ? '≤ 1,0' : '> 1,0'}`,
            },
      ],
    },
  ];

  return {
    razaoN,
    razaoMx,
    razaoMy,
    alinea,
    valor,
    verificacao: {
      chave: 'combinada',
      titulo: 'Esforços combinados',
      item: '5.5.1.2',
      sd: valor,
      rd: 1,
      unidade: '',
      razao: valor,
      situacao: situacaoPelaRazao(valor),
      governa: `alínea ${alinea})`,
      passos,
      avisos: [],
    },
  };
}
