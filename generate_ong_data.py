"""
Script Autônomo de Engenharia de Dados para ONG de Assistência Comunitária
Modelo: Star Schema Multi-Fato (fDoacoes, fAtendimentos, dDoadores, dProjetos, dCanais)
Ambiente: 2025 a 2026
Regras:
  - Exportação CSV: UTF-8 com BOM (utf-8-sig), delimitador ';'
  - Destino: ./data/
  - Volume: ~3.000 doações e ~1.500 atendimentos
  - Coerência de negócio:
      * PJ: Tíquetes de R$ 1.000 a R$ 15.000 (predominância de Pix / Transferência)
      * PF: Tíquetes de R$ 20 a R$ 250 (predominância de Recorrente e Pix / Cartão)
      * Sazonalidade: Picos acentuados em Maio e Dezembro
      * 100% de integridade referencial
"""

import sys
import subprocess

# Auto-instalação de dependências caso necessário
for pkg in ["pandas", "faker", "numpy"]:
    try:
        __import__(pkg)
    except ImportError:
        print(f"-> Instalando dependência ausente: {pkg}...")
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
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    os.makedirs(output_dir, exist_ok=True)
    return fake, output_dir

def generate_dimensions(fake):
    print("-> Gerando Dimensões (dProjetos, dCanais, dDoadores)...")
    
    # 1. dCanais de Doação
    canais_data = [
        {"ID_Canal": 1, "Nome_Canal": "Pix", "Taxa_Intermediacao_Perc": 0.00, "Liquidacao_Dias": 0},
        {"ID_Canal": 2, "Nome_Canal": "Cartão de Crédito", "Taxa_Intermediacao_Perc": 2.50, "Liquidacao_Dias": 30},
        {"ID_Canal": 3, "Nome_Canal": "Boleto Bancário", "Taxa_Intermediacao_Perc": 1.20, "Liquidacao_Dias": 2},
        {"ID_Canal": 4, "Nome_Canal": "Transferência Bancária", "Taxa_Intermediacao_Perc": 0.00, "Liquidacao_Dias": 1},
    ]
    df_canais = pd.DataFrame(canais_data)
    
    # 2. dProjetos Sociais
    projetos_data = [
        {
            "ID_Projeto": 1,
            "Nome_Projeto": "Prato Solidário & Segurança Alimentar",
            "Area_Atuacao": "Alimentação & Nutrição",
            "Meta_Arrecadacao": 450000.00,
            "Responsavel": "Mariana Souza Silveira",
            "Publico_Alvo": "Famílias em vulnerabilidade extrema e pessoas em situação de rua"
        },
        {
            "ID_Projeto": 2,
            "Nome_Projeto": "Futuro Jovem: Capacitação & Oficinas",
            "Area_Atuacao": "Educação & Empregabilidade",
            "Meta_Arrecadacao": 320000.00,
            "Responsavel": "Carlos Eduardo Mendes",
            "Publico_Alvo": "Jovens de 15 a 24 anos da periferia"
        },
        {
            "ID_Projeto": 3,
            "Nome_Projeto": "Saúde Comunitária & Prevenção",
            "Area_Atuacao": "Saúde Básica & Bem-Estar",
            "Meta_Arrecadacao": 380000.00,
            "Responsavel": "Dra. Beatriz Albuquerque",
            "Publico_Alvo": "Idosos, gestantes e crianças sem acesso rápido ao SUS"
        },
        {
            "ID_Projeto": 4,
            "Nome_Projeto": "Cidadania Ativa & Assessoria Jurídica",
            "Area_Atuacao": "Direitos Humanos & Documentação",
            "Meta_Arrecadacao": 180000.00,
            "Responsavel": "Dr. Roberto Antunes Lima",
            "Publico_Alvo": "Imigrantes, refugiados e cidadãos em regularização documental"
        },
        {
            "ID_Projeto": 5,
            "Nome_Projeto": "Inverno Sem Frio (Acolhimento Emergencial)",
            "Area_Atuacao": "Assistência Emergencial",
            "Meta_Arrecadacao": 220000.00,
            "Responsavel": "Fernanda Lima Queiroz",
            "Publico_Alvo": "Comunidades desabrigadas durante o período de baixas temperaturas"
        },
        {
            "ID_Projeto": 6,
            "Nome_Projeto": "Fundo Institucional de Sustentabilidade",
            "Area_Atuacao": "Gestão & Estrutura Operacional",
            "Meta_Arrecadacao": 250000.00,
            "Responsavel": "Diretoria Executiva",
            "Publico_Alvo": "Custeio geral de voluntariado, logística e infraestrutura da sede"
        }
    ]
    df_projetos = pd.DataFrame(projetos_data)
    
    # 3. dDoadores (PF e PJ)
    num_doadores = 400
    doadores_list = []
    
    cidades_estados = [
        ("São Paulo", "SP"),
        ("Campinas", "SP"),
        ("Santos", "SP"),
        ("Rio de Janeiro", "RJ"),
        ("Niterói", "RJ"),
        ("Belo Horizonte", "MG"),
        ("Uberlândia", "MG"),
        ("Curitiba", "PR"),
        ("Porto Alegre", "RS"),
        ("Salvador", "BA"),
        ("Brasília", "DF"),
        ("Recife", "PE")
    ]
    
    for i in range(1, num_doadores + 1):
        id_doador = 1000 + i
        # 82% Pessoa Física, 18% Pessoa Jurídica
        is_pj = np.random.rand() < 0.18
        cid, uf = random.choice(cidades_estados)
        
        data_primeiro = fake.date_between_dates(
            date_start=datetime(2023, 1, 1),
            date_end=datetime(2025, 4, 30)
        )
        
        if is_pj:
            tipo_pessoa = "PJ"
            nome = f"{fake.company()} S.A."
            documento = fake.cnpj()
        else:
            tipo_pessoa = "PF"
            nome = fake.name()
            documento = fake.cpf()
            
        doadores_list.append({
            "ID_Doador": id_doador,
            "Nome": nome,
            "Tipo_Pessoa": tipo_pessoa,
            "Documento": documento,
            "Cidade": cid,
            "Estado": uf,
            "Data_Primeiro_Aporte": data_primeiro.strftime("%Y-%m-%d"),
            "Status_Doador": "Ativo" if np.random.rand() < 0.90 else "Inativo"
        })
        
    df_doadores = pd.DataFrame(doadores_list)
    return df_projetos, df_canais, df_doadores

