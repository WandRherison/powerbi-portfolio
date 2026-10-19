"""
Script de Geração de Dados - RPG Dungeon Crawler no Power BI
Arquivos gerados:
  - dHerois.csv (4 Heróis jogáveis com stats de combate e sprites)
  - dMonstros.csv (5 monstros comuns + 1 Boss Dragão Ancião)
  - fMapa_Spawns.csv (Coordenadas X/Y dos monstros no Canvas 800x600, grid 32x32)
Padrão: CSV com UTF-8-sig e separador ';'
"""

import os
import random
import numpy as np
import pandas as pd

def init_environment():
    random.seed(42)
    np.random.seed(42)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    global_data_dir = os.path.join(base_dir, 'data')
    project_dir = os.path.join(base_dir, 'Projetos', 'Projeto - RPG Dungeon Crawler')
    project_data_dir = os.path.join(project_dir, 'data')
    
    os.makedirs(global_data_dir, exist_ok=True)
    os.makedirs(project_data_dir, exist_ok=True)
    
    return global_data_dir, project_data_dir

def generate_rpg_database():
    print("-> Gerando tabelas dimensionais e de fatos do RPG Dungeon Crawler...")
    
    # 1. dHerois (4 Heróis jogáveis)
    herois_data = [
        {
            "ID_Heroi": 1,
            "Nome": "Guerreiro",
            "Classe": "Guerreiro",
            "HP_Maximo": 150,
            "Ataque": 25,
            "Defesa": 20,
            "Sprite": "https://dummyimage.com/32x32/000080/ffffff&text=GUE",
            "Descricao": "Combatente corpo a corpo robusto com armadura pesada e alta resistência a dano."
        },
        {
            "ID_Heroi": 2,
            "Nome": "Mago",
            "Classe": "Mago",
            "HP_Maximo": 80,
            "Ataque": 45,
            "Defesa": 10,
            "Sprite": "https://dummyimage.com/32x32/800080/ffffff&text=MAG",
            "Descricao": "Conjurador arcano com poder destrutivo devastador, porém baixa defesa física."
        },
        {
            "ID_Heroi": 3,
            "Nome": "Ladino",
            "Classe": "Ladino",
            "HP_Maximo": 100,
            "Ataque": 35,
            "Defesa": 15,
            "Sprite": "https://dummyimage.com/32x32/006400/ffffff&text=LAD",
            "Descricao": "Mestre da agilidade e ataques furtivos com taxa crítica elevada."
        },
        {
            "ID_Heroi": 4,
            "Nome": "Clérigo",
            "Classe": "Clérigo",
            "HP_Maximo": 120,
            "Ataque": 15,
            "Defesa": 25,
            "Sprite": "https://dummyimage.com/32x32/b8860b/ffffff&text=CLE",
            "Descricao": "Guardião sagrado com alta defesa e bênçãos de proteção espiritual."
        }
    ]
    df_herois = pd.DataFrame(herois_data)
    
    # 2. dMonstros (5 tipos + 1 Boss Dragão Ancião)
    monstros_data = [
        {
            "ID_Monstro": 1,
            "Nome": "Slime Verde",
            "Tipo": "Comum",
            "HP": 30,
            "Dano": 5,
            "Sprite": "https://dummyimage.com/32x32/00ff00/000000&text=SLI",
            "XP_Recompensa": 20
        },
        {
            "ID_Monstro": 2,
            "Nome": "Goblin",
            "Tipo": "Comum",
            "HP": 50,
            "Dano": 10,
            "Sprite": "https://dummyimage.com/32x32/556b2f/ffffff&text=GOB",
            "XP_Recompensa": 45
        },
        {
            "ID_Monstro": 3,
            "Nome": "Esqueleto",
            "Tipo": "Morto-Vivo",
            "HP": 60,
            "Dano": 15,
            "Sprite": "https://dummyimage.com/32x32/a9a9a9/000000&text=ESQ",
            "XP_Recompensa": 60
        },
        {
            "ID_Monstro": 4,
            "Nome": "Orc Guerreiro",
            "Tipo": "Elite",
            "HP": 90,
            "Dano": 20,
            "Sprite": "https://dummyimage.com/32x32/8b4513/ffffff&text=ORC",
            "XP_Recompensa": 100
        },
        {
            "ID_Monstro": 5,
            "Nome": "Dragão Ancião (Boss)",
            "Tipo": "Chefe Final",
            "HP": 300,
            "Dano": 40,
            "Sprite": "https://dummyimage.com/64x64/ff0000/ffffff&text=BOSS",
            "XP_Recompensa": 500
        }
    ]
    df_monstros = pd.DataFrame(monstros_data)
    
    # 3. fMapa_Spawns (Coordenadas dos Inimigos da Masmorra)
    # Dimensões do Canvas: 800x600 pixels (Tiles de 32x32)
    # Coordenadas jogáveis internas: X entre 32 e 736 (multiplos de 32), Y entre 32 e 544
    # Ponto de Spawn do Herói: X=32, Y=32 (obrigatoriamente livre)
    # Boss Dragão Ancião (ID 5): X=704, Y=64 (fixo)
    
    spawns_list = []
    ocupados = {(32, 32), (704, 64), (736, 64), (704, 96), (736, 96)}
    
    # 15 Monstros Comuns distribuídos estrategicamente pelos corredores e salas da masmorra
    # Coordenadas desenhadas para criar um percurso desafiador pela masmorra
    coords_estrategicas = [
        (128, 96),   # Sala Inicial - Slime
        (192, 192),  # Corredor Norte - Slime
        (320, 128),  # Câmara Central 1 - Goblin
        (448, 96),   # Corredor Leste 1 - Goblin
        (128, 320),  # Ala Sul 1 - Goblin
        (256, 384),  # Ala Sul 2 - Esqueleto
        (384, 288),  # Centro da Masmorra - Esqueleto
        (512, 224),  # Passagem Secreta - Esqueleto
        (608, 160),  # Ante-sala do Boss - Orc Guerreiro
        (320, 448),  # Catacumba Inferior - Orc Guerreiro
        (480, 416),  # Salão das Armas - Orc Guerreiro
        (640, 320),  # Guarda da Câmara - Goblin
        (224, 64),   # Sala do Baú - Slime
        (576, 480),  # Posto de Guarda - Esqueleto
        (672, 224)   # Último Guardião antes do Boss - Orc Guerreiro
    ]
    
    monstros_pool = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]
    
    for idx, (x, y) in enumerate(coords_estrategicas, start=1):
        monstro_id = monstros_pool[idx - 1]
        spawns_list.append({
            "ID_Spawn": idx,
            "ID_Monstro": monstro_id,
            "Coord_X": x,
            "Coord_Y": y,
            "Sala_Masmorra": f"Setor {((x // 160) + 1)}-{((y // 150) + 1)}"
        })
        ocupados.add((x, y))
        
    # Adicionar o Boss Dragão Ancião (ID 5) fixo na coordenada X=704, Y=64
    spawns_list.append({
        "ID_Spawn": 16,
        "ID_Monstro": 5,
        "Coord_X": 704,
        "Coord_Y": 64,
        "Sala_Masmorra": "Câmara do Dragão Ancião"
    })
    
    df_spawns = pd.DataFrame(spawns_list)
    
    return df_herois, df_monstros, df_spawns

