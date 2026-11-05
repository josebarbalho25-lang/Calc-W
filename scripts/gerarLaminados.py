"""
gerarLaminados.py — escreve os catálogos do I padrão americano, do U e das
cantoneiras (src/motor/catalogos/perfisIPadrao.ts, perfisU.ts, cantoneiras.ts).

Uso:
    python -I scripts/gerarLaminados.py            (escreve os .ts)
    python -I scripts/gerarLaminados.py --relatorio (só imprime a conferência)

FONTES (todas em dados/catalogos/):
  · U-e-cantoneiras.json — CÓPIA do catálogo do A-PORT (o hash vai no
    cabeçalho dos .ts). U e cantoneiras de abas iguais e desiguais. Das
    desiguais entram só as 32 da Tabela A6.6 nacional (decisão dele,
    01/11/2026): as 50 que o A-PORT trouxe do AISC e as 3 do CISC ficam fora.
  · laminado-I-padrao-americano.json — Tabela A6.2 (UFPR), transcrita aqui.
  · U-complemento.json — h0, c e tf de cada grupo de U (Tabela A6.3).
  · aisc16m-C-S.json — recorte da biblioteca AISC do SAP2000 (C e S).

⚠️ O QUE A TABELA BRASILEIRA NÃO PUBLICA, e de onde sai aqui:
  · J (U e I) — da AISC quando a bitola é a MESMA peça (d, bf, tw, tf a menos
    de 1 mm / 0,3 mm e área a menos de 2 %). Quando não é ("2ª alma", "3ª
    alma" que a AISC aposentou), J = J_simples · razão, com J_simples =
    (2·bf·tf³ + (d − 2tf)·tw³)/3 e a razão J_AISC/J_simples dos dois
    vizinhos AISC mais parecidos — a MENOR das duas, a favor da segurança.
    A fórmula simples sozinha erra 7 a 39 % para menos (ignora o raio de
    concordância e a mesa inclinada); a razão do vizinho carrega essa
    correção. Conferência por "deixa um de fora" nos 60 perfis AISC: ver o
    --relatorio.
  · Zx, Zy — publicados quando a Tabela A6.2 publica; senão AISC da mesma
    peça; senão o mesmo esquema da razão do vizinho.
  · Cw — pela norma, D.2.8-a: Iy·(d − tf)²/4 no I e a fórmula própria do U.
    Bate com a AISC a menos de 3 % (--relatorio).
  · x0 do U — centro de torção pela teoria de parede fina, a mesma linha
    média da fórmula de Cw do D.2.8-a: e = 3·b'²·tf/(6·b'·tf + h'·tw),
    b' = bf − tw/2, h' = d − tf, medido do eixo da alma para fora das mesas.
  · Cantoneira: centro de torção no encontro das linhas médias das abas;
    eixos principais por Iv = A·rmin² (rmin publicado); Cw = 0 (abas que se
    encontram num ponto não empenam — e é a favor).
"""

import hashlib
import json
import math
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / "dados" / "catalogos"
DESTINO = RAIZ / "src" / "motor" / "catalogos"


def ler(nome):
    bruto = (DADOS / nome).read_bytes()
    return json.loads(bruto.decode("utf-8")), hashlib.sha256(bruto).hexdigest()


def numero(v):
    t = repr(round(float(v), 10))
    return t[:-2] if t.endswith(".0") else t


def texto(s):
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


# ─── AISC: o que a peça americana publica, em cm ────────────────────────────

def aisc_em_cm(e):
    return {
        "rotulo": e["LABEL"], "d": e["D"] / 10, "bf": e["BF"] / 10, "tf": e["TF"] / 10, "tw": e["TW"] / 10,
        "A": e["A"] / 100, "Ix": e["I33"] / 1e4, "Iy": e["I22"] / 1e4,
        "Zx": e["Z33"] / 1e3, "Zy": e["Z22"] / 1e3, "J": e["J"] / 1e4, "Cw": e["CW"] / 1e6,
    }


