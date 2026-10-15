# 📊 Portfólio de Business Intelligence & Data Analytics

Bem-vindo ao meu portfólio profissional de **Business Intelligence e Engenharia Analítica**. 

Este repositório reúne projetos completos de ponta a ponta (*End-to-End*), cobrindo desde a **geração e ingestão de dados com Python**, passando pela **modelagem dimensional rigorosa (Star Schema e Galaxy Schema)**, até a construção de **métricas avançadas em DAX** e **dashboards executivos interativos no Power BI**.

---

### 🛠️ Tecnologias & Competências Demonstradas

![Power BI](https://img.shields.io/badge/Power_BI-Desktop_%26_Service-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)
![DAX](https://img.shields.io/badge/DAX-Time_Intelligence_%26_Modeling-00599C?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-Data_Pipelines_%26_Faker-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-ETL_%26_Data_Quality-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Modelagem](https://img.shields.io/badge/Modelagem-Star_Schema_%26_Galaxy-4E79A7?style=for-the-badge)
![Git](https://img.shields.io/badge/Git-Versionamento-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## 🌟 Vitrine de Dashboards Interativos (Live Demos)

Você pode explorar e interagir diretamente com os relatórios publicados no Power BI Service através dos links abaixo:

| Projeto | Segmento / Área | Arquitetura | Demonstração Interativa | Case de Estudo |
| :--- | :--- | :---: | :---: | :---: |
| **1. Adega & Distribuidora** | Comercial B2B, Vendas & Logística | **Star Schema** | 🔗 [**Abrir Dashboard**](https://app.powerbi.com/view?r=eyJrIjoiNmVhZmZhMDYtOGExZi00MDIyLTg2MmQtMzM3NWFlZmExZjZjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9) | [Ver Case](Projetos/Projeto%20-%20Adega/README.md) |
| **2. ONG Viva Comunidade** | Terceiro Setor, Captação & Impacto Social | **Galaxy Schema** (Multi-Fato) | 🔗 [**Abrir Dashboard**](https://app.powerbi.com/view?r=eyJrIjoiNTYzNjE5YmYtYWRmMy00YzFhLTg1NWMtOTE5OTAyYmRjOWJlIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9) | [Ver Case](Projetos/Projeto%20-%20ONG/README.md) |
| **3. PetShop Gatitos** | Varejo B2C, Customer Analytics | **Star Schema** | 🔗 [**Abrir Dashboard**](https://app.powerbi.com/view?r=eyJrIjoiZjhhODBjZTctYTI0My00ZDE4LTgwNzctMGZjZWM1OTU0MDRjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9) | [Ver Case](Projetos/Projeto%20-%20PetShop/README.md) |

---

## 🔍 Resumo dos Projetos

### 🍷 Projeto 1: Adega & Distribuidora de Bebidas (Comercial B2B)
- **Problema de Negócio:** Distribuidora enfrentava quebra de estoque e custos emergenciais de frete aos fins de semana (*Weekend Rush*), além de necessidade de calibrar o mix entre produtos de alto giro (cervejas) e alta rentabilidade (destilados/vinhos).
- **Solução Técnica:**
  - Script Python (`generate_data.py`) simulando 5.250 pedidos com sazonalidade estrita concentrada em quintas, sextas e sábados (68,6% do volume).
  - Modelagem dimensional Star Schema clássica relacionando `fVendas`, `dClientes`, `dProdutos`, `dCanais` e `dCalendario`.
  - Medidas DAX com variáveis `VAR`/`RETURN`: Faturamento Líquido, Margem Bruta %, Ticket Médio B2B, Vendas YTD e MoM % com cor dinâmica condicional.
- **Arquivo PBIX:** [`Projetos/Projeto - Adega/PowerBI - Adega.pbix`](Projetos/Projeto%20-%20Adega/PowerBI%20-%20Adega.pbix)

---

### 🤝 Projeto 2: ONG Viva Comunidade (Multi-Fato & Governança)
- **Problema de Negócio:** Prestação de contas transparente para doadores e conselhos fiscais, conectando a captação de recursos (*Fundraising*) diretamente à execução social nos bairros assistidos.
- **Solução Técnica:**
  - Arquitetura **Galaxy Schema** com duas tabelas fato: `fDoacoes` (receita financeira) e `fAtendimentos` (desembolso comunitário), compartilhando `dProjetos` e `dCalendario`.
  - Tratamento de coerência: Doações de empresas (PJ) com tíquetes de R$ 1.000 a R$ 15.000 e doações comunitárias (PF) com recorrência mensal de R$ 20 a R$ 250.
  - Indicadores DAX de Atingimento de Metas por Projeto, Custo Médio por Atendimento Social e Superávit Operacional de Caixa.
- **Arquivo PBIX:** [`Projetos/Projeto - ONG/PowerBI - ONG.pbix`](Projetos/Projeto%20-%20ONG/PowerBI%20-%20ONG.pbix)

---

### 🐾 Projeto 3: PetShop Gatitos & Cia (Varejo B2C & Customer Analytics)
- **Problema de Negócio:** Compreensão profunda do perfil demográfico de tutores de animais de estimação, analisando hábitos de recompra, impacto da quantidade de pets na cesta de compras e eficiência por categoria.
- **Solução Técnica:**
  - Tratamento e enriquecimento de dados via **Power Query (Linguagem M)** com cruzamento de transações de vendas com atributos de clientes (Gênero, Estado Civil, Bairro, Quantidade de Pets).
  - Cálculo de Faturamento Ponderado (`SUMX`), Ticket Médio por Consumidor Único e Análise de Penetração de Marcas.
  - Catálogo dinâmico de produtos com suporte a imagens integradas aos visuais do relatório.
- **Arquivo PBIX:** [`Projetos/Projeto - PetShop/PowerBI - PetShop.pbix`](Projetos/Projeto%20-%20PetShop/PowerBI%20-%20PetShop.pbix)

---

## 🏛️ Estrutura do Repositório

```text
PowerBI-Portfolio/
│
├── README.md                              <-- Vitrine principal do portfólio
├── DAX_MEASURES.md                        <-- Catálogo unificado de fórmulas DAX
├── .gitignore                             <-- Filtro de arquivos de sistema e temporários
│
├── data/                                  <-- Datasets CSV com codificação UTF-8-sig
│   ├── fVendas.csv                        <-- Fato de vendas da distribuidora
│   ├── fDoacoes.csv                       <-- Fato de captação de recursos da ONG
│   ├── fAtendimentos.csv                  <-- Fato de execução social da ONG
│   ├── dClientes.csv                      <-- Dimensão de clientes B2B
│   ├── dProdutos.csv                      <-- Dimensão de produtos de bebidas
│   ├── dCanais.csv                        <-- Dimensão de canais de venda / doação
│   ├── dDoadores.csv                      <-- Dimensão de doadores da ONG
│   └── dProjetos.csv                      <-- Dimensão de projetos sociais
│
├── generate_data.py                       <-- Pipeline Python autônomo (Adega)
├── generate_ong_data.py                   <-- Pipeline Python autônomo (ONG)
│
└── Projetos/                              <-- Diretório com os relatórios publicados
    ├── Projeto - Adega/
    │   ├── PowerBI - Adega.pbix           <-- Arquivo fonte Power BI
    │   ├── PowerBI - Adega.htm            <-- Documentação do modelo (Power BI Helper)
    │   └── README.md                      <-- Case de estudo detalhado
    │
    ├── Projeto - ONG/
    │   ├── PowerBI - ONG.pbix             <-- Arquivo fonte Power BI
    │   ├── PowerBI - ONG.htm              <-- Documentação do modelo (Power BI Helper)
    │   └── README.md                      <-- Case de estudo detalhado
    │
    └── Projeto - PetShop/
        ├── PowerBI - PetShop.pbix         <-- Arquivo fonte Power BI
        ├── PowerBI - PetShop.htm          <-- Documentação do modelo (Power BI Helper)
        └── README.md                      <-- Case de estudo detalhado
```

---

## 💻 Como Reproduzir ou Executar Localmente

### 1. Clonar o Repositório:
```bash
git clone https://github.com/WandWebDesign/powerbi-portfolio.git
cd powerbi-portfolio
```

### 2. Gerar ou Atualizar os Dados Sintéticos (Python):
```bash
# Executar pipelines de geração com Faker e Pandas
python generate_data.py
python generate_ong_data.py
```

### 3. Abrir os Arquivos no Power BI:
- Navegue até a pasta `Projetos/` e abra qualquer arquivo `.pbix` no **Power BI Desktop**.
- Os dados já estão carregados e prontos para inspeção de modelagem, DAX e visuais.

---

## 📬 Contato & Redes

- **GitHub:** [github.com/WandWebDesign](https://github.com/WandWebDesign)
- **LinkedIn:** [linkedin.com/in/wanderson-alves](https://linkedin.com)
- **E-mail:** wandrherison@gmail.com