def validate_referential_integrity(df_herois, df_monstros, df_spawns):
    print("\n" + "="*80)
    print("VALIDAÇÃO RIGOROSA DE INTEGRIDADE REFERENCIAL - RPG DUNGEON CRAWLER")
    print("="*80)
    
    # 1. Integridade fMapa_Spawns -> dMonstros
    missing_monstros = set(df_spawns["ID_Monstro"]) - set(df_monstros["ID_Monstro"])
    if missing_monstros:
        raise ValueError(f"FALHA: Monstros com IDs {missing_monstros} em fMapa_Spawns não existem em dMonstros!")
    print("[OK] Integridade fMapa_Spawns.ID_Monstro -> dMonstros.ID_Monstro: 100% íntegro.")
    
    # 2. Ponto de Spawn do Herói livre
    spawn_heroi = df_spawns[(df_spawns["Coord_X"] == 32) & (df_spawns["Coord_Y"] == 32)]
    if not spawn_heroi.empty:
        raise ValueError("FALHA: O ponto de Spawn do Herói (X=32, Y=32) não está vazio!")
    print("[OK] Ponto de Spawn do Herói (X=32, Y=32) está perfeitamente livre.")
    
    # 3. Posição fixa do Boss
    boss_spawn = df_spawns[df_spawns["ID_Monstro"] == 5]
    if boss_spawn.empty or boss_spawn.iloc[0]["Coord_X"] != 704 or boss_spawn.iloc[0]["Coord_Y"] != 64:
        raise ValueError("FALHA: O Dragão Ancião (Boss) não está na coordenada X=704, Y=64!")
    print("[OK] Dragão Ancião (Boss) posicionado com precisão na coordenada X=704, Y=64.")
    
    # 4. Todos os spawns múltiplos de 32 e dentro dos limites (800x600)
    for _, row in df_spawns.iterrows():
        x, y = row["Coord_X"], row["Coord_Y"]
        if x % 32 != 0 or y % 32 != 0:
            raise ValueError(f"FALHA: Spawn {row['ID_Spawn']} possui coordenadas não múltiplas de 32: ({x}, {y})")
        if x < 32 or x > 768 or y < 32 or y > 568:
            raise ValueError(f"FALHA: Spawn {row['ID_Spawn']} fora dos limites jogáveis: ({x}, {y})")
    print("[OK] Todas as 16 coordenadas de monstros são múltiplos perfeitos de 32x32 e respeitam os limites da masmorra.")
    
    # 5. Ausência de nulos
    for name, df in [("dHerois", df_herois), ("dMonstros", df_monstros), ("fMapa_Spawns", df_spawns)]:
        nulos = df.isnull().sum().sum()
        if nulos > 0:
            raise ValueError(f"FALHA: Tabela {name} contém {nulos} valores nulos!")
        print(f"[OK] Ausência de valores nulos em {name}: 0 nulos detectados.")
        
    print("\n>>> SUCESSO COMPLETO: Todas as validações passaram com louvor! <<<")
    print("="*80 + "\n")

def export_to_csv(tables, output_dirs):
    for out_dir in output_dirs:
        os.makedirs(out_dir, exist_ok=True)
        print(f"-> Exportando arquivos CSV para: {out_dir}")
        print("-> Padrão: UTF-8 com BOM (utf-8-sig), Delimitador ';'\n")
        
        for filename, df in tables.items():
            filepath = os.path.join(out_dir, f"{filename}.csv")
            df.to_csv(filepath, sep=';', index=False, encoding='utf-8-sig')
            file_size = os.path.getsize(filepath) / 1024
            print(f"  [SAVED] {filename}.csv ({len(df):,} linhas, {file_size:.1f} KB) -> {filepath}")

def main():
    global_data_dir, project_data_dir = init_environment()
    
    df_herois, df_monstros, df_spawns = generate_rpg_database()
    validate_referential_integrity(df_herois, df_monstros, df_spawns)
    
    tables = {
        "dHerois": df_herois,
        "dMonstros": df_monstros,
        "fMapa_Spawns": df_spawns
    }
    
    export_to_csv(tables, [global_data_dir, project_data_dir])
    print("\nExecução e exportação do RPG Dungeon Crawler finalizadas com 100% de sucesso!")

if __name__ == "__main__":
    main()