def simples(p, tipo):
    """J, Zx e Zy da seção de retângulos (mesa de espessura média, sem raio), cm."""
    d, bf, tf, tw = p["d"], p["bf"], p["tf"], p["tw"]
    h = d - 2 * tf
    A = 2 * bf * tf + h * tw
    J = (2 * bf * tf ** 3 + h * tw ** 3) / 3
    Zx = bf * tf * (d - tf) + tw * h ** 2 / 4
    if tipo == "U":
        # Linha neutra plástica paralela à alma: metade da área de cada lado.
        if A / 2 >= d * tw:
            xp = tw + (A / 2 - d * tw) / (2 * tf)
            Zy = d * tw * (xp - tw / 2) + tf * (xp - tw) ** 2 + tf * (bf - xp) ** 2
        else:
            xp = A / (2 * d)
            Zy = d * xp ** 2 / 2 + d * (tw - xp) ** 2 / 2 + 2 * tf * (bf - tw) * ((bf - tw) / 2 + tw - xp)
    else:
        Zy = 2 * tf * bf ** 2 / 4 + h * tw ** 2 / 4
    return {"J": J, "Zx": Zx, "Zy": Zy}


def mesma_peca(p, a):
    return (abs(p["d"] - a["d"]) <= 0.1 and abs(p["bf"] - a["bf"]) <= 0.1 and abs(p["tw"] - a["tw"]) <= 0.03
            and abs(p["tf"] - a["tf"]) <= 0.03 and abs(p["A"] / a["A"] - 1) <= 0.02)


def vizinhos(p, lista, quantos=2, fora=None):
    def dist(a):
        return ((a["tf"] / p["tf"] - 1) ** 2 + (a["tw"] / p["tw"] - 1) ** 2 + 0.25 * (a["d"] / p["d"] - 1) ** 2)
    cand = [a for a in lista if a is not fora]
    return sorted(cand, key=dist)[:quantos]


def completar(p, tipo, lista, publicados):
    """J, Zx, Zy: publicado → AISC da mesma peça → razão do vizinho (a menor)."""
    s = simples(p, tipo)
    igual = next((a for a in lista if mesma_peca(p, a)), None)
    valores, origem = {}, {}
    for k in ("J", "Zx", "Zy"):
        if publicados.get(k) is not None:
            valores[k], origem[k] = publicados[k], "Tabela A6.2"
        elif igual is not None:
            valores[k], origem[k] = igual[k], f"AISC {igual['rotulo']}"
        else:
            viz = vizinhos(p, lista)
            razoes = [(a[k] / simples(a, tipo)[k], a["rotulo"]) for a in viz]
            r, rot = min(razoes)
            valores[k] = s[k] * r
            origem[k] = f"estimado pelo vizinho AISC {rot} (razão {r:.3f})"
    return valores, origem, igual


def deixa_um_de_fora(lista, tipo):
    """Prevê cada perfil AISC pelos dois vizinhos (sem ele) e mede o erro."""
    erros = {k: [] for k in ("J", "Zx", "Zy")}
    for a in lista:
        for k in erros:
            viz = vizinhos(a, lista, fora=a)
            r = min(b[k] / simples(b, tipo)[k] for b in viz)
            erros[k].append((simples(a, tipo)[k] * r / a[k] - 1, a["rotulo"]))
    return erros


# ─── I padrão americano ─────────────────────────────────────────────────────

def perfis_I(aisc_S, rel):
    dados, h = ler("laminado-I-padrao-americano.json")
    saida = []
    for g in dados["grupos"]:
        for q in g["perfis"]:
            p = {"d": g["h"] / 10, "bf": q["b"] / 10, "tf": g["tf"] / 10, "tw": q["tw"] / 10, "A": q["A"]}
            val, org, igual = completar(p, "I", aisc_S, {"Zx": q.get("Zx"), "Zy": q.get("Zy")})
            Cw = q["Iy"] * (p["d"] - p["tf"]) ** 2 / 4
            org["Cw"] = "D.2.8-a"
            if igual is not None:
                rel.append(f"  {q['nome']:18s} = AISC {igual['rotulo']:10s} Cw norma/AISC {Cw / igual['Cw']:.3f}")
            saida.append({
                "nome": q["nome"], "serie": "I", "massa": q["massa"], "d": g["h"], "bf": q["b"], "tw": q["tw"],
                "tf": g["tf"], "h": g["h0"], "dLinha": round(g["h"] - 2 * g["c"], 2), "A": q["A"],
                "Ix": q["Ix"], "Wx": q["Wx"], "rx": q["rx"], "Zx": val["Zx"], "Iy": q["Iy"], "Wy": q["Wy"],
                "ry": q["ry"], "Zy": val["Zy"], "J": val["J"], "Cw": Cw, "origem": org,
            })
    return saida, h