def generate_fact_donations(df_doadores, df_projetos, df_canais, target_records=3100):
    print(f"-> Gerando fDoacoes com ~{target_records} doações (2025-2026)...")
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 12, 31)
    total_days = (end_date - start_date).days + 1
    all_dates = [start_date + timedelta(days=d) for d in range(total_days)]
    
    # Pesos sazonais mensais (Picos em Maio e Dezembro)
    month_weights = {
        1: 0.85,  # Pós-festas
        2: 0.80,  # Carnaval
        3: 0.95,  # Início de ano letivo
        4: 1.05,  # Campanhas de Páscoa
        5: 1.70,  # PICO: Mês das Mães / Campanha de Outono-Inverno
        6: 1.15,  # Festas juninas comunitárias
        7: 0.90,  # Férias de inverno
        8: 1.00,  # Dia dos Pais / Agosto Lilás
        9: 1.10,  # Campanhas de primavera
        10: 1.25, # Outubro Rosa / Crianças
        11: 1.45, # Novembro Azul / Aquecimento de Natal
        12: 2.30  # PICO MÁXIMO: Natal Solidário e doações de encerramento fiscal PJ
    }
    
    # Probabilidade por dia
    date_probs = []
    for d in all_dates:
        m = d.month
        w = month_weights[m]
        date_probs.append(w)
    date_probs = np.array(date_probs) / sum(date_probs)
    
    selected_indices = np.random.choice(len(all_dates), size=target_records, p=date_probs)
    selected_dates = [all_dates[idx] for idx in selected_indices]
    selected_dates.sort()
    
    # Separação de doadores PF e PJ
    pf_ids = df_doadores[df_doadores["Tipo_Pessoa"] == "PF"]["ID_Doador"].values
    pj_ids = df_doadores[df_doadores["Tipo_Pessoa"] == "PJ"]["ID_Doador"].values
    
    proj_ids = df_projetos["ID_Projeto"].values
    # Pesos de atratividade de projetos
    proj_weights = [0.30, 0.22, 0.18, 0.10, 0.12, 0.08]
    
    doacoes_list = []
    
    for seq, donation_date in enumerate(selected_dates, start=1):
        id_doacao = f"DOC-{donation_date.year}-{seq:05d}"
        
        # 80% doações originadas de PF, 20% de PJ
        if np.random.rand() < 0.80:
            # PESSOA FÍSICA
            id_doador = int(np.random.choice(pf_ids))
            
            # Valores PF: R$ 20 a R$ 250
            # Pesos para tíquetes comuns
            valores_pf = [20.0, 30.0, 50.0, 75.0, 100.0, 120.0, 150.0, 200.0, 250.0]
            pesos_pf =   [0.18, 0.15, 0.28, 0.12, 0.12,  0.06,  0.05,  0.03,  0.01]
            valor = float(np.random.choice(valores_pf, p=pesos_pf))
            
            # Tipo Doação PF: Muitas mensais / recorrentes
            tipo_doacao = np.random.choice(["Recorrente", "Mensal", "Única"], p=[0.40, 0.25, 0.35])
            
            # Canais PF: Pix e Cartão de Crédito dominam
            # 1: Pix, 2: Cartão, 3: Boleto, 4: Transferência
            id_canal = int(np.random.choice([1, 2, 3, 4], p=[0.48, 0.38, 0.10, 0.04]))
            
        else:
            # PESSOA JURÍDICA (Aportes institucionais e Responsabilidade Social)
            id_doador = int(np.random.choice(pj_ids))
            
            # Valores PJ: R$ 1.000 a R$ 15.000
            valores_pj = [1000.0, 2000.0, 3500.0, 5000.0, 7500.0, 10000.0, 12500.0, 15000.0]
            pesos_pj =   [0.22,   0.20,   0.18,   0.18,   0.10,   0.06,    0.04,    0.02]
            valor = float(np.random.choice(valores_pj, p=pesos_pj))
            
            # Tipo Doação PJ: Maioria única (campanha/edital) ou recorrente anual/trimestral
            tipo_doacao = np.random.choice(["Única", "Recorrente", "Mensal"], p=[0.65, 0.25, 0.10])
            
            # Canais PJ: Pix ou Transferência Bancária predominam
            # 1: Pix, 2: Cartão, 3: Boleto, 4: Transferência
            id_canal = int(np.random.choice([1, 4, 3, 2], p=[0.50, 0.38, 0.10, 0.02]))
            
        id_projeto = int(np.random.choice(proj_ids, p=proj_weights))
        
        # Status de Pagamento (Maioria aprovada)
        status_pagamento = np.random.choice(
            ["Aprovada", "Pendente", "Cancelada"],
            p=[0.94, 0.035, 0.025]
        )
        
        doacoes_list.append({
            "ID_Doacao": id_doacao,
            "Data": donation_date.strftime("%Y-%m-%d"),
            "ID_Doador": id_doador,
            "ID_Projeto": id_projeto,
            "ID_Canal": id_canal,
            "Valor": valor,
            "Tipo_Doacao": tipo_doacao,
            "Status_Pagamento": status_pagamento
        })
        
    df_doacoes = pd.DataFrame(doacoes_list)
    return df_doacoes

