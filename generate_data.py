"""
Script Autônomo de Geração e Validação de Dados Analíticos
Empresa: Distribuidora de Bebidas 'Vale do Malte Distribuidora'
Modelo: Star Schema (fVendas, dClientes, dProdutos, dCanais)
Regras:
  - Formato CSV: UTF-8, delimitador ';'
  - Pasta de saída: ./data/
  - Sazonalidade: Picos acentuados nas sextas-feiras, sábados e quintas-feiras
  - Volume: ~5.000 registros de vendas com integridade referencial estrita
"""

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
    print("-> Gerando Dimensões (dProdutos, dClientes, dCanais)...")
    
    # 1. dCanais
    canais_data = [
        {"ID_Canal": 1, "Nome_Canal": "Venda Direta / Balcão", "Tipo_Canal": "Presencial", "Prazo_Medio_Entrega_Dias": 0},
        {"ID_Canal": 2, "Nome_Canal": "Representante Externo B2B", "Tipo_Canal": "Consultiva", "Prazo_Medio_Entrega_Dias": 2},
        {"ID_Canal": 3, "Nome_Canal": "E-Commerce B2B / App", "Tipo_Canal": "Digital", "Prazo_Medio_Entrega_Dias": 1},
        {"ID_Canal": 4, "Nome_Canal": "Televendas B2B", "Tipo_Canal": "Remota", "Prazo_Medio_Entrega_Dias": 2},
    ]
    df_canais = pd.DataFrame(canais_data)
    
    # 2. dProdutos (Mix de bebidas típico de distribuidora)
    produtos_data = [
        # Cervejas Tradicionais e Especiais
        {"ID_Produto": 101, "Nome_Produto": "Cerveja Pilsen Lata 350ml (Pack 12 un)", "Categoria": "Cervejas", "Subcategoria": "Mainstream", "Volume_Emb": "Pack 12x350ml", "Preco_Tabela": 42.00, "Custo_Padrao": 28.50},
        {"ID_Produto": 102, "Nome_Produto": "Cerveja Puro Malte Lata 350ml (Pack 12 un)", "Categoria": "Cervejas", "Subcategoria": "Premium", "Volume_Emb": "Pack 12x350ml", "Preco_Tabela": 54.00, "Custo_Padrao": 36.00},
        {"ID_Produto": 103, "Nome_Produto": "Cerveja IPA Garrafa 600ml (Cx 6 un)", "Categoria": "Cervejas", "Subcategoria": "Artesanal", "Volume_Emb": "Cx 6x600ml", "Preco_Tabela": 78.00, "Custo_Padrao": 49.00},
        {"ID_Produto": 104, "Nome_Produto": "Cerveja Long Neck 330ml (Cx 24 un)", "Categoria": "Cervejas", "Subcategoria": "Premium", "Volume_Emb": "Cx 24x330ml", "Preco_Tabela": 135.00, "Custo_Padrao": 92.00},
        {"ID_Produto": 105, "Nome_Produto": "Cerveja Zero Álcool Lata 350ml (Pack 12 un)", "Categoria": "Cervejas", "Subcategoria": "Saudável", "Volume_Emb": "Pack 12x350ml", "Preco_Tabela": 48.00, "Custo_Padrao": 32.50},
        {"ID_Produto": 106, "Nome_Produto": "Chopp Pilsen Barril 50 Litros", "Categoria": "Cervejas", "Subcategoria": "Barril", "Volume_Emb": "Barril 50L", "Preco_Tabela": 490.00, "Custo_Padrao": 295.00},
        
        # Não Alcoólicos - Refrigerantes, Sucos e Águas
        {"ID_Produto": 201, "Nome_Produto": "Refrigerante Cola Pet 2L (Fardo 6 un)", "Categoria": "Refrigerantes", "Subcategoria": "PET", "Volume_Emb": "Fd 6x2L", "Preco_Tabela": 48.00, "Custo_Padrao": 31.00},
        {"ID_Produto": 202, "Nome_Produto": "Refrigerante Guaraná Lata 350ml (Pack 12 un)", "Categoria": "Refrigerantes", "Subcategoria": "Lata", "Volume_Emb": "Pack 12x350ml", "Preco_Tabela": 36.00, "Custo_Padrao": 22.00},
        {"ID_Produto": 203, "Nome_Produto": "Refrigerante Limão Zero Lata 350ml (Pack 12 un)", "Categoria": "Refrigerantes", "Subcategoria": "Zero", "Volume_Emb": "Pack 12x350ml", "Preco_Tabela": 38.00, "Custo_Padrao": 23.50},
        {"ID_Produto": 204, "Nome_Produto": "Água Mineral s/ Gás 500ml (Fardo 12 un)", "Categoria": "Águas", "Subcategoria": "Sem Gás", "Volume_Emb": "Fd 12x500ml", "Preco_Tabela": 24.00, "Custo_Padrao": 11.50},
        {"ID_Produto": 205, "Nome_Produto": "Água Mineral c/ Gás 500ml (Fardo 12 un)", "Categoria": "Águas", "Subcategoria": "Com Gás", "Volume_Emb": "Fd 12x500ml", "Preco_Tabela": 28.00, "Custo_Padrao": 13.00},
        {"ID_Produto": 206, "Nome_Produto": "Água Tônica Lata 350ml (Pack 12 un)", "Categoria": "Não Alcoólicos", "Subcategoria": "Misturadores", "Volume_Emb": "Pack 12x350ml", "Preco_Tabela": 45.00, "Custo_Padrao": 27.00},
        {"ID_Produto": 207, "Nome_Produto": "Suco Integral de Laranja 1L (Cx 6 un)", "Categoria": "Sucos", "Subcategoria": "Integral", "Volume_Emb": "Cx 6x1L", "Preco_Tabela": 58.00, "Custo_Padrao": 38.00},
        {"ID_Produto": 208, "Nome_Produto": "Suco Uva Tinto Integral 1.5L (Cx 6 un)", "Categoria": "Sucos", "Subcategoria": "Integral", "Volume_Emb": "Cx 6x1.5L", "Preco_Tabela": 72.00, "Custo_Padrao": 46.00},

        # Energéticos e Isotônicos
        {"ID_Produto": 301, "Nome_Produto": "Energético Original Lata 250ml (Pack 6 un)", "Categoria": "Energéticos", "Subcategoria": "Lata", "Volume_Emb": "Pack 6x250ml", "Preco_Tabela": 54.00, "Custo_Padrao": 33.00},
        {"ID_Produto": 302, "Nome_Produto": "Energético Tropical Lata 473ml (Pack 6 un)", "Categoria": "Energéticos", "Subcategoria": "Lata Grande", "Volume_Emb": "Pack 6x473ml", "Preco_Tabela": 66.00, "Custo_Padrao": 41.00},
        {"ID_Produto": 303, "Nome_Produto": "Isotônico Tangerina 500ml (Cx 6 un)", "Categoria": "Isotônicos", "Subcategoria": "Garrafa", "Volume_Emb": "Cx 6x500ml", "Preco_Tabela": 39.00, "Custo_Padrao": 24.00},

        # Destilados e Vinhos
        {"ID_Produto": 401, "Nome_Produto": "Gin London Dry 750ml (Garrafa)", "Categoria": "Destilados", "Subcategoria": "Gin", "Volume_Emb": "Gfa 750ml", "Preco_Tabela": 95.00, "Custo_Padrao": 58.00},
        {"ID_Produto": 402, "Nome_Produto": "Vodka Premium 1L (Garrafa)", "Categoria": "Destilados", "Subcategoria": "Vodka", "Volume_Emb": "Gfa 1L", "Preco_Tabela": 85.00, "Custo_Padrao": 51.00},
        {"ID_Produto": 403, "Nome_Produto": "Whisky Escocês 8 Anos 1L (Garrafa)", "Categoria": "Destilados", "Subcategoria": "Whisky", "Volume_Emb": "Gfa 1L", "Preco_Tabela": 120.00, "Custo_Padrao": 76.00},
        {"ID_Produto": 404, "Nome_Produto": "Cachaça Prata Envelhecida 700ml (Garrafa)", "Categoria": "Destilados", "Subcategoria": "Cachaça", "Volume_Emb": "Gfa 700ml", "Preco_Tabela": 46.00, "Custo_Padrao": 26.00},
        {"ID_Produto": 405, "Nome_Produto": "Vino Tinto Seco Cabernet 750ml (Cx 6 un)", "Categoria": "Vinhos", "Subcategoria": "Tinto", "Volume_Emb": "Cx 6x750ml", "Preco_Tabela": 210.00, "Custo_Padrao": 132.00},
    ]
    df_produtos = pd.DataFrame(produtos_data)

    # 3. dClientes (B2B: Bares, Restaurantes, Empórios, Mercados, Casas Noturnas)
    tipos_clientes = [
        {"Tipo": "Bar & Pub", "Segmento": "Food Service / Noturno", "Peso": 0.35},
        {"Tipo": "Restaurante", "Segmento": "Food Service", "Peso": 0.25},
        {"Tipo": "Mercado & Conveniência", "Segmento": "Varejo Rápido", "Peso": 0.20},
        {"Tipo": "Adega & Empório", "Segmento": "Especializado", "Peso": 0.12},
        {"Tipo": "Casa de Eventos & Buffet", "Segmento": "Eventos", "Peso": 0.08},
    ]
    
    cidades_estados = [
        ("São Paulo", "SP", "Sudeste"),
        ("Campinas", "SP", "Sudeste"),
        ("Santos", "SP", "Sudeste"),
        ("São José dos Campos", "SP", "Sudeste"),
        ("Ribeirão Preto", "SP", "Sudeste"),
        ("Sorocaba", "SP", "Sudeste"),
        ("Belo Horizonte", "MG", "Sudeste"),
        ("Uberlândia", "MG", "Sudeste"),
        ("Curitiba", "PR", "Sul"),
        ("Londrina", "PR", "Sul"),
        ("Rio de Janeiro", "RJ", "Sudeste"),
        ("Niterói", "RJ", "Sudeste"),
    ]

    num_clientes = 250
    clientes_list = []
    
    # Prefixos comerciais para nomes realistas
    prefixos = ["Bar do", "Boteco", "Adega", "Empório", "Restaurante", "Espetinho", "Pizzaria", "Hamburgueria", "Pub", "Mercearia", "Point do", "Taverna"]

    for i in range(1, num_clientes + 1):
        tipo_choice = random.choices(tipos_clientes, weights=[t["Peso"] for t in tipos_clientes])[0]
        cid_est = random.choice(cidades_estados)
        prefixo = random.choice(prefixos)
        nome_completo = f"{prefixo} {fake.first_name()} {fake.last_name()}"
        razao_social = f"{fake.company()} Bebidas e Alimentos LTDA"
        
        data_cadastro = fake.date_between_dates(
            date_start=datetime(2021, 1, 1),
            date_end=datetime(2023, 12, 31)
        )
        
        status = np.random.choice(["Ativo", "Inativo"], p=[0.93, 0.07])
        limite_credito = round(random.choice([5000, 10000, 15000, 25000, 50000, 80000]), 2)
        
        clientes_list.append({
            "ID_Cliente": 1000 + i,
            "Nome_Fantasia": nome_completo,
            "Razao_Social": razao_social,
            "CNPJ": fake.cnpj(),
            "Tipo_Cliente": tipo_choice["Tipo"],
            "Segmento": tipo_choice["Segmento"],
            "Cidade": cid_est[0],
            "UF": cid_est[1],
            "Regiao": cid_est[2],
            "Limite_Credito": limite_credito,
            "Data_Cadastro": data_cadastro.strftime("%Y-%m-%d"),
            "Status": status
        })
        
    df_clientes = pd.DataFrame(clientes_list)
    
    return df_produtos, df_clientes, df_canais

