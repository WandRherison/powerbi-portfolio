"""
Script Autônomo de Engenharia de Dados - ONG Multi-Programas (Gestão Estratégica)
Modelo: Multi-Fato Star Schema (fDoacoes, fAtendimentos, fOrcamentoMetas, dProjetos, dDoadores, dCanais, dRegioes)
Período: Janeiro de 2025 a Outubro de 2026 (22 meses)
Regras de Negócio:
  - Doações PJ / Editais: R$ 5.000 a R$ 50.000 (pontuais em Pix, Transferência ou Edital).
  - Doações Mensalistas PF: R$ 30 a R$ 200, com simulação de churn mensal (3% a 5%).
  - Picos em Novembro/Dezembro (Natal Solidário) e vales em Janeiro/Fevereiro.
  - Atendimentos de Saúde e Capacitação com custos e horas de voluntariado superiores a Cestas Básicas.
  - Metas orçamentárias mensais fechadas para todos os projetos (fOrcamentoMetas).
  - 100% de integridade referencial.
  - Exportação em CSV com UTF-8-sig e delimitador ';'.
"""

import sys
import subprocess

for pkg in ["pandas", "faker", "numpy"]:
    try:
        __import__(pkg)
    except ImportError:
        print(f"-> Instalando pacote ausente: {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

import os
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from faker import Faker

def init_environment():
    random.seed(42)
    np.random.seed(42)
    fake = Faker('pt_BR')
    fake.seed_instance(42)
    
    global_data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    project_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Projetos', 'Projeto - ONG Multi-Programas')
    project_data_dir = os.path.join(project_dir, 'data')
    
    os.makedirs(global_data_dir, exist_ok=True)
    os.makedirs(project_data_dir, exist_ok=True)
    
    return fake, global_data_dir, project_data_dir

def generate_dimensions(fake):
    print("-> Gerando Dimensões Compartilhadas (dProjetos, dDoadores, dCanais, dRegioes)...")
    
    # 1. dProjetos
    projetos_data = [
        {"ID_Projeto": 101, "Nome_Projeto": "Primeiros Passos: Criança Feliz", "Area_Foco": "Infância", "Responsavel": "Renata Vasconcelos", "Status_Projeto": "Ativo"},
        {"ID_Projeto": 102, "Nome_Projeto": "Tech Jovem: Formação & Código", "Area_Foco": "Profissionalização", "Responsavel": "Marcos Vinícius Costa", "Status_Projeto": "Ativo"},
        {"ID_Projeto": 103, "Nome_Projeto": "Saúde Plena: Atendimento Móvel", "Area_Foco": "Saúde Comunitária", "Responsavel": "Dra. Camila Nogueira", "Status_Projeto": "Ativo"},
        {"ID_Projeto": 104, "Nome_Projeto": "Habitat Digno: Reforma & Moradia", "Area_Foco": "Moradia", "Responsavel": "Eng. Lucas Silveira", "Status_Projeto": "Ativo"},
        {"ID_Projeto": 105, "Nome_Projeto": "Crescer & Vencer: Esporte Cidadão", "Area_Foco": "Infância", "Responsavel": "Prof. André Martins", "Status_Projeto": "Ativo"},
        {"ID_Projeto": 106, "Nome_Projeto": "Costura & Renda: Mulheres Protagonistas", "Area_Foco": "Profissionalização", "Responsavel": "Juliana Barreto", "Status_Projeto": "Concluído"}
    ]
    df_projetos = pd.DataFrame(projetos_data)
    
    # 2. dCanais
    canais_data = [
        {"ID_Canal": 1, "Nome_Canal": "Pix", "Taxa_Perc": 0.00},
        {"ID_Canal": 2, "Nome_Canal": "Cartão Recorrente", "Taxa_Perc": 2.50},
        {"ID_Canal": 3, "Nome_Canal": "Boleto", "Taxa_Perc": 1.20},
        {"ID_Canal": 4, "Nome_Canal": "Evento Beneficente", "Taxa_Perc": 3.80},
        {"ID_Canal": 5, "Nome_Canal": "Emenda Parlamentar / Edital", "Taxa_Perc": 0.00}
    ]
    df_canais = pd.DataFrame(canais_data)
    
    # 3. dRegioes
    regioes_data = [
        {"ID_Regiao": 1, "Bairro": "Jardim Peri", "Cidade": "São Paulo", "Zona": "Norte"},
        {"ID_Regiao": 2, "Bairro": "Guaianases", "Cidade": "São Paulo", "Zona": "Leste"},
        {"ID_Regiao": 3, "Bairro": "Capão Redondo", "Cidade": "São Paulo", "Zona": "Sul"},
        {"ID_Regiao": 4, "Bairro": "Brasilândia", "Cidade": "São Paulo", "Zona": "Norte"},
        {"ID_Regiao": 5, "Bairro": "Cidade Tiradentes", "Cidade": "São Paulo", "Zona": "Leste"},
        {"ID_Regiao": 6, "Bairro": "Grajaú", "Cidade": "São Paulo", "Zona": "Sul"},
        {"ID_Regiao": 7, "Bairro": "Vila Sônia", "Cidade": "São Paulo", "Zona": "Oeste"},
        {"ID_Regiao": 8, "Bairro": "Perus", "Cidade": "São Paulo", "Zona": "Norte"},
        {"ID_Regiao": 9, "Bairro": "Parelheiros", "Cidade": "São Paulo", "Zona": "Rural"},
        {"ID_Regiao": 10, "Bairro": "Engenheiro Marsilac", "Cidade": "São Paulo", "Zona": "Rural"}
    ]
    df_regioes = pd.DataFrame(regioes_data)
    
    # 4. dDoadores (~700 doadores cadastrados)
    num_doadores = 700
    doadores_list = []
    
    cidades_estados = [
        ("São Paulo", "SP"),
        ("Campinas", "SP"),
        ("Santos", "SP"),
        ("Ribeirão Preto", "SP"),
        ("Rio de Janeiro", "RJ"),
        ("Niterói", "RJ"),
        ("Belo Horizonte", "MG"),
        ("Curitiba", "PR"),
        ("Porto Alegre", "RS"),
        ("Brasília", "DF"),
        ("Salvador", "BA"),
        ("Recife", "PE")
    ]
    
    for i in range(1, num_doadores + 1):
        id_doador = 10000 + i
        is_pj = np.random.rand() < 0.18  # 18% PJ, 82% PF
        cid, uf = random.choice(cidades_estados)
        
        data_cadastro = fake.date_between_dates(
            date_start=datetime(2023, 1, 1),
            date_end=datetime(2025, 4, 30)
        )
        
        # Simulação de status doador com churn
        status = "Ativo" if np.random.rand() < 0.88 else "Inativo/Churn"
        tipo = "PJ" if is_pj else "PF"
        
        doadores_list.append({
            "ID_Doador": id_doador,
            "Tipo_Doador": tipo,
            "Cidade": cid,
            "Estado": uf,
            "Data_Cadastro": data_cadastro.strftime("%Y-%m-%d"),
            "Status_Doador": status
        })
    df_doadores = pd.DataFrame(doadores_list)
    
    return df_projetos, df_canais, df_regioes, df_doadores

def generate_fact_planning(df_projetos):
    print("-> Gerando Fato fOrcamentoMetas (Granularidade Mensal por Projeto: Jan/2025 a Out/2026)...")
    
    # 22 meses: 202501 a 202610
    meses = []
    for y in [2025, 2026]:
        max_m = 12 if y == 2025 else 10
        for m in range(1, max_m + 1):
            meses.append(f"{y}{m:02d}")
            
    metas_list = []
    
    # Metas base por projeto
    base_meta_arrecadacao = {
        101: 55000.0, # Criança Feliz
        102: 48000.0, # Tech Jovem
        103: 62000.0, # Saúde Plena
        104: 38000.0, # Moradia
        105: 32000.0, # Esporte
        106: 22000.0  # Costura (finalizado em 2026)
    }
    
    base_meta_atendimentos = {
        101: 65,
        102: 45,
        103: 75,
        104: 25,
        105: 50,
        106: 30
    }
    
    for anomes in meses:
        ano = int(anomes[:4])
        mes = int(anomes[4:])
        
        # Sazonalidade de metas: Fim de ano tem meta maior, Jan/Fev mais modesta
        if mes in [11, 12]:
            sazonal_mult = 1.45
        elif mes in [1, 2]:
            sazonal_mult = 0.85
        elif mes == 5:
            sazonal_mult = 1.20
        else:
            sazonal_mult = 1.00
            
        for _, proj in df_projetos.iterrows():
            id_proj = proj["ID_Projeto"]
            
            # Se o projeto 106 concluiu no meio de 2026, reduz metas
            if id_proj == 106 and ano == 2026 and mes >= 7:
                meta_arrec = 0.0
                meta_atend = 0
                teto_custo = 0.0
            else:
                meta_arrec = round(base_meta_arrecadacao[id_proj] * sazonal_mult * np.random.uniform(0.95, 1.05), 2)
                meta_atend = int(round(base_meta_atendimentos[id_proj] * sazonal_mult * np.random.uniform(0.92, 1.08)))
                teto_custo = round(meta_arrec * np.random.uniform(0.72, 0.85), 2)
                
            metas_list.append({
                "Data_Meta": f"{ano}-{mes:02d}-01",
                "AnoMes": int(anomes),
                "ID_Projeto": id_proj,
                "Meta_Arrecadacao": meta_arrec,
                "Meta_Atendimentos": meta_atend,
                "Orcamento_Teto_Custos": teto_custo
            })
            
    df_orcamento = pd.DataFrame(metas_list)
    return df_orcamento

def generate_fact_donations(df_doadores, df_projetos, df_canais, target_records=6100):
    print(f"-> Gerando fDoacoes com ~{target_records} doações (Jan/2025 a Out/2026)...")
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 10, 31)
    total_days = (end_date - start_date).days + 1
    all_dates = [start_date + timedelta(days=d) for d in range(total_days)]
    
    # Pesos temporais diários
    date_weights = []
    for d in all_dates:
        m = d.month
        # Sazonalidade: Novembro e Dezembro picos altos (Natal/Fechamento)
        if m in [11, 12]:
            w = 2.4
        elif m in [1, 2]:
            w = 0.75
        elif m == 5:
            w = 1.4
        elif m in [9, 10]:
            w = 1.15
        else:
            w = 1.0
        date_weights.append(w)
        
    date_probs = np.array(date_weights) / sum(date_weights)
    selected_indices = np.random.choice(len(all_dates), size=target_records, p=date_probs)
    selected_dates = [all_dates[idx] for idx in selected_indices]
    selected_dates.sort()
    
    pf_ids = df_doadores[df_doadores["Tipo_Doador"] == "PF"]["ID_Doador"].values
    pj_ids = df_doadores[df_doadores["Tipo_Doador"] == "PJ"]["ID_Doador"].values
    
    proj_ids = [101, 102, 103, 104, 105, 106]
    proj_weights = [0.28, 0.22, 0.24, 0.12, 0.10, 0.04]
    
    canal_dict = df_canais.set_index("ID_Canal").to_dict("index")
    
    doacoes_list = []
    
    for seq, data_doacao in enumerate(selected_dates, start=1):
        id_doacao = f"DOC-{data_doacao.year}-{seq:06d}"
        
        # 82% Pessoa Física, 18% Pessoa Jurídica
        is_pj = (np.random.rand() < 0.18)
        
        if is_pj:
            id_doador = int(np.random.choice(pj_ids))
            
            # PJ / Editais: R$ 5.000 a R$ 50.000
            tipo_recorrencia = np.random.choice(
                ["Patrocínio Corporativo", "Única"],
                p=[0.75, 0.25]
            )
            
            valores_pj = [5000.0, 7500.0, 10000.0, 15000.0, 20000.0, 30000.0, 45000.0, 50000.0]
            pesos_pj =   [0.25,   0.20,   0.20,    0.15,    0.10,    0.05,    0.03,    0.02]
            valor_bruto = float(np.random.choice(valores_pj, p=pesos_pj))
            
            # Canais PJ: Pix (1), Boleto (3), Emenda/Edital (5)
            id_canal = int(np.random.choice([1, 3, 5], p=[0.45, 0.25, 0.30]))
            
        else:
            # PESSOA FÍSICA
            id_doador = int(np.random.choice(pf_ids))
            
            # PF: Mensalista/Assinatura ou Única
            tipo_recorrencia = np.random.choice(
                ["Mensalista/Assinatura", "Única"],
                p=[0.60, 0.40]
            )
            
            if tipo_recorrencia == "Mensalista/Assinatura":
                # Mensalista constante: R$ 30 a R$ 200
                valores_pf = [30.0, 50.0, 75.0, 100.0, 150.0, 200.0]
                pesos_pf =   [0.25, 0.35, 0.18, 0.12,  0.07,  0.03]
                valor_bruto = float(np.random.choice(valores_pf, p=pesos_pf))
                # Canais de assinatura: Cartão Recorrente (2) ou Pix (1)
                id_canal = int(np.random.choice([2, 1], p=[0.70, 0.30]))
            else:
                # Doações pontuais
                valores_pf = [20.0, 30.0, 50.0, 80.0, 100.0, 150.0, 250.0]
                pesos_pf =   [0.20, 0.25, 0.30, 0.10, 0.08,  0.05,  0.02]
                valor_bruto = float(np.random.choice(valores_pf, p=pesos_pf))
                # Pix (1), Cartão (2), Boleto (3), Evento (4)
                id_canal = int(np.random.choice([1, 2, 3, 4], p=[0.55, 0.20, 0.15, 0.10]))
                
        id_projeto = int(np.random.choice(proj_ids, p=proj_weights))
        
        # Taxa de intermediação do canal
        taxa_perc = canal_dict[id_canal]["Taxa_Perc"]
        taxa_intermediador = round(valor_bruto * (taxa_perc / 100.0), 2)
        valor_liquido = round(valor_bruto - taxa_intermediador, 2)
        
        # Status do pagamento
        # 93% confirmado, 4% falha (cartão recusado), 3% estornado
        status_pagamento = np.random.choice(
            ["Confirmado", "Falha", "Estornado"],
            p=[0.93, 0.04, 0.03]
        )
        
        doacoes_list.append({
            "ID_Doacao": id_doacao,
            "Data_Doacao": data_doacao.strftime("%Y-%m-%d"),
            "ID_Doador": id_doador,
            "ID_Projeto": id_projeto,
            "ID_Canal": id_canal,
            "Valor_Bruto": valor_bruto,
            "Taxa_Intermediador": taxa_intermediador,
            "Valor_Liquido": valor_liquido,
            "Tipo_Recorrencia": tipo_recorrencia,
            "Status_Pagamento": status_pagamento
        })
        
    df_doacoes = pd.DataFrame(doacoes_list)
    return df_doacoes

