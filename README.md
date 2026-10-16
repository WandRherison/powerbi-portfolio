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
| **4. Supply Chain & Logística**| E-commerce, Torre de Controle & SLAs | **Star Schema** (Role-Playing) | 🔗 [**Abrir Dashboard**](https://app.powerbi.com/view?r=eyJrIjoiNTg3Y2Y5ZGItNmI5OS00Mzk4LWI0NTMtZjVhOGMzYmRkMGU3IiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9) | [Ver Case](Projetos/Projeto%20-%20SupplyChain/README.md) |
| **5. ONG Multi-Programas** | Terceiro Setor, Metas & Impacto Social | **Multi-Fato Star Schema** | 📦 *Em Desenvolvimento* | [Ver Case](Projetos/Projeto%20-%20ONG%20Multi-Programas/README.md) |

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

### 🚚 Projeto 4: Supply Chain & Omnichannel Logistics (Torre de Controle & SLAs)
- **Problema de Negócio:** Visibilidade de nível de serviço (SLA), controle de atrasos em períodos críticos (Black Friday e Natal) e equilíbrio financeiro entre políticas de frete grátis e margem de contribuição real.
- **Solução Técnica:**
  - Modelagem avançada Star Schema com **Role-Playing Dimensions** (`dCalendario` conectada a `Data_Pedido`, `Data_Envio`, `Data_Previsao_Entrega` e `Data_Entrega_Real`).
  - Geração de 8.150 pedidos com validação temporal estrita e taxa de atraso calibrada em 15,37%.
  - Fórmulas DAX especializadas: **OTIF % (On-Time Delivery)**, **Lead Time Médio**, **Margem de Contribuição Líquida** e uso de relacionamentos inativos com `USERELATIONSHIP`.
- **Arquivo PBIX:** [`Projetos/Projeto - SupplyChain/PowerBI - SupplyChain.pbix`](Projetos/Projeto%20-%20SupplyChain/PowerBI%20-%20SupplyChain.pbix)
- **Case Detalhado & DAX:** [`Projetos/Projeto - SupplyChain/README.md`](Projetos/Projeto%20-%20SupplyChain/README.md) e [`Projetos/Projeto - SupplyChain/DAX_MEASURES.md`](Projetos/Projeto%20-%20SupplyChain/DAX_MEASURES.md)

---

### 🏛️ Projeto 5: ONG Multi-Programas (Gestão Estratégica, Metas & Multi-Fato)
- **Problema de Negócio:** Gestão orçamentária integrada de múltiplos programas sociais com acompanhamento mensal de metas de captação, execução de atendimentos nas comunidades e índice de sustentabilidade.
- **Solução Técnica:**
  - Arquitetura **Multi-Fato Star Schema (Constellation)** com 3 fatos (`fDoacoes`, `fAtendimentos`, `fOrcamentoMetas`) e 4 dimensões compartilhadas (`dProjetos`, `dDoadores`, `dCanais`, `dRegioes`).
  - Geração de 6.150 doações e 3.550 atendimentos distribuídos em 22 meses com picos sazonais em Nov/Dez e simulação de churn de doadores recorrentes (3% a 5%).
  - Medidas DAX com variáveis `VAR`/`RETURN`: % Atingimento da Meta de Captação vs Meta de Atendimentos, Custo Médio por Beneficiário, Horas de Voluntariado e Índice de Eficiência Operacional.
- **Case Detalhado & DAX:** [`Projetos/Projeto - ONG Multi-Programas/README.md`](Projetos/Projeto%20-%20ONG%20Multi-Programas/README.md) e [`Projetos/Projeto - ONG Multi-Programas/DAX_MEASURES.md`](Projetos/Projeto%20-%20ONG%20Multi-Programas/DAX_MEASURES.md)

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
git clone https://github.com/WandRherison/powerbi-portfolio.git
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

- **GitHub:** [github.com/WandRherison](https://github.com/WandRherison)
- **LinkedIn:** [Wand Rherison](https://www.linkedin.com/in/wand-rherison-derley-pereira-alves-silva-b55293225/)
- **E-mail:** wandrherison@gmail.com
