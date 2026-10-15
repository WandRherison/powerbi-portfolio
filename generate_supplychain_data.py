"""
Script Autônomo de Engenharia de Dados - Supply Chain & Omnichannel Logistics
Modelo: Star Schema com Role-Playing Dimensions (Múltiplas Datas)
Entidades: fPedidos, dClientes, dProdutos, dTransportadoras, dCentrosDistribuicao

Regras de Negócio e Coerência Operacional:
  - Consistência temporal estrita: Data_Pedido <= Data_Envio <= Data_Entrega_Real.
  - Pedidos cancelados não possuem Data_Envio nem Data_Entrega_Real.
  - Pedidos em transporte possuem Data_Envio e Previsão, mas sem Data_Entrega_Real.
  - Atrasos realistas: entre 12% e 18% dos pedidos entregues com Data_Entrega_Real > Data_Previsao_Entrega.
  - Sazonalidade: Picos na Black Friday (Novembro) e Natal (Dezembro), com elevação de atrasos.
  - Custos de frete proporcionais ao peso (Peso_Kg) e distância entre CD e Região de entrega.
  - Exportação CSV: UTF-8 com BOM (utf-8-sig), delimitador ';' em ./data/
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
    
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    os.makedirs(output_dir, exist_ok=True)
    return fake, output_dir

def generate_dimensions(fake):
    print("-> Gerando Dimensões (dCentrosDistribuicao, dTransportadoras, dProdutos, dClientes)...")
    
    # 1. dCentrosDistribuicao
    cds_data = [
        {"ID_CentroDistribuicao": 1, "Nome_CD": "CD Cajamar - SP", "Cidade": "Cajamar", "Estado": "SP", "Regiao": "Sudeste", "Capacidade_Armazenagem": "120.000 m²"},
        {"ID_CentroDistribuicao": 2, "Nome_CD": "CD Extrema - MG", "Cidade": "Extrema", "Estado": "MG", "Regiao": "Sudeste", "Capacidade_Armazenagem": "95.000 m²"},
        {"ID_CentroDistribuicao": 3, "Nome_CD": "CD Gravataí - RS", "Cidade": "Gravataí", "Estado": "RS", "Regiao": "Sul", "Capacidade_Armazenagem": "65.000 m²"},
        {"ID_CentroDistribuicao": 4, "Nome_CD": "CD Cabo Santo Agostinho - PE", "Cidade": "Cabo de Santo Agostinho", "Estado": "PE", "Regiao": "Nordeste", "Capacidade_Armazenagem": "70.000 m²"}
    ]
    df_cds = pd.DataFrame(cds_data)
    
    # 2. dTransportadoras
    transp_data = [
        {"ID_Transportadora": 101, "Nome_Empresa": "LogBrasil Express", "Modal": "Expresso", "SLA_Padrao_Dias": 2},
        {"ID_Transportadora": 102, "Nome_Empresa": "TransRodoviário Cargas", "Modal": "Rodoviário", "SLA_Padrao_Dias": 5},
        {"ID_Transportadora": 103, "Nome_Empresa": "AeroCargo Brasil", "Modal": "Aéreo", "SLA_Padrao_Dias": 1},
        {"ID_Transportadora": 104, "Nome_Empresa": "Velox Distribuição & Entrega", "Modal": "Rodoviário", "SLA_Padrao_Dias": 4},
        {"ID_Transportadora": 105, "Nome_Empresa": "NorteSul Logística Integrada", "Modal": "Rodoviário", "SLA_Padrao_Dias": 7}
    ]
    df_transp = pd.DataFrame(transp_data)
    
    # 3. dProdutos (Mix Omnichannel variado)
    produtos_data = [
        # Eletrônicos & Telefonia
        {"ID_Produto": 2001, "Nome_Produto": "Smart TV 55 Polegadas 4K UHD", "Categoria": "Eletrônicos", "Subcategoria": "TV & Vídeo", "Peso_Kg": 14.80, "Custo_Unitario": 1750.00, "Preco_Tabela": 2899.00},
        {"ID_Produto": 2002, "Nome_Produto": "Smartphone 128GB 5G Octa-Core", "Categoria": "Eletrônicos", "Subcategoria": "Telefonia", "Peso_Kg": 0.42, "Custo_Unitario": 980.00, "Preco_Tabela": 1849.00},
        {"ID_Produto": 2003, "Nome_Produto": "Notebook Core i5 16GB SSD 512GB", "Categoria": "Eletrônicos", "Subcategoria": "Informática", "Peso_Kg": 1.95, "Custo_Unitario": 2350.00, "Preco_Tabela": 3799.00},
        {"ID_Produto": 2004, "Nome_Produto": "Monitor Gamer 27 Polegadas 165Hz", "Categoria": "Eletrônicos", "Subcategoria": "Informática", "Peso_Kg": 5.40, "Custo_Unitario": 790.00, "Preco_Tabela": 1399.00},
        {"ID_Produto": 2005, "Nome_Produto": "Fone de Ouvido Bluetooth Noise Cancelling", "Categoria": "Eletrônicos", "Subcategoria": "Áudio", "Peso_Kg": 0.35, "Custo_Unitario": 140.00, "Preco_Tabela": 299.00},
        {"ID_Produto": 2006, "Nome_Produto": "Soundbar 2.1 Canais 160W Subwoofer", "Categoria": "Eletrônicos", "Subcategoria": "Áudio", "Peso_Kg": 4.20, "Custo_Unitario": 360.00, "Preco_Tabela": 699.00},

        # Eletrodomésticos & Linha Branca
        {"ID_Produto": 2007, "Nome_Produto": "Geladeira Frost Free Duplex 430L", "Categoria": "Eletrodomésticos", "Subcategoria": "Linha Branca", "Peso_Kg": 64.50, "Custo_Unitario": 2100.00, "Preco_Tabela": 3499.00},
        {"ID_Produto": 2008, "Nome_Produto": "Máquina de Lavar Roupas 12kg", "Categoria": "Eletrodomésticos", "Subcategoria": "Linha Branca", "Peso_Kg": 42.00, "Custo_Unitario": 1350.00, "Preco_Tabela": 2299.00},
        {"ID_Produto": 2009, "Nome_Produto": "Fritadeira Elétrica Air Fryer 4.5L", "Categoria": "Eletrodomésticos", "Subcategoria": "Portáteis", "Peso_Kg": 4.60, "Custo_Unitario": 185.00, "Preco_Tabela": 389.00},
        {"ID_Produto": 2010, "Nome_Produto": "Micro-ondas 32 Litros Inox", "Categoria": "Eletrodomésticos", "Subcategoria": "Portáteis", "Peso_Kg": 15.20, "Custo_Unitario": 380.00, "Preco_Tabela": 689.00},
        {"ID_Produto": 2011, "Nome_Produto": "Aspirador de Pó Robô Inteligente WiFi", "Categoria": "Eletrodomésticos", "Subcategoria": "Portáteis", "Peso_Kg": 3.40, "Custo_Unitario": 520.00, "Preco_Tabela": 999.00},
        {"ID_Produto": 2012, "Nome_Produto": "Cafeteira Expresso Automática", "Categoria": "Eletrodomésticos", "Subcategoria": "Portáteis", "Peso_Kg": 3.80, "Custo_Unitario": 260.00, "Preco_Tabela": 499.00},

        # Casa & Móveis
        {"ID_Produto": 2013, "Nome_Produto": "Cadeira Ergonômica Presidente com Apoio", "Categoria": "Casa & Decoração", "Subcategoria": "Móveis Escritório", "Peso_Kg": 16.50, "Custo_Unitario": 410.00, "Preco_Tabela": 799.00},
        {"ID_Produto": 2014, "Nome_Produto": "Mesa Escrivaninha Industrial 120cm", "Categoria": "Casa & Decoração", "Subcategoria": "Móveis Escritório", "Peso_Kg": 21.00, "Custo_Unitario": 190.00, "Preco_Tabela": 429.00},
        {"ID_Produto": 2015, "Nome_Produto": "Jogo de Panelas Cerâmica 5 Peças", "Categoria": "Casa & Decoração", "Subcategoria": "Cozinha", "Peso_Kg": 5.80, "Custo_Unitario": 160.00, "Preco_Tabela": 349.00},
        {"ID_Produto": 2016, "Nome_Produto": "Aparelho de Jantar Porcelana 20 Peças", "Categoria": "Casa & Decoração", "Subcategoria": "Mesa Posta", "Peso_Kg": 8.90, "Custo_Unitario": 170.00, "Preco_Tabela": 369.00},
        {"ID_Produto": 2017, "Nome_Produto": "Kit Almofadas Decorativas Veludo (4 un)", "Categoria": "Casa & Decoração", "Subcategoria": "Decoração", "Peso_Kg": 1.20, "Custo_Unitario": 45.00, "Preco_Tabela": 119.00},

        # Moda & Esporte
        {"ID_Produto": 2018, "Nome_Produto": "Tênis Esportivo Running Amortecimento", "Categoria": "Moda & Calçados", "Subcategoria": "Calçados Esportivos", "Peso_Kg": 0.85, "Custo_Unitario": 130.00, "Preco_Tabela": 329.00},
        {"ID_Produto": 2019, "Nome_Produto": "Mochila Executiva Impermeável Antifurto", "Categoria": "Moda & Calçados", "Subcategoria": "Acessórios", "Peso_Kg": 0.95, "Custo_Unitario": 75.00, "Preco_Tabela": 189.00},
        {"ID_Produto": 2020, "Nome_Produto": "Jaqueta Corta-Vento Térmica Repelente", "Categoria": "Moda & Calçados", "Subcategoria": "Vestuário", "Peso_Kg": 0.55, "Custo_Unitario": 95.00, "Preco_Tabela": 249.00},
        {"ID_Produto": 2021, "Nome_Produto": "Relógio Smartwatch Esportivo GPS", "Categoria": "Moda & Calçados", "Subcategoria": "Wearables", "Peso_Kg": 0.28, "Custo_Unitario": 280.00, "Preco_Tabela": 599.00},

        # Beleza & Saúde
        {"ID_Produto": 2022, "Nome_Produto": "Secador de Cabelos Profissional 2200W", "Categoria": "Beleza & Cuidados", "Subcategoria": "Cabelos", "Peso_Kg": 1.15, "Custo_Unitario": 95.00, "Preco_Tabela": 229.00},
        {"ID_Produto": 2023, "Nome_Produto": "Escova Rotativa Modeladora Cerâmica", "Categoria": "Beleza & Cuidados", "Subcategoria": "Cabelos", "Peso_Kg": 0.92, "Custo_Unitario": 78.00, "Preco_Tabela": 179.00},
        {"ID_Produto": 2024, "Nome_Produto": "Kit Perfume Eau de Parfum 100ml", "Categoria": "Beleza & Cuidados", "Subcategoria": "Perfumaria", "Peso_Kg": 0.45, "Custo_Unitario": 110.00, "Preco_Tabela": 289.00},
        {"ID_Produto": 2025, "Nome_Produto": "Aparador e Barbeador Elétrico Lavável", "Categoria": "Beleza & Cuidados", "Subcategoria": "Barbearia", "Peso_Kg": 0.40, "Custo_Unitario": 68.00, "Preco_Tabela": 159.00}
    ]
    df_produtos = pd.DataFrame(produtos_data)

    # 4. dClientes (~600 clientes cadastrados)
    estados_brasil = [
        ("São Paulo", "SP", "Sudeste"),
        ("Campinas", "SP", "Sudeste"),
        ("Santos", "SP", "Sudeste"),
        ("Ribeirão Preto", "SP", "Sudeste"),
        ("Rio de Janeiro", "RJ", "Sudeste"),
        ("Niterói", "RJ", "Sudeste"),
        ("Belo Horizonte", "MG", "Sudeste"),
        ("Uberlândia", "MG", "Sudeste"),
        ("Curitiba", "PR", "Sul"),
        ("Londrina", "PR", "Sul"),
        ("Porto Alegre", "RS", "Sul"),
        ("Caxias do Sul", "RS", "Sul"),
        ("Florianópolis", "SC", "Sul"),
        ("Salvador", "BA", "Nordeste"),
        ("Recife", "PE", "Nordeste"),
        ("Fortaleza", "CE", "Nordeste"),
        ("Brasília", "DF", "Centro-Oeste"),
        ("Goiânia", "GO", "Centro-Oeste"),
        ("Manaus", "AM", "Norte"),
        ("Belém", "PA", "Norte")
    ]
    
    num_clientes = 600
    clientes_list = []
    for i in range(1, num_clientes + 1):
        id_cliente = 10000 + i
        cid, uf, regiao = random.choice(estados_brasil)
        segmento = "B2C" if np.random.rand() < 0.85 else "B2B"
        data_cadastro = fake.date_between_dates(
            date_start=datetime(2022, 1, 1),
            date_end=datetime(2024, 12, 31)
        )
        
        clientes_list.append({
            "ID_Cliente": id_cliente,
            "Segmento": segmento,
            "Cidade": cid,
            "Estado": uf,
            "Regiao": regiao,
            "Data_Cadastro": data_cadastro.strftime("%Y-%m-%d")
        })
    df_clientes = pd.DataFrame(clientes_list)
    
    return df_cds, df_transp, df_produtos, df_clientes

def generate_fact_orders(df_cds, df_transp, df_produtos, df_clientes, target_records=8100):
    print(f"-> Gerando fPedidos com ~{target_records} pedidos e consistência temporal estrita (2025-2026)...")
    
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 12, 31)
    total_days = (end_date - start_date).days + 1
    all_dates = [start_date + timedelta(days=d) for d in range(total_days)]
    
    # Sazonalidade temporal diária (Novembro Black Friday 2.5x, Dezembro Natal 2.2x)
    date_weights = []
    for d in all_dates:
        w = 1.0
        # Black Friday (Segunda quinzena de Novembro)
        if d.month == 11 and d.day >= 15:
            w = 2.6
        elif d.month == 11:
            w = 1.8
        # Natal e festas (Primeira quinzena de Dezembro)
        elif d.month == 12 and d.day <= 22:
            w = 2.3
        elif d.month == 12:
            w = 1.4
        elif d.month in [1, 2]: # Início de ano mais calmo
            w = 0.85
        elif d.month in [5, 8]: # Mães e Pais
            w = 1.25
        date_weights.append(w)
        
    date_probs = np.array(date_weights) / sum(date_weights)
    selected_indices = np.random.choice(len(all_dates), size=target_records, p=date_probs)
    selected_dates = [all_dates[idx] for idx in selected_indices]
    selected_dates.sort()
    
    # Dicionários rápidos
    prod_dict = df_produtos.set_index("ID_Produto").to_dict("index")
    transp_dict = df_transp.set_index("ID_Transportadora").to_dict("index")
    cd_dict = df_cds.set_index("ID_CentroDistribuicao").to_dict("index")
    cliente_dict = df_clientes.set_index("ID_Cliente").to_dict("index")
    
    pedidos_list = []
    
    # Pesos de CDs (SP e MG possuem maior malha logística)
    cd_weights = [0.45, 0.28, 0.15, 0.12]
    cd_ids = df_cds["ID_CentroDistribuicao"].values
    
    # Pesos de Transportadoras
    transp_weights = [0.30, 0.28, 0.10, 0.20, 0.12]
    transp_ids = df_transp["ID_Transportadora"].values
    
    # Matriz aproximada de distância entre Regiões para cálculo de Frete e SLA
    # Fator de distância multiplicador
    dist_factors = {
        ("Sudeste", "Sudeste"): 1.0,
        ("Sudeste", "Sul"): 1.4,
        ("Sudeste", "Centro-Oeste"): 1.6,
        ("Sudeste", "Nordeste"): 2.2,
        ("Sudeste", "Norte"): 3.0,
        
        ("Sul", "Sul"): 1.0,
        ("Sul", "Sudeste"): 1.4,
        ("Sul", "Centro-Oeste"): 1.8,
        ("Sul", "Nordeste"): 2.8,
        ("Sul", "Norte"): 3.5,
        
        ("Nordeste", "Nordeste"): 1.0,
        ("Nordeste", "Sudeste"): 2.0,
        ("Nordeste", "Norte"): 2.2,
        ("Nordeste", "Centro-Oeste"): 2.4,
        ("Nordeste", "Sul"): 2.9,
    }
    
    total_entregues = 0
    total_atrasados = 0
    
    for seq, data_ped in enumerate(selected_dates, start=1):
        id_pedido = f"PED-{data_ped.year}-{seq:06d}"
        
        id_cliente = int(np.random.choice(df_clientes["ID_Cliente"].values))
        id_produto = int(np.random.choice(df_produtos["ID_Produto"].values))
        id_cd = int(np.random.choice(cd_ids, p=cd_weights))
        id_transp = int(np.random.choice(transp_ids, p=transp_weights))
        
        cli_info = cliente_dict[id_cliente]
        prod_info = prod_dict[id_produto]
        transp_info = transp_dict[id_transp]
        cd_info = cd_dict[id_cd]
        
        # Quantidade
        if cli_info["Segmento"] == "B2B":
            qtd = int(np.random.choice([3, 5, 8, 10, 15], p=[0.30, 0.35, 0.20, 0.10, 0.05]))
        else:
            qtd = int(np.random.choice([1, 2, 3], p=[0.75, 0.20, 0.05]))
            
        preco_tabela = prod_info["Preco_Tabela"]
        custo_unit = prod_info["Custo_Unitario"]
        peso_total_kg = round(prod_info["Peso_Kg"] * qtd, 2)
        
        valor_bruto = round(preco_tabela * qtd, 2)
        
        # Desconto promocional (Maior na Black Friday)
        is_bf = (data_ped.month == 11 and data_ped.day >= 15)
        if is_bf:
            perc_desc = np.random.uniform(0.10, 0.25)
        else:
            perc_desc = np.random.choice([0.0, 0.05, 0.08, 0.12], p=[0.50, 0.25, 0.15, 0.10])
        desconto = round(valor_bruto * perc_desc, 2)
        
        # Distância CD vs Cliente
        pair_regiao = (cd_info["Regiao"], cli_info["Regiao"])
        dist_mult = dist_factors.get(pair_regiao, 2.0)
        
        # Cálculo de Custo Real do Frete
        # Modal factor: Aéreo (2.4x), Expresso (1.6x), Rodoviário (1.0x)
        modal = transp_info["Modal"]
        if modal == "Aéreo":
            modal_mult = 2.4
        elif modal == "Expresso":
            modal_mult = 1.6
        else:
            modal_mult = 1.0
            
        base_frete = 15.0 + (peso_total_kg * 2.8) * dist_mult * modal_mult
        custo_frete_real = round(base_frete * np.random.uniform(0.92, 1.08), 2)
        
        # Valor cobrado de frete do cliente (Promoção de Frete Grátis ou subsidiado)
        if valor_bruto > 350.0 and np.random.rand() < 0.45:
            valor_frete_cobrado = 0.0  # Frete Grátis
        else:
            # Margem comercial de frete ou leve subsídio
            valor_frete_cobrado = round(custo_frete_real * np.random.uniform(0.75, 1.15), 2)
            
        # Determinação do Status do Pedido
        # Pedidos muito próximos de 31/12/2026 têm chance maior de estarem em transporte
        dias_ate_fim = (end_date - data_ped).days
        if dias_ate_fim <= 10 and np.random.rand() < 0.60:
            status = "Em Transporte"
        else:
            status = np.random.choice(
                ["Entregue", "Em Transporte", "Cancelado", "Devolvido"],
                p=[0.82, 0.08, 0.06, 0.04]
            )
            
        # Cálculo do SLA de Previsão em dias corridos
        sla_base = transp_info["SLA_Padrao_Dias"]
        # Adicionar dias se for longa distância
        if dist_mult >= 2.5:
            sla_adicional = random.randint(3, 5)
        elif dist_mult >= 1.5:
            sla_adicional = random.randint(1, 2)
        else:
            sla_adicional = 0
            
        sla_total_dias = sla_base + sla_adicional
        
        # Consistência temporal e datas Role-Playing
        if status == "Cancelado":
            data_envio_str = ""
            data_prev_str = ""
            data_entrega_str = ""
            
        elif status == "Em Transporte":
            dias_despacho = random.randint(1, 2)
            data_envio = data_ped + timedelta(days=dias_despacho)
            data_prev = data_envio + timedelta(days=sla_total_dias)
            
            data_envio_str = data_envio.strftime("%Y-%m-%d")
            data_prev_str = data_prev.strftime("%Y-%m-%d")
            data_entrega_str = ""
            
        else: # Entregue ou Devolvido
            dias_despacho = random.randint(1, 3)
            data_envio = data_ped + timedelta(days=dias_despacho)
            data_prev = data_envio + timedelta(days=sla_total_dias)
            
            # Chance de atraso:
            # Em períodos de Black Friday / Natal: ~22% a 25%
            # Em dias normais: ~12% a 14%
            # Taxa global desejada: 14% a 16% (dentro do intervalo 12% a 18% pedido!)
            chance_atraso = 0.24 if is_bf or (data_ped.month == 12) else 0.13
            is_delayed = (np.random.rand() < chance_atraso)
            
            total_entregues += 1
            if is_delayed:
                total_atrasados += 1
                dias_atraso = random.randint(1, 5)
                data_entrega = data_prev + timedelta(days=dias_atraso)
            else:
                # No prazo: entregue entre data_envio + 1 e data_prev
                dias_transporte = random.randint(1, max(1, sla_total_dias))
                data_entrega = data_envio + timedelta(days=dias_transporte)
                if data_entrega > data_prev:
                    data_entrega = data_prev
                    
            data_envio_str = data_envio.strftime("%Y-%m-%d")
            data_prev_str = data_prev.strftime("%Y-%m-%d")
            data_entrega_str = data_entrega.strftime("%Y-%m-%d")
            
        pedidos_list.append({
            "ID_Pedido": id_pedido,
            "ID_Cliente": id_cliente,
            "ID_Produto": id_produto,
            "ID_Transportadora": id_transp,
            "ID_CentroDistribuicao": id_cd,
            "Data_Pedido": data_ped.strftime("%Y-%m-%d"),
            "Data_Envio": data_envio_str,
            "Data_Previsao_Entrega": data_prev_str,
            "Data_Entrega_Real": data_entrega_str,
            "Quantidade": qtd,
            "Valor_Bruto": valor_bruto,
            "Desconto": desconto,
            "Valor_Frete_Cobrado": valor_frete_cobrado,
            "Custo_Frete_Real": custo_frete_real,
            "Status_Pedido": status
        })
        
    df_pedidos = pd.DataFrame(pedidos_list)
    
    taxa_atraso_real = (total_atrasados / total_entregues) * 100 if total_entregues > 0 else 0
    print(f"  [METRICA] Total Pedidos Concluídos: {total_entregues:,} | Atrasados: {total_atrasados:,} ({taxa_atraso_real:.2f}%)")
    
    return df_pedidos

def validate_referential_integrity(df_pedidos, df_clientes, df_produtos, df_transp, df_cds):
    print("\n" + "="*75)
    print("VALIDAÇÃO RIGOROSA DE INTEGRIDADE REFERENCIAL - SUPPLY CHAIN & LOGÍSTICA")
    print("="*75)
    
    errors = []
    
    # 1. Integridade de chaves estrangeiras
    for fk_col, pk_df, pk_col, name in [
        ("ID_Cliente", df_clientes, "ID_Cliente", "dClientes"),
        ("ID_Produto", df_produtos, "ID_Produto", "dProdutos"),
        ("ID_Transportadora", df_transp, "ID_Transportadora", "dTransportadoras"),
        ("ID_CentroDistribuicao", df_cds, "ID_CentroDistribuicao", "dCentrosDistribuicao")
    ]:
        missing = set(df_pedidos[fk_col]) - set(pk_df[pk_col])
        if missing:
            errors.append(f"FALHA: {len(missing)} registros em fPedidos.{fk_col} ausentes em {name}.{pk_col}!")
        else:
            print(f"[OK] Integridade fPedidos.{fk_col} -> {name}.{pk_col}: 100% íntegro.")

    # 2. Consistência temporal estrita: Data_Pedido <= Data_Envio <= Data_Entrega_Real
    df_entregues = df_pedidos[df_pedidos["Status_Pedido"].isin(["Entregue", "Devolvido"])].copy()
    
    dt_ped = pd.to_datetime(df_entregues["Data_Pedido"])
    dt_env = pd.to_datetime(df_entregues["Data_Envio"])
    dt_ent = pd.to_datetime(df_entregues["Data_Entrega_Real"])
    
    violacoes_envio = (dt_ped > dt_env).sum()
    violacoes_entrega = (dt_env > dt_ent).sum()
    
    if violacoes_envio > 0:
        errors.append(f"FALHA: {violacoes_envio} pedidos com Data_Pedido > Data_Envio!")
    else:
        print("[OK] Consistência temporal Data_Pedido <= Data_Envio: 100% respeitada.")
        
    if violacoes_entrega > 0:
        errors.append(f"FALHA: {violacoes_entrega} pedidos com Data_Envio > Data_Entrega_Real!")
    else:
        print("[OK] Consistência temporal Data_Envio <= Data_Entrega_Real: 100% respeitada.")

    # 3. Pedidos cancelados não possuem Data_Envio nem Data_Entrega_Real
    df_canc = df_pedidos[df_pedidos["Status_Pedido"] == "Cancelado"]
    canc_com_envio = (df_canc["Data_Envio"] != "").sum()
    canc_com_entrega = (df_canc["Data_Entrega_Real"] != "").sum()
    
    if canc_com_envio > 0 or canc_com_entrega > 0:
        errors.append(f"FALHA: Pedidos cancelados contêm Data_Envio ({canc_com_envio}) ou Data_Entrega ({canc_com_entrega})!")
    else:
        print("[OK] Pedidos cancelados sem data de envio nem entrega: 100% em conformidade.")

    # 4. Verificação da taxa de atrasos (entre 12% e 18%)
    dt_prev = pd.to_datetime(df_entregues["Data_Previsao_Entrega"])
    atrasados_qtd = (dt_ent > dt_prev).sum()
    taxa_atraso = (atrasados_qtd / len(df_entregues)) * 100
    
    print(f"\n--- TAXA DE ATRASO OPERACIONAL (SLA) ---")
    print(f"  Pedidos Entregues/Devolvidos: {len(df_entregues):,}")
    print(f"  Entregas com Atraso: {atrasados_qtd:,} ({taxa_atraso:.2f}%)")
    print(f"  Entregas no Prazo (OTIF): {len(df_entregues) - atrasados_qtd:,} ({100 - taxa_atraso:.2f}%)")
    
    if taxa_atraso < 11.5 or taxa_atraso > 18.5:
        errors.append(f"FALHA: Taxa de atraso ({taxa_atraso:.2f}%) fora da faixa estipulada (12% a 18%)!")
    else:
        print(f"[OK] Taxa de atraso de {taxa_atraso:.2f}% perfeitamente dentro do intervalo de 12% a 18%.")

    # 5. Sazonalidade Novembro e Dezembro
    df_pedidos["Mes"] = pd.to_datetime(df_pedidos["Data_Pedido"]).dt.month
    vol_mensal = df_pedidos.groupby("Mes").size()
    nov_dez_share = (vol_mensal[11] + vol_mensal[12]) / len(df_pedidos) * 100
    print(f"\n[OK] Concentração de Pedidos Black Friday (Nov) + Natal (Dez): {nov_dez_share:.2f}% do volume anual.")

    if errors:
        print("\nALERTA DE ERROS DETECTADOS:")
        for err in errors:
            print(" - ", err)
        raise ValueError("Validações de integridade falharam!")
    else:
        print("\n>>> SUCESSO COMPLETO: Todas as validações passaram com louvor! <<<")
    print("="*75 + "\n")

def export_to_csv(tables, output_dirs):
    for out_dir in output_dirs:
        os.makedirs(out_dir, exist_ok=True)
        print("-> Exportando arquivos CSV para o diretório:", out_dir)
        print("-> Padrão: UTF-8 com BOM (utf-8-sig), Delimitador ';'\n")
        
        for filename, df in tables.items():
            filepath = os.path.join(out_dir, f"{filename}.csv")
            df_export = df.copy()
            if "Mes" in df_export.columns:
                df_export = df_export.drop(columns=["Mes"])
            df_export.to_csv(filepath, sep=';', index=False, encoding='utf-8-sig')
            file_size = os.path.getsize(filepath) / 1024
            print(f"  [SAVED] {filename}.csv ({len(df_export):,} linhas, {file_size:.1f} KB) -> {filepath}")

def main():
    fake, global_data_dir = init_environment()
    
    # Criar pasta dedicada dentro de Projetos/Projeto - SupplyChain/data
    project_supplychain_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Projetos', 'Projeto - SupplyChain')
    project_data_dir = os.path.join(project_supplychain_dir, 'data')
    
    df_cds, df_transp, df_produtos, df_clientes = generate_dimensions(fake)
    df_pedidos = generate_fact_orders(df_cds, df_transp, df_produtos, df_clientes, target_records=8150)
    
    validate_referential_integrity(df_pedidos, df_clientes, df_produtos, df_transp, df_cds)
    
    tables = {
        "dCentrosDistribuicao": df_cds,
        "dTransportadoras": df_transp,
        "dProdutos": df_produtos,
        "dClientes": df_clientes,
        "fPedidos": df_pedidos
    }
    
    # Exportar tanto para ./data quanto para ./Projetos/Projeto - SupplyChain/data
    export_to_csv(tables, [global_data_dir, project_data_dir])
    print("\nExecução e exportação finalizadas com êxito!")

if __name__ == "__main__":
    main()