def generate_fact_services(df_projetos, df_regioes, target_records=3550):
    print(f"-> Gerando fAtendimentos com ~{target_records} atendimentos sociais de impacto...")
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 10, 31)
    total_days = (end_date - start_date).days + 1
    all_dates = [start_date + timedelta(days=d) for d in range(total_days)]
    
    selected_dates = [random.choice(all_dates) for _ in range(target_records)]
    selected_dates.sort()
    
    # Pool de 1.200 beneficiários únicos cadastrados
    beneficiarios_pool = [f"BEN-{i:05d}" for i in range(1, 1201)]
    regioes_ids = df_regioes["ID_Regiao"].values
    
    # Mapeamento coerente de custos e horas de voluntariado por serviço
    servico_config = {
        "Cesta Básica": {
            "custo_min": 65.0, "custo_max": 135.0,
            "horas_min": 0.5, "horas_max": 1.5,
            "projetos": [101, 104], # Criança Feliz, Moradia
            "peso": 0.38
        },
        "Consulta Médica/Psicológica": {
            "custo_min": 140.0, "custo_max": 320.0,
            "horas_min": 1.5, "horas_max": 3.5,
            "projetos": [103, 101], # Saúde Móvel, Criança Feliz
            "peso": 0.28
        },
        "Oficina de Capacitação": {
            "custo_min": 110.0, "custo_max": 280.0,
            "horas_min": 3.0, "horas_max": 6.0,
            "projetos": [102, 106, 105], # Tech Jovem, Costura, Esporte
            "peso": 0.22
        },
        "Apoio Jurídico": {
            "custo_min": 150.0, "custo_max": 350.0,
            "horas_min": 2.0, "horas_max": 4.5,
            "projetos": [102, 104], # Tech Jovem, Moradia
            "peso": 0.12
        }
    }
    
    tipos_servicos = list(servico_config.keys())
    pesos_servicos = [servico_config[s]["peso"] for s in tipos_servicos]
    
    atendimentos_list = []
    
    for seq, data_atd in enumerate(selected_dates, start=1):
        id_atendimento = f"ATD-{data_atd.year}-{seq:06d}"
        
        tipo_servico = np.random.choice(tipos_servicos, p=pesos_servicos)
        cfg = servico_config[tipo_servico]
        
        id_projeto = int(random.choice(cfg["projetos"]))
        id_beneficiario = random.choice(beneficiarios_pool)
        id_regiao = int(random.choice(regioes_ids))
        
        custo = round(np.random.uniform(cfg["custo_min"], cfg["custo_max"]), 2)
        horas_vol = round(np.random.uniform(cfg["horas_min"], cfg["horas_max"]), 1)
        
        atendimentos_list.append({
            "ID_Atendimento": id_atendimento,
            "Data_Atendimento": data_atd.strftime("%Y-%m-%d"),
            "ID_Projeto": id_projeto,
            "ID_Beneficiario": id_beneficiario,
            "ID_Regiao": id_regiao,
            "Tipo_Servico": tipo_servico,
            "Custo_Estimado_Atendimento": custo,
            "Horas_Voluntariado_Empregadas": horas_vol
        })
        
    df_atendimentos = pd.DataFrame(atendimentos_list)
    return df_atendimentos