def generate_fact_services(df_projetos, target_records=1550):
    print(f"-> Gerando fAtendimentos com ~{target_records} atendimentos sociais (2025-2026)...")
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 12, 31)
    total_days = (end_date - start_date).days + 1
    all_dates = [start_date + timedelta(days=d) for d in range(total_days)]
    
    # Distribuição equilibrada ao longo dos 2 anos
    selected_dates = [random.choice(all_dates) for _ in range(target_records)]
    selected_dates.sort()
    
    # Criação de pool de ~650 beneficiários comunitários com identificação única
    beneficiarios_pool = [f"BEN-{i:04d}" for i in range(1, 651)]
    
    # Mapeamento coerente entre Projetos e Categorias de Serviço
    # Categoria_Servico: Alimentação, Capacitação, Apoio Jurídico, Saúde
    projeto_categoria_map = {
        1: ("Alimentação", [40.0, 60.0, 85.0, 110.0]),       # Cestas, marmitas nutritivas
        2: ("Capacitação", [80.0, 120.0, 180.0, 250.0]),    # Cursos, apostilas, mentorias
        3: ("Saúde", [70.0, 110.0, 150.0, 220.0]),          # Consultas, remédios básicos, exames
        4: ("Apoio Jurídico", [120.0, 160.0, 220.0, 320.0]),# Regularização, certidões, orientações
        5: ("Alimentação", [45.0, 75.0, 95.0, 130.0]),      # Cobertores, sopões de inverno
        6: ("Capacitação", [50.0, 75.0, 100.0, 150.0])      # Treinamento de liderança comunitária
    }
    
    atendimentos_list = []
    
    for seq, service_date in enumerate(selected_dates, start=1):
        id_atendimento = f"ATD-{service_date.year}-{seq:05d}"
        id_beneficiario = random.choice(beneficiarios_pool)
        
        # Escolhe projeto
        id_projeto = random.choices(
            [1, 2, 3, 4, 5, 6],
            weights=[0.38, 0.22, 0.20, 0.10, 0.07, 0.03]
        )[0]
        
        categoria, custos_range = projeto_categoria_map[id_projeto]
        
        # Custo do atendimento com leve variação aleatória
        custo_base = random.choice(custos_range)
        fator_variacao = np.random.uniform(0.92, 1.08)
        custo_atendimento = round(custo_base * fator_variacao, 2)
        
        atendimentos_list.append({
            "ID_Atendimento": id_atendimento,
            "Data": service_date.strftime("%Y-%m-%d"),
            "ID_Beneficiario": id_beneficiario,
            "ID_Projeto": id_projeto,
            "Categoria_Servico": categoria,
            "Custo_Atendimento": custo_atendimento
        })
        
    df_atendimentos = pd.DataFrame(atendimentos_list)
    return df_atendimentos

