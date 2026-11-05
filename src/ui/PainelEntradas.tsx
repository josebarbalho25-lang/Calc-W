// ═══════════════════════════════════════════════════════════════════════════
//  ui/PainelEntradas.tsx — a coluna da esquerda: perfil, aço, esforços e
//  comprimentos. Rótulo, valor, unidade; o (?) abre a janela animada do
//  esforço ou do comprimento — é a animação que mostra em que eixo cada
//  esforço age (Mx e Vy no plano da alma, My e Vx no das mesas).
//
//  Na cantoneira aparece o bloco "Barra": comprimida pelo centroide ou de
//  treliça ligada por uma aba (5.3.5.4). Na de treliça o comprimento é um só,
//  entre os pontos de trabalho. Na cantoneira some o a (não há alma); o Cb
//  fica (entra na FLT do F10), menos na de treliça, que não leva momento.
//
//  O perfil vem do catálogo (laminados e os soldados CS, CVS, VS) ou das
//  CHAPAS digitadas (o soldado PS). O aço acompanha: soldado só lista aço de
//  chapa, e a faixa de espessura que não serve fica apagada na lista.
// ═══════════════════════════════════════════════════════════════════════════

import { ACOS, ACOS_DE_CHAPA } from '../motor/catalogos/acos';
import type { Aco, ChapasDoSoldado, Comprimentos, Curvatura, Esforcos, LigacaoPorUmaAba } from '../motor/tipos';
import { num } from '../relatorio/formatos';
import { CampoNumero } from './CampoNumero';
import { acoDaEntrada, ehSoldado, perfilDaEntrada } from './guardarEntrada';
import { SeletorDePerfil } from './SeletorDePerfil';
import type { ChaveDaAjuda } from '../visualizacao/modais/JanelaDidatica';

export interface EstadoDaEntrada {
  perfil: string;
  aco: string;
  esforcos: Esforcos;
  comprimentos: Comprimentos;
  /** Só vale na cantoneira; null = comprimida pelo centroide. */
  ligacao: LigacaoPorUmaAba | null;
  /** O perfil é o soldado das chapas digitadas (e não o `perfil` do catálogo). */
  porChapas: boolean;
  /** As chapas do soldado digitado, mm. Ficam guardadas mesmo com o catálogo escolhido. */
  chapas: ChapasDoSoldado;
  /** O aço de chapa do soldado; o `aco` é o do laminado. */
  acoChapa: string;
  /** Chapas com as duas mesas separadas (I monossimétrico). */
  mesasDiferentes: boolean;
  /** Só no I de mesas diferentes: simples (o sinal do Mx manda) ou reversa (D.2.8-j). */
  curvatura: Curvatura;
}

/** A faixa de espessura do aço de chapa cobre a chapa mais grossa? */
function faixaServe(a: Aco, t: number): boolean {
  return (a.tMax === undefined || t <= a.tMax) && (a.tMin === undefined || t > a.tMin);
}

type ModoDaBarra = 'centroide' | 'plana' | 'espacial';

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