def generate_fact_sales(df_produtos, df_clientes, df_canais, target_records=5200):
    print(f"-> Gerando fVendas com ~{target_records} registros e sazonalidade de final de semana...")
    
    # Filtrar clientes ativos para preferência de compras
    clientes_ativos = df_clientes[df_clientes["Status"] == "Ativo"]["ID_Cliente"].values
    clientes_inativos = df_clientes[df_clientes["Status"] == "Inativo"]["ID_Cliente"].values
    
    # Pesos de canais de vendas (Representante e App são mais fortes no B2B)
    canais_ids = df_canais["ID_Canal"].values
    canais_pesos = [0.15, 0.45, 0.25, 0.15] # Balcão, Representante, E-commerce/App, Televendas
    
    # Pesos de produtos (Cervejas e Refrigerantes vendem mais em volume)
    # Atribuir pesos de demanda baseados na categoria
    prod_pesos = []
    for cat in df_produtos["Categoria"].values:
        if cat == "Cervejas":
            prod_pesos.append(0.40)
        elif cat == "Refrigerantes":
            prod_pesos.append(0.25)
        elif cat == "Energéticos":
            prod_pesos.append(0.12)
        elif cat == "Águas":
            prod_pesos.append(0.10)
        elif cat == "Destilados":
            prod_pesos.append(0.08)
        else:
            prod_pesos.append(0.05)
    prod_pesos = np.array(prod_pesos) / sum(prod_pesos)
    
    # Configuração temporal: Ano de 2024 (Ano fechado completo para métricas YTD e MoM sem distorção)
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2024, 12, 31)
    total_days = (end_date - start_date).days + 1
    
    # Sazonalidade dos dias da semana (Distribuidora de Bebidas abastece para o fim de semana):
    # Segunda (0): 6%
    # Terça (1): 8%
    # Quarta (2): 11%
    # Quinta (3): 21% (Bares e restaurantes reforçam estoque)
    # Sexta (4): 29% (Pico máximo de reposição rápida e fim de semana)
    # Sábado (5): 19% (Operação de emergência / reposição imediata de fim de semana)
    # Domingo (6): 6% (Plantão de reposição e canais digitais)
    dow_weights = {0: 0.06, 1: 0.08, 2: 0.11, 3: 0.21, 4: 0.29, 5: 0.19, 6: 0.06}
    
    # Sazonalidade mensal (Meses quentes vendem mais no Brasil: Nov, Dez, Jan, Fev):
    month_weights = {
        1: 1.25,  # Verão / Férias
        2: 1.30,  # Carnaval / Verão
        3: 1.00,  # Outono
        4: 0.90,
        5: 0.85,  # Frio inicial
        6: 0.80,  # Inverno
        7: 0.80,  # Inverno
        8: 0.85,
        9: 0.95,  # Primavera
        10: 1.05,
        11: 1.20, # Esquenta fim de ano
        12: 1.45  # Festas de Natal, Réveillon, Verão
    }
    
    # Calcular probabilidades para cada dia do ano
    all_dates = [start_date + timedelta(days=d) for d in range(total_days)]
    date_probs = []
    for d in all_dates:
        dow = d.weekday()
        m = d.month
        prob = dow_weights[dow] * month_weights[m]
        date_probs.append(prob)
    date_probs = np.array(date_probs) / sum(date_probs)
    
    # Gerar datas com a distribuição calculada
    selected_indices = np.random.choice(len(all_dates), size=target_records, p=date_probs)
    selected_dates = [all_dates[idx] for idx in selected_indices]
    selected_dates.sort() # Ordenar cronologicamente
    
    # Dicionário rápido de produtos para preços e custos
    prod_dict = df_produtos.set_index("ID_Produto").to_dict("index")
    
    vendas_list = []
    
    for seq, sale_date in enumerate(selected_dates, start=1):
        id_venda = f"VND-2024-{seq:05d}"
        
        # 96% de chance de cliente ativo, 4% de cliente que comprou antes de inativar
        if np.random.rand() < 0.96 and len(clientes_ativos) > 0:
            id_cliente = int(np.random.choice(clientes_ativos))
        else:
            id_cliente = int(np.random.choice(clientes_inativos))
            
        id_canal = int(np.random.choice(canais_ids, p=canais_pesos))
        id_produto = int(np.random.choice(df_produtos["ID_Produto"].values, p=prod_pesos))
        
        prod_info = prod_dict[id_produto]
        categoria = prod_info["Categoria"]
        preco_tabela = prod_info["Preco_Tabela"]
        custo_padrao = prod_info["Custo_Padrao"]
        
        # Quantidade por pedido (B2B compra volumes em fardos/grades/caixas)
        if categoria in ["Cervejas", "Refrigerantes"]:
            # Volume maior
            qtd = int(np.random.choice(
                [5, 10, 15, 20, 30, 50, 80, 100], 
                p=[0.15, 0.25, 0.20, 0.18, 0.12, 0.06, 0.03, 0.01]
            ))
        elif categoria in ["Destilados", "Vinhos"]:
            # Volume menor / maior valor agregado
            qtd = int(np.random.choice(
                [2, 3, 5, 6, 10, 12, 18, 24],
                p=[0.20, 0.25, 0.25, 0.15, 0.08, 0.04, 0.02, 0.01]
            ))
        elif categoria == "Chopp Pilsen Barril 50 Litros" or prod_info["Subcategoria"] == "Barril":
            qtd = int(np.random.choice([1, 2, 3, 4, 6], p=[0.40, 0.30, 0.18, 0.08, 0.04]))
        else:
            qtd = int(np.random.choice([3, 5, 8, 10, 15, 20], p=[0.20, 0.30, 0.20, 0.15, 0.10, 0.05]))
            
        # Variação real de preço unitário (negociação comercial entre -5% e +3%)
        fator_preco = np.random.uniform(0.95, 1.03)
        preco_unitario = round(preco_tabela * fator_preco, 2)
        
        valor_bruto = round(qtd * preco_unitario, 2)
        
        # Desconto comercial concedido baseado no volume
        if qtd >= 50:
            perc_desc = np.random.uniform(0.06, 0.10)
        elif qtd >= 20:
            perc_desc = np.random.uniform(0.03, 0.06)
        elif qtd >= 10:
            perc_desc = np.random.uniform(0.01, 0.03)
        else:
            perc_desc = 0.0 if np.random.rand() > 0.3 else np.random.uniform(0.01, 0.02)
            
        valor_desconto = round(valor_bruto * perc_desc, 2)
        valor_liquido = round(valor_bruto - valor_desconto, 2)
        
        custo_total = round(qtd * custo_padrao, 2)
        lucro_bruto = round(valor_liquido - custo_total, 2)
        
        # Forma de pagamento típica B2B
        forma_pagto = np.random.choice(
            ["Boleto Bancário 28D", "Boleto Bancário 14D", "PIX", "Cartão Corporativo", "Boleto Bancário 45D"],
            p=[0.45, 0.25, 0.15, 0.10, 0.05]
        )
        
        vendas_list.append({
            "ID_Venda": id_venda,
            "Data_Venda": sale_date.strftime("%Y-%m-%d"),
            "ID_Cliente": id_cliente,
            "ID_Produto": id_produto,
            "ID_Canal": id_canal,
            "Quantidade": qtd,
            "Preco_Unitario": preco_unitario,
            "Valor_Bruto": valor_bruto,
            "Valor_Desconto": valor_desconto,
            "Valor_Liquido": valor_liquido,
            "Custo_Total": custo_total,
            "Lucro_Bruto": lucro_bruto,
            "Forma_Pagamento": forma_pagto
        })
        
    df_vendas = pd.DataFrame(vendas_list)
    return df_vendas