def ts_I(lista, h):
    campos = ["massa", "d", "bf", "tw", "tf", "h", "dLinha", "A", "Ix", "Wx", "rx", "Zx", "Iy", "Wy", "ry", "Zy", "J", "Cw"]
    linhas = []
    for p in lista:
        partes = [f"familia: 'I'", f"nome: {texto(p['nome'])}", "serie: 'I'"] + [f"{c}: {numero(p[c])}" for c in campos]
        partes.append("origem: { " + ", ".join(f"{k}: {texto(v)}" for k, v in p["origem"].items()) + " }")
        linhas.append("  { " + ", ".join(partes) + " },")
    return f"""// ═══════════════════════════════════════════════════════════════════════════
//  motor/catalogos/perfisIPadrao.ts — perfis I laminados padrão americano
// ---------------------------------------------------------------------------
//  ⚠️ ARQUIVO GERADO por scripts/gerarLaminados.py. Não editar à mão.
//  Fonte: Tabela A6.2 (UFPR) em dados/catalogos/laminado-I-padrao-americano.json
//  sha256: {h}
//  {len(lista)} bitolas. Mesa inclinada: tf é a espessura MÉDIA. J, Zx, Zy e
//  Cw que a tabela não publica têm a origem anotada em `origem`.
// ═══════════════════════════════════════════════════════════════════════════

import type {{ PerfilI }} from '../tipos';

export const PERFIS_I_PADRAO: readonly PerfilI[] = [
""" + "\n".join(linhas) + "\n];\n"


# ─── U ──────────────────────────────────────────────────────────────────────

def perfis_U(aisc_C, rel):
    dados, h = ler("U-e-cantoneiras.json")
    comp, _ = ler("U-complemento.json")
    grupos = {g["d"]: g for g in comp["grupos"]}
    saida = []
    for q in dados["canais_U"]:
        g = grupos[q["d"]]
        assert abs(g["tf"] - q["tf"]) < 1e-9, q["nome"]
        p = {"d": q["d"] / 10, "bf": q["bf"] / 10, "tf": q["tf"] / 10, "tw": q["tw"] / 10, "A": q["A"]}
        val, org, igual = completar(p, "U", aisc_C, {})
        bl = p["bf"] - p["tw"] / 2
        hl = p["d"] - p["tf"]
        tf, tw = p["tf"], p["tw"]
        Cw = tf * bl ** 3 * hl ** 2 / 12 * (3 * bl * tf + 2 * hl * tw) / (6 * bl * tf + hl * tw)
        e = 3 * bl ** 2 * tf / (6 * bl * tf + hl * tw)
        x0 = q["xg"] - tw / 2 + e
        org["Cw"] = "D.2.8-a"
        org["x0"] = "parede fina"
        if igual is not None:
            rel.append(f"  {q['nome']:18s} = AISC {igual['rotulo']:10s} Cw norma/AISC {Cw / igual['Cw']:.3f}  J {val['J']:.3f}")
        saida.append({
            "nome": q["nome"], "massa": q["massa"], "d": q["d"], "bf": q["bf"], "tw": q["tw"], "tf": q["tf"],
            "dLinha": round(q["d"] - 2 * g["c"], 2), "A": q["A"], "Ix": q["Ix"], "Wx": q["Wx"], "rx": q["rx"],
            "Zx": val["Zx"], "Iy": q["Iy"], "Wy": q["Wy"], "WyAlma": q["Iy"] / q["xg"], "ry": q["ry"],
            "Zy": val["Zy"], "xg": q["xg"], "x0": x0, "J": val["J"], "Cw": Cw, "origem": org,
        })
    return saida, h