def validate_referential_integrity(df_doacoes, df_atendimentos, df_doadores, df_projetos, df_canais):
    print("\n" + "="*75)
    print("VALIDAÇÃO RIGOROSA DE INTEGRIDADE REFERENCIAL - ONG SOCIAL")
    print("="*75)
    
    errors = []
    
    # 1. Integridade fDoacoes -> dDoadores
    missing_doadores = set(df_doacoes["ID_Doador"]) - set(df_doadores["ID_Doador"])
    if missing_doadores:
        errors.append(f"FALHA: {len(missing_doadores)} doadores em fDoacoes não existem em dDoadores!")
    else:
        print("[OK] Integridade fDoacoes.ID_Doador -> dDoadores.ID_Doador: 100% íntegro.")

    # 2. Integridade fDoacoes -> dProjetos
    missing_proj_doc = set(df_doacoes["ID_Projeto"]) - set(df_projetos["ID_Projeto"])
    if missing_proj_doc:
        errors.append(f"FALHA: {len(missing_proj_doc)} projetos em fDoacoes não existem em dProjetos!")
    else:
        print("[OK] Integridade fDoacoes.ID_Projeto -> dProjetos.ID_Projeto: 100% íntegro.")

    # 3. Integridade fDoacoes -> dCanais
    missing_canais = set(df_doacoes["ID_Canal"]) - set(df_canais["ID_Canal"])
    if missing_canais:
        errors.append(f"FALHA: {len(missing_canais)} canais em fDoacoes não existem em dCanais!")
    else:
        print("[OK] Integridade fDoacoes.ID_Canal -> dCanais.ID_Canal: 100% íntegro.")

    # 4. Integridade fAtendimentos -> dProjetos
    missing_proj_atd = set(df_atendimentos["ID_Projeto"]) - set(df_projetos["ID_Projeto"])
    if missing_proj_atd:
        errors.append(f"FALHA: {len(missing_proj_atd)} projetos em fAtendimentos não existem em dProjetos!")
    else:
        print("[OK] Integridade fAtendimentos.ID_Projeto -> dProjetos.ID_Projeto: 100% íntegro.")

    # 5. Ausência de valores nulos
    for name, df in [
        ("fDoacoes", df_doacoes),
        ("fAtendimentos", df_atendimentos),
        ("dDoadores", df_doadores),
        ("dProjetos", df_projetos),
        ("dCanais", df_canais)
    ]:
        nulos = df.isnull().sum().sum()
        if nulos > 0:
            errors.append(f"FALHA: Tabela {name} contém {nulos} valores nulos!")
        else:
            print(f"[OK] Ausência de valores nulos em {name}: 0 nulos.")

    # 6. Validação das Regras de Negócio de Doações PJ vs PF
    merged_doc = df_doacoes.merge(df_doadores[["ID_Doador", "Tipo_Pessoa"]], on="ID_Doador", how="left")
    pj_min = merged_doc[merged_doc["Tipo_Pessoa"] == "PJ"]["Valor"].min()
    pj_max = merged_doc[merged_doc["Tipo_Pessoa"] == "PJ"]["Valor"].max()
    pf_min = merged_doc[merged_doc["Tipo_Pessoa"] == "PF"]["Valor"].min()
    pf_max = merged_doc[merged_doc["Tipo_Pessoa"] == "PF"]["Valor"].max()
    
    print(f"\n--- VALIDAÇÃO COERÊNCIA PJ vs PF ---")
    print(f"  Pessoa Jurídica (PJ) -> Faixa Real: R$ {pj_min:,.2f} a R$ {pj_max:,.2f}")
    print(f"  Pessoa Física (PF)   -> Faixa Real: R$ {pf_min:,.2f} a R$ {pf_max:,.2f}")
    
    if pj_min < 1000.0 or pj_max > 15000.0:
        errors.append("FALHA: Valores de doação PJ fora da faixa estipulada (R$ 1.000 a R$ 15.000)!")
    if pf_min < 20.0 or pf_max > 250.0:
        errors.append("FALHA: Valores de doação PF fora da faixa estipulada (R$ 20 a R$ 250)!")

    # 7. Validação da Sazonalidade (Picos em Maio e Dezembro)
    df_doacoes["Mes"] = pd.to_datetime(df_doacoes["Data"]).dt.month
    monthly_vol = df_doacoes.groupby("Mes").agg(
        Qtd_Doacoes=("ID_Doacao", "count"),
        Total_Arrecadado=("Valor", "sum")
    ).reset_index()
    
    print("\n--- DISTRIBUIÇÃO SAZONAL MENSAL (CONSOLIDAÇÃO 2025-2026) ---")
    meses_nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    for _, row in monthly_vol.iterrows():
        m_idx = int(row["Mes"]) - 1
        print(f"  Mês {meses_nomes[m_idx]:3s}: {row['Qtd_Doacoes']:,} doações | Total: R$ {row['Total_Arrecadado']:,.2f}")
        
    mai_dez_qtd = monthly_vol[monthly_vol["Mes"].isin([5, 12])]["Qtd_Doacoes"].sum()
    perc_mai_dez = (mai_dez_qtd / len(df_doacoes)) * 100
    print(f"\n[OK] Concentração Maio + Dezembro: {perc_mai_dez:.2f}% do volume de doações.")
    
    # 8. Estatísticas Finais de Atendimentos
    print("\n--- RESUMO DE ATENDIMENTOS SOCIAIS ---")
    cat_summary = df_atendimentos.groupby("Categoria_Servico").agg(
        Qtd=("ID_Atendimento", "count"),
        Custo_Total=("Custo_Atendimento", "sum"),
        Custo_Medio=("Custo_Atendimento", "mean")
    ).reset_index()
    for _, r in cat_summary.iterrows():
        print(f"  Serviço: {r['Categoria_Servico']:15s} | {r['Qtd']:,} atendimentos | Custo Total: R$ {r['Custo_Total']:,.2f} | Custo Médio: R$ {r['Custo_Medio']:,.2f}")

    if errors:
        print("\nALERTA DE ERROS ENCONTRADOS:")
        for err in errors:
            print(" - ", err)
        raise ValueError("Validação de integridade referencial ou regras de negócio falhou!")
    else:
        print("\n>>> SUCESSO COMPLETO: Todas as validações passaram sem ressalvas! <<<")
    print("="*75 + "\n")