def validate_referential_integrity(df_vendas, df_clientes, df_produtos, df_canais):
    print("\n" + "="*70)
    print("VALIDAÇÃO RIGOROSA DE INTEGRIDADE REFERENCIAL E COERÊNCIA ANALÍTICA")
    print("="*70)
    
    errors = []
    
    # 1. Integridade fVendas -> dClientes
    missing_clientes = set(df_vendas["ID_Cliente"]) - set(df_clientes["ID_Cliente"])
    if missing_clientes:
        errors.append(f"FALHA: {len(missing_clientes)} clientes em fVendas não existem em dClientes!")
    else:
        print("[OK] Integridade fVendas.ID_Cliente -> dClientes.ID_Cliente: 100% íntegro.")
        
    # 2. Integridade fVendas -> dProdutos
    missing_produtos = set(df_vendas["ID_Produto"]) - set(df_produtos["ID_Produto"])
    if missing_produtos:
        errors.append(f"FALHA: {len(missing_produtos)} produtos em fVendas não existem em dProdutos!")
    else:
        print("[OK] Integridade fVendas.ID_Produto -> dProdutos.ID_Produto: 100% íntegro.")
        
    # 3. Integridade fVendas -> dCanais
    missing_canais = set(df_vendas["ID_Canal"]) - set(df_canais["ID_Canal"])
    if missing_canais:
        errors.append(f"FALHA: {len(missing_canais)} canais em fVendas não existem em dCanais!")
    else:
        print("[OK] Integridade fVendas.ID_Canal -> dCanais.ID_Canal: 100% íntegro.")
        
    # 4. Checagem de nulos em chaves primárias e estrangeiras
    for name, df in [("fVendas", df_vendas), ("dClientes", df_clientes), ("dProdutos", df_produtos), ("dCanais", df_canais)]:
        null_counts = df.isnull().sum()
        total_nulls = null_counts.sum()
        if total_nulls > 0:
            errors.append(f"FALHA: Tabela {name} possui {total_nulls} valores nulos!")
        else:
            print(f"[OK] Ausência de valores nulos em {name}: 0 nulos detectados.")
            
    # 5. Coerência matemática
    diff_liq = np.abs(df_vendas["Valor_Liquido"] - (df_vendas["Valor_Bruto"] - df_vendas["Valor_Desconto"]))
    max_diff_liq = diff_liq.max()
    if max_diff_liq > 0.02:
        errors.append(f"FALHA matemática: Valor Líquido difere do cálculo (max diff: {max_diff_liq})")
    else:
        print(f"[OK] Coerência matemática Valor_Liquido = Valor_Bruto - Desconto: Perfeito.")

    diff_lucro = np.abs(df_vendas["Lucro_Bruto"] - (df_vendas["Valor_Liquido"] - df_vendas["Custo_Total"]))
    max_diff_lucro = diff_lucro.max()
    if max_diff_lucro > 0.02:
        errors.append(f"FALHA matemática: Lucro Bruto difere do cálculo (max diff: {max_diff_lucro})")
    else:
        print(f"[OK] Coerência matemática Lucro_Bruto = Valor_Liquido - Custo_Total: Perfeito.")

    # 6. Validação da sazonalidade de final de semana
    df_vendas_temp = df_vendas.copy()
    df_vendas_temp["Data_Obj"] = pd.to_datetime(df_vendas_temp["Data_Venda"])
    df_vendas_temp["Dia_Semana"] = df_vendas_temp["Data_Obj"].dt.day_name()
    df_vendas_temp["DayOfWeek_Num"] = df_vendas_temp["Data_Obj"].dt.dayofweek
    
    # Agrupamento
    dow_summary = df_vendas_temp.groupby("DayOfWeek_Num").agg(
        Qtd_Vendas=("ID_Venda", "count"),
        Faturamento_Liquido=("Valor_Liquido", "sum")
    ).reset_index()
    
    dow_names = ["0-Segunda", "1-Terça", "2-Quarta", "3-Quinta", "4-Sexta", "5-Sábado", "6-Domingo"]
    dow_summary["Dia"] = dow_summary["DayOfWeek_Num"].map(lambda x: dow_names[x])
    dow_summary["%_Pedidos"] = (dow_summary["Qtd_Vendas"] / len(df_vendas) * 100).round(2)
    
    print("\n--- DISTRIBUIÇÃO POR DIA DA SEMANA (EFEITO SAZONALIDADE) ---")
    for _, row in dow_summary.iterrows():
        print(f"  {row['Dia']}: {row['Qtd_Vendas']:,} pedidos ({row['%_Pedidos']}%) | Fat: R$ {row['Faturamento_Liquido']:,.2f}")
        
    fim_de_semana_pedidos = dow_summary[dow_summary["DayOfWeek_Num"].isin([3, 4, 5])]["Qtd_Vendas"].sum()
    perc_weekend_rush = (fim_de_semana_pedidos / len(df_vendas)) * 100
    print(f"\n[OK] Concentração Qui+Sex+Sáb (Pico Distribuidora): {perc_weekend_rush:.2f}% do volume total.")
    
    if errors:
        print("\nALERTA: Foram encontrados os seguintes erros:")
        for err in errors:
            print(" - ", err)
        raise ValueError("Validação de integridade referencial falhou.")
    else:
        print("\n>>> SUCESSO ABSOLUTO: Todas as validações passaram sem ressalvas! <<<")
    print("="*70 + "\n")