def ts_U(lista, h):
    campos = ["massa", "d", "bf", "tw", "tf", "dLinha", "A", "Ix", "Wx", "rx", "Zx", "Iy", "Wy", "WyAlma", "ry", "Zy", "xg", "x0", "J", "Cw"]
    linhas = []
    for p in lista:
        partes = ["familia: 'U'", f"nome: {texto(p['nome'])}"] + [f"{c}: {numero(p[c])}" for c in campos]
        partes.append("origem: { " + ", ".join(f"{k}: {texto(v)}" for k, v in p["origem"].items()) + " }")
        linhas.append("  { " + ", ".join(partes) + " },")
    return f"""// ═══════════════════════════════════════════════════════════════════════════
//  motor/catalogos/perfisU.ts — perfis U laminados padrão americano
// ---------------------------------------------------------------------------
//  ⚠️ ARQUIVO GERADO por scripts/gerarLaminados.py. Não editar à mão.
//  Fonte: U-e-cantoneiras.json (cópia do catálogo do A-PORT, Tabela A6.3)
//  sha256: {h}
//  {len(lista)} bitolas. Mesa inclinada: tf é a espessura MÉDIA. xg é do CG à
//  face externa da alma; x0 é do CG ao centro de torção (do lado da alma).
//  Wy é o mínimo (lado das pontas das mesas); WyAlma, o do lado da alma.
// ═══════════════════════════════════════════════════════════════════════════

import type {{ PerfilU }} from '../tipos';

export const PERFIS_U: readonly PerfilU[] = [
""" + "\n".join(linhas) + "\n];\n"


# ─── Cantoneiras ────────────────────────────────────────────────────────────

def cantoneiras(rel):
    dados, h = ler("U-e-cantoneiras.json")
    saida = []
    iguais = dados["cantoneiras_abas_iguais"]
    nacionais = [q for q in dados["cantoneiras_abas_desiguais"]
                 if "confianca" in q and not str(q.get("fonteExtra", "")).startswith("CISC")]
    assert len(nacionais) == 32, len(nacionais)
    for q in iguais + nacionais:
        igual = "bmenor" not in q
        b, bm, t = q["b"], q.get("bmenor", q["b"]), q["t"]
        A, Ix = q["A"], q["Ix"]
        Iy = Ix if igual else q["Iy"]
        Iv = A * q["rmin"] ** 2
        Iu = Ix + Iy - Iv
        # Aba maior na vertical (y), menor na horizontal (x), vértice na origem:
        # relativo ao CG, a aba de baixo fica em x > 0, y < 0 e a da esquerda em
        # x < 0, y > 0 — Ixy é negativo.
        Ixy = -math.sqrt(max(((Iu - Iv) / 2) ** 2 - ((Ix - Iy) / 2) ** 2, 0))
        alfa = 0.5 * math.atan2(-2 * Ixy, Ix - Iy)
        xg = q["xg"]
        yg = q.get("yg", xg)
        x0 = t / 20 - xg
        y0 = t / 20 - yg
        org = {"J": "catálogo" if q.get("fonteExtra") else "fórmula de parede fina (A-PORT)", "Cw": "desprezado"}
        if not igual:
            rel.append(f"  {q['nome']:24s} tg_alfa publicado {q['tg_alfa']:.3f} · daqui tg(90° − alfa) {math.tan(math.pi / 2 - alfa):.3f}")
        duv = q.get("confianca") == "duvidoso"
        saida.append({
            "nome": q["nome"], "massa": q["massa"], "b": b, "bmenor": bm, "t": t, "A": A,
            "Ix": Ix, "Wx": q["Wx"], "rx": q["rx"], "Iy": Iy, "Wy": q["Wx"] if igual else q["Wy"],
            "ry": q["rx"] if igual else q["ry"], "xg": xg, "yg": yg, "rmin": q["rmin"],
            "Iu": Iu, "Iv": Iv, "Ixy": Ixy, "alfa": alfa, "x0": x0, "y0": y0, "J": q["J"], "Cw": 0,
            "origem": org, "duvidoso": duv,
        })
    return saida, h