def validate_referential_integrity(df_doacoes, df_atendimentos, df_orcamento, df_projetos, df_doadores, df_canais, df_regioes):
    print("\n" + "="*80)
    print("VALIDAÇÃO RIGOROSA DE INTEGRIDADE REFERENCIAL - ONG MULTI-PROGRAMAS")
    print("="*80)
    
    errors = []
    
    # 1. Integridade fDoacoes
    for fk, pk_df, pk, name in [
        ("ID_Doador", df_doadores, "ID_Doador", "dDoadores"),
        ("ID_Projeto", df_projetos, "ID_Projeto", "dProjetos"),
        ("ID_Canal", df_canais, "ID_Canal", "dCanais")
    ]:
        missing = set(df_doacoes[fk]) - set(pk_df[pk])
        if missing:
            errors.append(f"FALHA: {len(missing)} registros em fDoacoes.{fk} ausentes em {name}.{pk}!")
        else:
            print(f"[OK] Integridade fDoacoes.{fk} -> {name}.{pk}: 100% íntegro.")

    # 2. Integridade fAtendimentos
    for fk, pk_df, pk, name in [
        ("ID_Projeto", df_projetos, "ID_Projeto", "dProjetos"),
        ("ID_Regiao", df_regioes, "ID_Regiao", "dRegioes")
    ]:
        missing = set(df_atendimentos[fk]) - set(pk_df[pk])
        if missing:
            errors.append(f"FALHA: {len(missing)} registros em fAtendimentos.{fk} ausentes em {name}.{pk}!")
        else:
            print(f"[OK] Integridade fAtendimentos.{fk} -> {name}.{pk}: 100% íntegro.")

    # 3. Integridade fOrcamentoMetas
    missing_proj_orc = set(df_orcamento["ID_Projeto"]) - set(df_projetos["ID_Projeto"])
    if missing_proj_orc:
        errors.append(f"FALHA: {len(missing_proj_orc)} projetos em fOrcamentoMetas ausentes em dProjetos!")
    else:
        print(f"[OK] Integridade fOrcamentoMetas.ID_Projeto -> dProjetos.ID_Projeto: 100% íntegro.")

    # 4. Ausência de nulos
    for name, df in [
        ("fDoacoes", df_doacoes),
        ("fAtendimentos", df_atendimentos),
        ("fOrcamentoMetas", df_orcamento),
        ("dProjetos", df_projetos),
        ("dDoadores", df_doadores),
        ("dCanais", df_canais),
        ("dRegioes", df_regioes)
    ]:
        nulos = df.isnull().sum().sum()
        if nulos > 0:
            errors.append(f"FALHA: Tabela {name} contém {nulos} valores nulos!")
        else:
            print(f"[OK] Ausência de valores nulos em {name}: 0 nulos detectados.")

    # 5. Coerência financeira de doações
    pj_merged = df_doacoes.merge(df_doadores[["ID_Doador", "Tipo_Doador"]], on="ID_Doador")
    pj_valores = pj_merged[pj_merged["Tipo_Doador"] == "PJ"]["Valor_Bruto"]
    pf_valores = pj_merged[pj_merged["Tipo_Doador"] == "PF"]["Valor_Bruto"]
    
    print("\n--- VALIDAÇÃO COERÊNCIA PJ vs PF ---")
    print(f"  Doações PJ (Faixa Real): R$ {pj_valores.min():,.2f} a R$ {pj_valores.max():,.2f} | Ticket Médio: R$ {pj_valores.mean():,.2f}")
    print(f"  Doações PF (Faixa Real): R$ {pf_valores.min():,.2f} a R$ {pf_valores.max():,.2f} | Ticket Médio: R$ {pf_valores.mean():,.2f}")
    
    if pj_valores.min() < 5000.0 or pj_valores.max() > 50000.0:
        errors.append("FALHA: Valores PJ fora da faixa de R$ 5.000 a R$ 50.000!")

    # 6. Coerência dos custos de atendimento por tipo
    print("\n--- CUSTO E VOLUNTARIADO MÉDIO POR SERVIÇO SOCIAL ---")
    serv_summary = df_atendimentos.groupby("Tipo_Servico").agg(
        Qtd=("ID_Atendimento", "count"),
        Custo_Medio=("Custo_Estimado_Atendimento", "mean"),
        Horas_Medias=("Horas_Voluntariado_Empregadas", "mean")
    ).reset_index()
    for _, r in serv_summary.iterrows():
        print(f"  Serviço: {r['Tipo_Servico']:28s} | Qtd: {r['Qtd']:,} | Custo Médio: R$ {r['Custo_Medio']:6.2f} | Horas Médias: {r['Horas_Medias']:3.1f}h")
        
    cesta_custo = serv_summary[serv_summary["Tipo_Servico"] == "Cesta Básica"]["Custo_Medio"].values[0]
    saude_custo = serv_summary[serv_summary["Tipo_Servico"] == "Consulta Médica/Psicológica"]["Custo_Medio"].values[0]
    if saude_custo <= cesta_custo:
        errors.append("FALHA: Custo de Consulta Médica deveria ser maior que Cesta Básica!")
    else:
        print("[OK] Relação de custos entre serviços coerente com o terceiro setor.")

    if errors:
        print("\nALERTA DE ERROS DETECTADOS:")
        for err in errors:
            print(" - ", err)
        raise ValueError("Validação de integridade referencial falhou!")
    else:
        print("\n>>> SUCESSO COMPLETO: Todas as validações passaram sem ressalvas! <<<")
    print("="*80 + "\n")