def export_to_csv(tables, output_dir):
    print("-> Exportando arquivos CSV para o diretório:", output_dir)
    print("-> Padrão: Codificação UTF-8 com BOM (utf-8-sig), Delimitador ';'\n")
    
    for filename, df in tables.items():
        filepath = os.path.join(output_dir, f"{filename}.csv")
        # Se coluna auxiliar foi adicionada, remover antes de salvar
        df_export = df.copy()
        if "Mes" in df_export.columns:
            df_export = df_export.drop(columns=["Mes"])
            
        df_export.to_csv(filepath, sep=';', index=False, encoding='utf-8-sig')
        file_size = os.path.getsize(filepath) / 1024
        print(f"  [SAVED] {filename}.csv ({len(df_export):,} linhas, {file_size:.1f} KB) -> {filepath}")

def main():
    fake, output_dir = init_environment()
    
    df_projetos, df_canais, df_doadores = generate_dimensions(fake)
    df_doacoes = generate_fact_donations(df_doadores, df_projetos, df_canais, target_records=3050)
    df_atendimentos = generate_fact_services(df_projetos, target_records=1520)
    
    validate_referential_integrity(df_doacoes, df_atendimentos, df_doadores, df_projetos, df_canais)
    
    tables = {
        "dProjetos": df_projetos,
        "dCanais": df_canais,
        "dDoadores": df_doadores,
        "fDoacoes": df_doacoes,
        "fAtendimentos": df_atendimentos
    }
    
    export_to_csv(tables, output_dir)
    print("\nProcesso finalizado com êxito absoluto!")

if __name__ == "__main__":
    main()