def ts_L(lista, h):
    campos = ["massa", "b", "bmenor", "t", "A", "Ix", "Wx", "rx", "Iy", "Wy", "ry", "xg", "yg", "rmin", "Iu", "Iv", "Ixy", "alfa", "x0", "y0", "J", "Cw"]
    linhas = []
    for p in lista:
        partes = ["familia: 'L'", f"nome: {texto(p['nome'])}"] + [f"{c}: {numero(p[c])}" for c in campos]
        partes.append("origem: { " + ", ".join(f"{k}: {texto(v)}" for k, v in p["origem"].items()) + " }")
        if p["duvidoso"]:
            partes.append("confianca: 'duvidoso'")
            partes.append("duvida: 'reprovou numa aferição do catálogo do A-PORT (U-e-cantoneiras.CONFERENCIA.md §4)'")
        linhas.append("  { " + ", ".join(partes) + " },")
    return f"""// ═══════════════════════════════════════════════════════════════════════════
//  motor/catalogos/cantoneiras.ts — cantoneiras laminadas de abas iguais e
//  desiguais
// ---------------------------------------------------------------------------
//  ⚠️ ARQUIVO GERADO por scripts/gerarLaminados.py. Não editar à mão.
//  Fonte: U-e-cantoneiras.json (cópia do catálogo do A-PORT)
//  sha256: {h}
//  {len(lista)} bitolas. Aba maior (b) na vertical, ao longo de y; aba menor
//  na horizontal, ao longo de x; Ix ≥ Iy. xg e yg do CG às faces externas.
//  Eixos principais: u (maior inércia), v (menor), alfa = ângulo de u com x,
//  rad. x0, y0: do CG ao centro de torção (o encontro das linhas médias).
// ═══════════════════════════════════════════════════════════════════════════

import type {{ Cantoneira }} from '../tipos';

export const CANTONEIRAS: readonly Cantoneira[] = [
""" + "\n".join(linhas) + "\n];\n"


def main():
    # O console do Windows não é UTF-8, e o -I ignora PYTHONIOENCODING.
    sys.stdout.reconfigure(encoding="utf-8")
    aisc, _ = ler("aisc16m-C-S.json")
    aisc_C = [aisc_em_cm(e) for e in aisc["C"]]
    aisc_S = [aisc_em_cm(e) for e in aisc["S"]]
    rel = []
    rel.append("Deixa um de fora (razão do vizinho, a menor de duas) — erro da previsão:")
    for nome, lista, tipo in (("C", aisc_C, "U"), ("S", aisc_S, "I")):
        erros = deixa_um_de_fora(lista, tipo)
        for k, es in erros.items():
            hi = max(es)
            lo = min(es)
            rel.append(f"  {nome} {k}: de {100 * lo[0]:+.1f}% ({lo[1]}) a {100 * hi[0]:+.1f}% ({hi[1]})")
    rel.append("Mesma peça na AISC:")
    I, hI = perfis_I(aisc_S, rel)
    U, hU = perfis_U(aisc_C, rel)
    rel.append("Cantoneiras de abas desiguais — ângulo dos eixos principais:")
    L, hL = cantoneiras(rel)
    rel.append("Origem de J, Zx, Zy:")
    for p in I + U:
        est = {k: v for k, v in p["origem"].items() if k in ("J", "Zx", "Zy") and v.startswith("estimado")}
        if est:
            rel.append(f"  {p['nome']:18s} " + "; ".join(f"{k}: {v}" for k, v in est.items()))
    if "--relatorio" in sys.argv:
        print("\n".join(rel))
        return
    (DESTINO / "perfisIPadrao.ts").write_text(ts_I(I, hI), encoding="utf-8", newline="\n")
    (DESTINO / "perfisU.ts").write_text(ts_U(U, hU), encoding="utf-8", newline="\n")
    (DESTINO / "cantoneiras.ts").write_text(ts_L(L, hL), encoding="utf-8", newline="\n")
    print(f"{len(I)} I + {len(U)} U + {len(L)} L -> {DESTINO}")


if __name__ == "__main__":
    main()