def export_to_csv(tables, output_dir):
    print("-> Exportando arquivos CSV para o diretório:", output_dir)
    print("-> Padrão: Codificação UTF-8, Delimitador ';'\n")
    
    for filename, df in tables.items():
        filepath = os.path.join(output_dir, f"{filename}.csv")
        # UTF-8 com BOM para abrir perfeitamente tanto no Excel brasileiro quanto no Power BI Desktop
        df.to_csv(filepath, sep=';', index=False, encoding='utf-8-sig')
        file_size = os.path.getsize(filepath) / 1024
        print(f"  [SAVED] {filename}.csv ({len(df):,} linhas, {file_size:.1f} KB) -> {filepath}")

def main():
    fake, output_dir = init_environment()
    
    df_produtos, df_clientes, df_canais = generate_dimensions(fake)
    df_vendas = generate_fact_sales(df_produtos, df_clientes, df_canais, target_records=5250)
    
    validate_referential_integrity(df_vendas, df_clientes, df_produtos, df_canais)
    
    tables = {
        "dProdutos": df_produtos,
        "dClientes": df_clientes,
        "dCanais": df_canais,
        "fVendas": df_vendas
    }
    
    export_to_csv(tables, output_dir)
    print("\nProcesso finalizado com sucesso!")

if __name__ == "__main__":
    main()