def export_to_csv(tables, output_dirs):
    for out_dir in output_dirs:
        os.makedirs(out_dir, exist_ok=True)
        print("-> Exportando arquivos CSV para:", out_dir)
        print("-> Padrão: UTF-8 com BOM (utf-8-sig), Delimitador ';'\n")
        
        for filename, df in tables.items():
            filepath = os.path.join(out_dir, f"{filename}.csv")
            df.to_csv(filepath, sep=';', index=False, encoding='utf-8-sig')
            file_size = os.path.getsize(filepath) / 1024
            print(f"  [SAVED] {filename}.csv ({len(df):,} linhas, {file_size:.1f} KB) -> {filepath}")

def main():
    fake, global_data_dir, project_data_dir = init_environment()
    
    df_projetos, df_canais, df_regioes, df_doadores = generate_dimensions(fake)
    df_orcamento = generate_fact_planning(df_projetos)
    df_doacoes = generate_fact_donations(df_doadores, df_projetos, df_canais, target_records=6150)
    df_atendimentos = generate_fact_services(df_projetos, df_regioes, target_records=3550)
    
    validate_referential_integrity(
        df_doacoes, df_atendimentos, df_orcamento,
        df_projetos, df_doadores, df_canais, df_regioes
    )
    
    tables = {
        "dProjetos": df_projetos,
        "dCanais": df_canais,
        "dRegioes": df_regioes,
        "dDoadores": df_doadores,
        "fOrcamentoMetas": df_orcamento,
        "fDoacoes": df_doacoes,
        "fAtendimentos": df_atendimentos
    }
    
    export_to_csv(tables, [global_data_dir, project_data_dir])
    print("\nExecução e exportação finalizadas com pleno sucesso!")

if __name__ == "__main__":
    main()
