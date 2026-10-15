# 🚚 Projeto 4: Supply Chain & Omnichannel Logistics Analytics

[![Power BI](https://img.shields.io/badge/Power_BI-Supply_Chain_Control_Tower-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)](https://github.com)
[![Modelagem](https://img.shields.io/badge/Modelagem-Star_Schema_(Role--Playing)-darkblue?style=for-the-badge)](https://github.com)
[![Logística](https://img.shields.io/badge/KPIs-OTIF_%26_Lead_Time-green?style=for-the-badge)](https://github.com)

Ambiente analítico completo projetado para uma operação de **Varejo Omnichannel e Logística de E-commerce**, integrando múltiplos Centros de Distribuição (CDs), transportadoras parceiras e vendas B2C e B2B em todo o território nacional.

---

## 🏛️ 1. Modelagem Dimensional Avançada (Star Schema com Múltiplas Datas)

O modelo implementa o conceito de **Role-Playing Dimensions**, onde uma única dimensão de calendário (`dCalendario`) estabelece quatro conexões com a tabela fato `fPedidos` (um relacionamento ativo padrão e três relacionamentos inativos ativados via DAX `USERELATIONSHIP`).

```mermaid
erDiagram
    dClientes           ||--o{ fPedidos : "1:N (ID_Cliente)"
    dProdutos           ||--o{ fPedidos : "1:N (ID_Produto)"
    dTransportadoras    ||--o{ fPedidos : "1:N (ID_Transportadora)"
    dCentrosDistribuicao||--o{ fPedidos : "1:N (ID_CentroDistribuicao)"

    dCalendario         ||--o{ fPedidos : "1:N [Ativo] (Data_Pedido)"
    dCalendario         ||..o{ fPedidos : "1:N [Inativo] (Data_Envio)"
    dCalendario         ||..o{ fPedidos : "1:N [Inativo] (Data_Entrega_Real)"
    dCalendario         ||..o{ fPedidos : "1:N [Inativo] (Data_Previsao_Entrega)"

    fPedidos {
        string ID_Pedido PK
        int ID_Cliente FK
        int ID_Produto FK
        int ID_Transportadora FK
        int ID_CentroDistribuicao FK
        date Data_Pedido FK
        date Data_Envio FK_Inativo
        date Data_Previsao_Entrega FK_Inativo
        date Data_Entrega_Real FK_Inativo
        int Quantidade
        float Valor_Bruto
        float Desconto
        float Valor_Frete_Cobrado
        float Custo_Frete_Real
        string Status_Pedido
    }

    dClientes {
        int ID_Cliente PK
        string Segmento
        string Cidade
        string Estado
        string Regiao
        date Data_Cadastro
    }

    dProdutos {
        int ID_Produto PK
        string Nome_Produto
        string Categoria
        string Subcategoria
        float Peso_Kg
        float Custo_Unitario
        float Preco_Tabela
    }

    dTransportadoras {
        int ID_Transportadora PK
        string Nome_Empresa
        string Modal
        int SLA_Padrao_Dias
    }

    dCentrosDistribuicao {
        int ID_CentroDistribuicao PK
        string Nome_CD
        string Cidade
        string Estado
        string Regiao
        string Capacidade_Armazenagem
    }

    dCalendario {
        date Date PK
        int Ano
        int MesNum
        string MesNome
        string PeriodoComercial
    }
```

### Relacionamentos do Modelo:
- **`dClientes[ID_Cliente]` $\rightarrow$ `fPedidos[ID_Cliente]`**: 1:\* (Ativo)
- **`dProdutos[ID_Produto]` $\rightarrow$ `fPedidos[ID_Produto]`**: 1:\* (Ativo)
- **`dTransportadoras[ID_Transportadora]` $\rightarrow$ `fPedidos[ID_Transportadora]`**: 1:\* (Ativo)
- **`dCentrosDistribuicao[ID_CentroDistribuicao]` $\rightarrow$ `fPedidos[ID_CentroDistribuicao]`**: 1:\* (Ativo)
- **`dCalendario[Date]` $\rightarrow$ `fPedidos[Data_Pedido]`**: 1:\* (**Ativo** - Contexto padrão de data da venda)
- **`dCalendario[Date]` $\rightarrow$ `fPedidos[Data_Envio]`**: 1:\* (*Inativo* - Chamado em `[Faturamento Despachado]`)
- **`dCalendario[Date]` $\rightarrow$ `fPedidos[Data_Entrega_Real]`**: 1:\* (*Inativo* - Chamado em `[Faturamento Entregue]`)
- **`dCalendario[Date]` $\rightarrow$ `fPedidos[Data_Previsao_Entrega]`**: 1:\* (*Inativo*)

---

## 📖 2. Storytelling Executivo & Perguntas Críticas de Negócio

### O Dilema do Supply Chain Omnichannel:
Em operações de comércio eletrônico e varejo multicanal, o equilíbrio entre **Custo Logístico** e **Nível de Serviço (SLA)** define a sobrevivência do negócio:
1. **O Gargalo dos Atrasos (Erosão do NPS):**
   - Entregas fora do prazo geram cancelamentos, reclamações em massa no SAC e perda de clientes recorrentes. O painel aponta que a taxa média de atraso é de **15,37%**, subindo para quase **25%** nos picos sazonais de **Black Friday** e **Natal**.
2. **O Trade-off do Frete Grátis:**
   - Para alavancar a conversão de vendas, a empresa concede frete grátis em pedidos acima de R$ 350. No entanto, quando itens volumosos/pesados (geladeiras, móveis, lavadoras) são expedidos do CD de Cajamar (SP) para clientes das regiões Norte e Nordeste, o custo real de frete supera R$ 180, consumindo até **70% da margem bruta** da venda.
3. **Desempenho Heterogêneo de Transportadoras:**
   - Nem todas as transportadoras cumprem o SLA prometido na mesma proporção em diferentes rotas. Transportadoras como a *AeroCargo Brasil* entregam **94% de OTIF** com custo elevado, enquanto operadoras rodoviárias de grande porte sofrem com gargalos em rotas interestaduais de longa distância.

---

## 📚 3. Dicionário de Dados

### 3.1. Fato: `fPedidos.csv`
Registra cada transação de pedido, movimentação de frete e status de cumprimento da entrega.

| Coluna | Tipo | Chave | Descrição |
| :--- | :--- | :---: | :--- |
| `ID_Pedido` | Texto | PK | Identificador exclusivo do pedido (ex: `PED-2025-000001`). |
| `ID_Cliente` | Inteiro | FK | Chave estrangeira para `dClientes`. |
| `ID_Produto` | Inteiro | FK | Chave estrangeira para `dProdutos`. |
| `ID_Transportadora` | Inteiro | FK | Chave estrangeira para `dTransportadoras`. |
| `ID_CentroDistribuicao`| Inteiro | FK | CD de origem onde o item foi expedido (`dCentrosDistribuicao`). |
| `Data_Pedido` | Data | FK | Data da compra (relacionamento ativo com `dCalendario[Date]`). |
| `Data_Envio` | Data | FK (Inativo) | Data da expedição pelas docas do armazém. |
| `Data_Previsao_Entrega`| Data | FK (Inativo) | Prazo contratual de entrega prometido ao consumidor. |
| `Data_Entrega_Real` | Data | FK (Inativo) | Data em que a transportadora realizou a baixa de entrega no destino. |
| `Quantidade` | Inteiro | - | Quantidade de unidades faturadas do item. |
| `Valor_Bruto` | Decimal | - | Faturamento bruto (`Quantidade * Preco_Tabela`). |
| `Desconto` | Decimal | - | Desconto comercial concedido (maior na Black Friday). |
| `Valor_Frete_Cobrado` | Decimal | - | Valor pago pelo cliente pelo envio (R$ 0,00 quando Frete Grátis). |
| `Custo_Frete_Real` | Decimal | - | Custo real faturado pela transportadora parceira. |
| `Status_Pedido` | Texto | - | `Entregue`, `Em Transporte`, `Cancelado` ou `Devolvido`. |

---

### 3.2. Dimensões Cadastrais

#### `dCentrosDistribuicao.csv`
- `ID_CentroDistribuicao`: Chave primária (1 a 4).
- `Nome_CD`: Descrição operacional (`CD Cajamar - SP`, `CD Extrema - MG`, `CD Gravataí - RS`, `CD Cabo Santo Agostinho - PE`).
- `Cidade`, `Estado`, `Regiao`: Localização do hub logístico.
- `Capacidade_Armazenagem`: Área total de estocagem (m²).

#### `dTransportadoras.csv`
- `ID_Transportadora`: Chave primária (101 a 105).
- `Nome_Empresa`: Razão social da operadora logística (*LogBrasil Express*, *TransRodoviário Cargas*, *AeroCargo Brasil*, etc.).
- `Modal`: Categoria de transporte (*Expresso*, *Rodoviário*, *Aéreo*).
- `SLA_Padrao_Dias`: Prazo contratual base de entrega em dias úteis.

#### `dProdutos.csv`
- `ID_Produto`: Chave primária (2001 a 2025).
- `Nome_Produto`, `Categoria`, `Subcategoria`: Árvore mercadológica (Eletrônicos, Eletrodomésticos, Casa & Decoração, Moda, Beleza).
- `Peso_Kg`: Peso físico unitário em quilogramas (fator determinante no cálculo de frete).
- `Custo_Unitario`, `Preco_Tabela`: Valores de referência para apuração do CMV.

#### `dClientes.csv`
- `ID_Cliente`: Chave primária (10001 a 10600).
- `Segmento`: Perfil do comprador (`B2C` consumidor final ou `B2B` revendedor).
- `Cidade`, `Estado`, `Regiao`: Destino final de entrega da mercadoria.
- `Data_Cadastro`: Histórico de homologação cadastral.

---

## 🎨 4. Arquitetura de Layout Visual em 3 Páginas (Power BI)

### 📄 Página 1: Torre de Controle de Operações & Nível de Serviço (*Control Tower*)
**Foco:** Visão em tempo real da saúde operacional, cumprimento de SLAs e prazos.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Logo Omnichannel Logistics]   [Filtro: CD Origem]    [Filtro: Período]     │
├─────────────────┬─────────────────┬──────────────────┬───────────────────────┤
│  KPI 1          │  KPI 2          │  KPI 3           │  KPI 4                │
│  84,6%          │  15,4%          │  5,8 Dias        │  652 Pedidos          │
│  OTIF %         │  Taxa de Atraso │  Lead Time Médio │  Em Transporte        │
│  (No Prazo)     │  (Alerta Verm.) │  (Porta a Porta) │  (Carga Viva)         │
├─────────────────┴─────────────────┴──────────────────┴───────────────────────┤
│ [Gráfico 1: Evolução Mensal do OTIF % vs Meta de 85%]                        │
│ (Linha de tendência com linha constante de meta e formatação condicional)    │
├────────────────────────────────────────────────────┬─────────────────────────┤
│ [Gráfico 2: Desmembramento do Lead Time]           │ [Gráfico 3: Status]     │
│ (Barras Empilhadas: Tempo Expedição CD vs          │ (Rosca: Entregues vs    │
│ Tempo Trânsito Transportadora por Mês)             │ Atrasados vs Em Trânsito│
└────────────────────────────────────────────────────┴─────────────────────────┘
```

### 📄 Página 2: Rentabilidade, Margem & Gestão de Frete (*Financial Supply Chain*)
**Foco:** Onde a logística ganha ou perde dinheiro; rentabilidade após custos de frete.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Painel de Rentabilidade & Fretes]                 [Filtro: Categoria / Região│
├─────────────────┬─────────────────┬──────────────────┬───────────────────────┤
│  KPI 1          │  KPI 2          │  KPI 3           │  KPI 4                │
│  R$ 13.820.450  │  R$ 4.215.890   │  30,5%           │  - R$ 380.200         │
│  Faturamento Líq│  Margem Contrib.│  Margem % Real   │  Subsídio de Frete    │
│  (Pós-descontos)│  (CMV - Frete)  │  (Pós-Logística) │  (Absorvido empresa)  │
├─────────────────┴─────────────────┴──────────────────┴───────────────────────┤
│ [Gráfico 1: Margem de Contribuição por Região de Destino]                    │
│ (Barras Horizontais: Sudeste entrega 36% de margem; Norte/Nordeste 21%)      │
├────────────────────────────────────────────────────┬─────────────────────────┤
│ [Gráfico 2: Faturamento vs Custo de Frete por Peso]│ [Tabela de Exceções]    │
│ (Dispersão: Relação entre Peso_Kg e Custo_Frete)   │ (Rotas deficitárias com │
│                                                    │ frete grátis abusivo)   │
└────────────────────────────────────────────────────┴─────────────────────────┘
```

### 📄 Página 3: Avaliação de Fornecedores & SLA de Transportadoras
**Foco:** Scorecard de parceiros logísticos para renegociação de tabelas de frete.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Scorecard de Transportadoras Parceiras]           [Filtro: Modal / Estado]  │
├────────────────────────────────────────────────────┬─────────────────────────┤
│ [Matriz Analítica de Parceiros Logísticos]                                   │
│ (Transportadora | Modal | SLA Contratado | Lead Time Real | OTIF % | Frete) │
│ - LogBrasil Express     | 2 dias | 2.1 dias | 89,4% (Verde)   | R$ 28,40     │
│ - TransRodoviário       | 5 dias | 6.2 dias | 78,2% (Vermelho)| R$ 22,10     │
│ - AeroCargo Brasil      | 1 dia  | 1.0 dia  | 95,8% (Verde)   | R$ 74,50     │
├────────────────────────────────────────────────────┼─────────────────────────┤
│ [Gráfico de Dispersão: OTIF % vs Custo Médio Frete]│ [Mapa de Calor de Rotas]│
│ (Quadrante Mágico: Quem entrega rápido e barato)   │ (Origem CD x Destino UF)│
└────────────────────────────────────────────────────┴─────────────────────────┘
```

---

## 🛠️ 5. Como Executar e Replicar Localmente

```bash
# Execução do pipeline gerador de dados (8.150 pedidos validados)
python generate_supplychain_data.py
```

Os arquivos CSV são salvos automaticamente em:
- `data/`
- `Projetos/Projeto - SupplyChain/data/`

O catálogo com todas as fórmulas DAX documentadas e a tabela calendário encontram-se em [`DAX_MEASURES.md`](DAX_MEASURES.md).
