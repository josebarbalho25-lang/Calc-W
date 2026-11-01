// ═══════════════════════════════════════════════════════════════════════════
//  ui/PainelEntradas.tsx — a coluna da esquerda: perfil, aço, esforços e
//  comprimentos. Rótulo, valor, unidade; o (?) abre a janela animada do
//  esforço ou do comprimento.
//
//  ⚠️ O NOME DO SAP AO LADO DE CADA ESFORÇO (M3, V2…): o eixo forte aqui é o
//  X, e no SAP o momento dele é o M3 e a cortante que vai junto é a V2. Foi
//  nessa passagem que o eixo trocou três vezes na mesma tarde, com engenheiro
//  atento conferindo. No N, "−P": no SAP a tração é positiva.
// ═══════════════════════════════════════════════════════════════════════════

import { ACOS } from '../motor/catalogos/acos';
import type { Comprimentos, Esforcos } from '../motor/tipos';
import { num } from '../relatorio/formatos';
import { CampoNumero } from './CampoNumero';
import { SeletorDePerfil } from './SeletorDePerfil';
import type { ChaveDaAjuda } from '../visualizacao/modais/JanelaDidatica';

export interface EstadoDaEntrada {
  perfil: string;
  aco: string;
  esforcos: Esforcos;
  comprimentos: Comprimentos;
}

interface Props {
  estado: EstadoDaEntrada;
  mudar: (m: (e: EstadoDaEntrada) => EstadoDaEntrada) => void;
  abrirAjuda: (c: ChaveDaAjuda) => void;
}

function Ajuda({ chave, abrir }: { chave: ChaveDaAjuda; abrir: (c: ChaveDaAjuda) => void }) {
  return (
    <button type="button" className="btn-ajuda" onClick={() => abrir(chave)} title={`${chave}: ver a animação`} aria-label={`Ajuda de ${chave}`}>
      ?
    </button>
  );
}

const sub = (base: string, indice: string) => (
  <span>
    <i>{base}</i>
    <sub>{indice}</sub>
  </span>
);

/** O rótulo do esforço com o nome que ele tem no SAP2000. */
const comSap = (base: string, indice: string, sap: string) => (
  <>
    {sub(base, indice)}
    <span className="sap" title={`No SAP2000: ${sap}`}>
      {sap}
    </span>
  </>
);

export function PainelEntradas({ estado, mudar, abrirAjuda }: Props) {
  const aco = ACOS.find((a) => a.nome === estado.aco) ?? ACOS[0]!;
  const esforco = (k: keyof Esforcos) => (v: number) => mudar((e) => ({ ...e, esforcos: { ...e.esforcos, [k]: v } }));
  const comp = (k: keyof Comprimentos) => (v: number) => mudar((e) => ({ ...e, comprimentos: { ...e.comprimentos, [k]: v } }));
  const f = estado.esforcos;
  const L = estado.comprimentos;

  return (
    <div className="painel-entradas">
      <fieldset className="cad-bloco">
        <legend>Perfil</legend>
        <SeletorDePerfil valor={estado.perfil} aoEscolher={(nome) => mudar((e) => ({ ...e, perfil: nome }))} />
      </fieldset>

      <fieldset className="cad-bloco">
        <legend>Aço</legend>
        <select className="campo texto" value={aco.nome} onChange={(ev) => mudar((e) => ({ ...e, aco: ev.target.value }))}>
          {ACOS.map((a) => (
            <option key={a.nome} value={a.nome}>
              {a.nome}
            </option>
          ))}
        </select>
        <div className="cad-linha">
          <label>{sub('f', 'y')}</label>
          <div className="cad-valor">
            <span className="valor-derivado">{num(aco.fy, 1)}</span>
            <span className="unidade">kN/cm²</span>
          </div>
        </div>
        <div className="cad-linha">
          <label>{sub('f', 'u')}</label>
          <div className="cad-valor">
            <span className="valor-derivado">{num(aco.fu, 1)}</span>
            <span className="unidade">kN/cm²</span>
          </div>
        </div>
      </fieldset>

      <fieldset className="cad-bloco">
        <legend>Esforços solicitantes de cálculo</legend>
        <CampoNumero rotulo={comSap('N', 'Sd', '−P')} valor={f.N} unidade="kN" aoMudar={esforco('N')} ajuda={<Ajuda chave="N" abrir={abrirAjuda} />} titulo="Positivo comprime, negativo traciona" />
        <CampoNumero rotulo={comSap('M', 'x,Sd', 'M3')} valor={f.Mx} unidade="kN·cm" aoMudar={esforco('Mx')} ajuda={<Ajuda chave="Mx" abrir={abrirAjuda} />} />
        <CampoNumero rotulo={comSap('M', 'y,Sd', 'M2')} valor={f.My} unidade="kN·cm" aoMudar={esforco('My')} ajuda={<Ajuda chave="My" abrir={abrirAjuda} />} />
        <CampoNumero rotulo={comSap('V', 'x,Sd', 'V3')} valor={f.Vx} unidade="kN" aoMudar={esforco('Vx')} ajuda={<Ajuda chave="Vx" abrir={abrirAjuda} />} />
        <CampoNumero rotulo={comSap('V', 'y,Sd', 'V2')} valor={f.Vy} unidade="kN" aoMudar={esforco('Vy')} ajuda={<Ajuda chave="Vy" abrir={abrirAjuda} />} />
      </fieldset>

      <fieldset className="cad-bloco">
        <legend>Comprimentos destravados</legend>
        <CampoNumero rotulo={sub('L', 'x')} valor={L.Lx} unidade="cm" minimo={0} aoMudar={comp('Lx')} ajuda={<Ajuda chave="Lx" abrir={abrirAjuda} />} titulo="Zero: travada em x" />
        <CampoNumero rotulo={sub('L', 'y')} valor={L.Ly} unidade="cm" minimo={0} aoMudar={comp('Ly')} ajuda={<Ajuda chave="Ly" abrir={abrirAjuda} />} titulo="Zero: travada em y" />
        <CampoNumero rotulo={sub('L', 't')} valor={L.Lt} unidade="cm" minimo={0} aoMudar={comp('Lt')} ajuda={<Ajuda chave="Lt" abrir={abrirAjuda} />} titulo="Zero: travada continuamente" />
        <CampoNumero rotulo={sub('C', 'b')} valor={L.Cb} minimo={1} aoMudar={comp('Cb')} ajuda={<Ajuda chave="Cb" abrir={abrirAjuda} />} />
        <CampoNumero rotulo={<i>a</i>} valor={L.a} unidade="cm" minimo={0} aoMudar={comp('a')} ajuda={<Ajuda chave="a" abrir={abrirAjuda} />} titulo="Zero: sem enrijecedores" />
      </fieldset>
    </div>
  );
}