export function PainelEntradas({ estado, mudar, abrirAjuda }: Props) {
  const perfil = perfilDaEntrada(estado);
  const soldado = ehSoldado(perfil);
  const aco = acoDaEntrada(estado, perfil);
  const listaDeAcos = soldado ? ACOS_DE_CHAPA : ACOS;
  const tMaisGrossa = perfil.familia === 'I' && perfil.soldado ? Math.max(perfil.soldado.tw, perfil.soldado.mesaSuperior.tf, perfil.soldado.mesaInferior.tf) : 0;
  const chapas = estado.chapas;
  // Mesas iguais: o campo é um só e muda as duas. Diferentes: cada uma o seu.
  const mudarChapa = (k: 'd' | 'tw' | 'bf' | 'tf', mesa?: 'mesaSuperior' | 'mesaInferior') => (v: number) =>
    mudar((e) => {
      const c = e.chapas;
      if (k === 'd' || k === 'tw') return { ...e, chapas: { ...c, [k]: v } };
      if (mesa) return { ...e, chapas: { ...c, [mesa]: { ...c[mesa], [k]: v } } };
      return { ...e, chapas: { ...c, mesaSuperior: { ...c.mesaSuperior, [k]: v }, mesaInferior: { ...c.mesaInferior, [k]: v } } };
    });
  // Voltar para "iguais" copia a mesa de cima na de baixo — a tela não pode
  // mostrar um campo só e o motor calcular com duas mesas.
  const mudarMesas = (dif: boolean) =>
    mudar((e) => ({ ...e, mesasDiferentes: dif, chapas: dif ? e.chapas : { ...e.chapas, mesaInferior: { ...e.chapas.mesaSuperior } } }));
  const mono = perfil.familia === 'I' && Boolean(perfil.soldado) && (perfil.soldado!.mesaSuperior.bf !== perfil.soldado!.mesaInferior.bf || perfil.soldado!.mesaSuperior.tf !== perfil.soldado!.mesaInferior.tf);
  const esforco = (k: keyof Esforcos) => (v: number) => mudar((e) => ({ ...e, esforcos: { ...e.esforcos, [k]: v } }));
  const comp = (k: keyof Comprimentos) => (v: number) => mudar((e) => ({ ...e, comprimentos: { ...e.comprimentos, [k]: v } }));
  const f = estado.esforcos;
  const L = estado.comprimentos;
  const cantoneira = perfil.familia === 'L' ? perfil : undefined;
  const lig = cantoneira ? estado.ligacao : null;
  const modo: ModoDaBarra = lig ? lig.trelica : 'centroide';
  const mudarModo = (m: ModoDaBarra) =>
    mudar((e) => ({ ...e, ligacao: m === 'centroide' ? null : { aba: e.ligacao?.aba ?? 'maior', trelica: m } }));
  const doU = perfil.familia === 'U';

  return (
    <div className="painel-entradas">
      <fieldset className="cad-bloco">
        <legend>Perfil</legend>
        <div className="segmentado duas" role="radiogroup" aria-label="Origem do perfil">
          {([['Catálogo', false], ['Chapas', true]] as const).map(([rotulo, v]) => (
            <button key={rotulo} type="button" role="radio" aria-checked={estado.porChapas === v} className={estado.porChapas === v ? 'ativo' : ''} onClick={() => mudar((e) => ({ ...e, porChapas: v }))}>
              {rotulo}
            </button>
          ))}
        </div>
        {estado.porChapas ? (
          <>
            <div className="cad-linha">
              <label>Mesas</label>
              <div className="cad-valor">
                <select className="campo texto" value={estado.mesasDiferentes ? 'dif' : 'iguais'} onChange={(ev) => mudarMesas(ev.target.value === 'dif')}>
                  <option value="iguais">Iguais</option>
                  <option value="dif">Diferentes</option>
                </select>
              </div>
            </div>
            <CampoNumero rotulo={<i>d</i>} valor={chapas.d} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('d')} />
            {estado.mesasDiferentes ? (
              <>
                <CampoNumero rotulo={sub('b', 'fs')} valor={chapas.mesaSuperior.bf} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('bf', 'mesaSuperior')} titulo="Mesa superior" />
                <CampoNumero rotulo={sub('t', 'fs')} valor={chapas.mesaSuperior.tf} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('tf', 'mesaSuperior')} titulo="Mesa superior" />
                <CampoNumero rotulo={sub('b', 'fi')} valor={chapas.mesaInferior.bf} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('bf', 'mesaInferior')} titulo="Mesa inferior" />
                <CampoNumero rotulo={sub('t', 'fi')} valor={chapas.mesaInferior.tf} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('tf', 'mesaInferior')} titulo="Mesa inferior" />
              </>
            ) : (
              <>
                <CampoNumero rotulo={sub('b', 'f')} valor={chapas.mesaSuperior.bf} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('bf')} />
                <CampoNumero rotulo={sub('t', 'f')} valor={chapas.mesaSuperior.tf} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('tf')} />
              </>
            )}
            <CampoNumero rotulo={sub('t', 'w')} valor={chapas.tw} unidade="mm" minimo={0} acimaDoMinimo casas={2} aoMudar={mudarChapa('tw')} />
          </>
        ) : (
          <SeletorDePerfil valor={estado.perfil} aoEscolher={(nome) => mudar((e) => ({ ...e, perfil: nome }))} />
        )}
      </fieldset>

      <fieldset className="cad-bloco">
        <legend>Aço</legend>
        <select
          className="campo texto"
          value={aco.nome}
          onChange={(ev) => mudar((e) => (soldado ? { ...e, acoChapa: ev.target.value } : { ...e, aco: ev.target.value }))}
        >
          {listaDeAcos.map((a) => (
            <option key={a.nome} value={a.nome} disabled={soldado && !faixaServe(a, tMaisGrossa)}>
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

      {cantoneira && (
        <fieldset className="cad-bloco">
          <legend>Barra</legend>
          <select className="campo texto" value={modo} onChange={(ev) => mudarModo(ev.target.value as ModoDaBarra)}>
            <option value="centroide">Comprimida pelo centroide</option>
            <option value="plana">Treliça plana, ligada por uma aba</option>
            <option value="espacial">Treliça espacial, ligada por uma aba</option>
          </select>
          {lig && cantoneira.b !== cantoneira.bmenor && (
            <div className="cad-linha">
              <label>Aba ligada</label>
              <div className="cad-valor">
                <select
                  className="campo texto"
                  value={lig.aba}
                  onChange={(ev) => mudar((e) => ({ ...e, ligacao: { ...lig, aba: ev.target.value as 'maior' | 'menor' } }))}
                >
                  <option value="maior">Maior</option>
                  <option value="menor">Menor</option>
                </select>
              </div>
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="cad-bloco">
        <legend>Esforços solicitantes de cálculo</legend>
        <CampoNumero rotulo={sub('N', 'Sd')} valor={f.N} unidade="kN" aoMudar={esforco('N')} ajuda={<Ajuda chave="N" abrir={abrirAjuda} />} titulo="Positivo comprime, negativo traciona" />
        <CampoNumero rotulo={sub('M', 'x,Sd')} valor={f.Mx} unidade="kN·cm" aoMudar={esforco('Mx')} ajuda={<Ajuda chave="Mx" abrir={abrirAjuda} />} titulo={mono ? 'Positivo comprime a mesa superior' : undefined} />
        <CampoNumero rotulo={sub('M', 'y,Sd')} valor={f.My} unidade="kN·cm" aoMudar={esforco('My')} ajuda={<Ajuda chave="My" abrir={abrirAjuda} />} titulo={doU ? 'Positivo comprime as pontas das mesas' : undefined} />
        <CampoNumero rotulo={sub('V', 'x,Sd')} valor={f.Vx} unidade="kN" aoMudar={esforco('Vx')} ajuda={<Ajuda chave="Vx" abrir={abrirAjuda} />} />
        <CampoNumero rotulo={sub('V', 'y,Sd')} valor={f.Vy} unidade="kN" aoMudar={esforco('Vy')} ajuda={<Ajuda chave="Vy" abrir={abrirAjuda} />} />
      </fieldset>

      <fieldset className="cad-bloco">
        <legend>Comprimentos destravados</legend>
        {lig ? (
          <CampoNumero rotulo={sub('L', 'x1')} valor={L.Lx} unidade="cm" minimo={0} acimaDoMinimo aoMudar={comp('Lx')} titulo="Entre os pontos de trabalho" />
        ) : (
          <>
            <CampoNumero rotulo={sub('L', 'x')} valor={L.Lx} unidade="cm" minimo={0} aoMudar={comp('Lx')} ajuda={<Ajuda chave="Lx" abrir={abrirAjuda} />} titulo="Zero: travada em x" />
            <CampoNumero rotulo={sub('L', 'y')} valor={L.Ly} unidade="cm" minimo={0} aoMudar={comp('Ly')} ajuda={<Ajuda chave="Ly" abrir={abrirAjuda} />} titulo="Zero: travada em y" />
            <CampoNumero rotulo={sub('L', 't')} valor={L.Lt} unidade="cm" minimo={0} aoMudar={comp('Lt')} ajuda={<Ajuda chave="Lt" abrir={abrirAjuda} />} titulo="Zero: travada continuamente" />
          </>
        )}
        {!lig && <CampoNumero rotulo={sub('C', 'b')} valor={L.Cb} minimo={1} aoMudar={comp('Cb')} ajuda={<Ajuda chave="Cb" abrir={abrirAjuda} />} />}
        {mono && (
          <div className="cad-linha">
            <label>Curvatura</label>
            <div className="cad-valor">
              <select className="campo texto" value={estado.curvatura} onChange={(ev) => mudar((e) => ({ ...e, curvatura: ev.target.value as Curvatura }))}>
                <option value="simples">Simples</option>
                <option value="reversa">Reversa</option>
              </select>
            </div>
          </div>
        )}
        {!cantoneira && (
          <CampoNumero rotulo={<i>a</i>} valor={L.a} unidade="cm" minimo={0} aoMudar={comp('a')} ajuda={<Ajuda chave="a" abrir={abrirAjuda} />} titulo="Zero: sem enrijecedores" />
        )}
      </fieldset>
    </div>
  );
}
