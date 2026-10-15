# Catálogo de Medidas DAX - Supply Chain & Omnichannel Logistics

Este documento consolida a modelagem analítica e as fórmulas em **DAX (Data Analysis Expressions)** projetadas para a operação de **Supply Chain, Logística e Varejo Omnichannel** (E-commerce e Centros de Distribuição).

O modelo adota a arquitetura **Star Schema com Role-Playing Dimensions**, conectando uma única dimensão de calendário (`dCalendario`) a múltiplos atributos temporais da tabela fato (`Data_Pedido`, `Data_Envio`, `Data_Previsao_Entrega` e `Data_Entrega_Real`).

---

## 📅 1. Tabela Calendário Dimensão (`dCalendario`)

> **Requisito Técnico:** Crie uma Nova Tabela no Power BI Desktop com o código abaixo e, em seguida, clique com o botão direito sobre ela e selecione **"Marcar como Tabela de Data"** selecionando a coluna `[Date]`.

```dax
dCalendario = 
VAR DataMinima = DATE ( 2025, 1, 1 )
VAR DataMaxima = DATE ( 2026, 12, 31 )
RETURN
    ADDCOLUMNS (
        CALENDAR ( DataMinima, DataMaxima ),
        "Ano", YEAR ( [Date] ),
        "Trimestre", "T" & FORMAT ( [Date], "Q" ),
        "AnoTrimestre", FORMAT ( [Date], "YYYY" ) & "-T" & FORMAT ( [Date], "Q" ),
        "MesNum", MONTH ( [Date] ),
        "MesNome", FORMAT ( [Date], "MMMM", "pt-BR" ),
        "MesAbrev", UPPER ( FORMAT ( [Date], "MMM", "pt-BR" ) ),
        "AnoMes", FORMAT ( [Date], "YYYY-MM" ),
        "Dia", DAY ( [Date] ),
        "DiaSemanaNum", WEEKDAY ( [Date], 2 ), -- 1 = Segunda, 7 = Domingo
        "DiaSemanaNome", FORMAT ( [Date], "dddd", "pt-BR" ),
        "DiaSemanaAbrev", FORMAT ( [Date], "ddd", "pt-BR" ),
        "EhFimDeSemana", IF ( WEEKDAY ( [Date], 2 ) IN { 6, 7 }, "Fim de Semana", "Dia Útil" ),
        "PeriodoComercial", 
            SWITCH (
                TRUE (),
                MONTH ( [Date] ) = 11 && DAY ( [Date] ) >= 15, "Pico Black Friday",
                MONTH ( [Date] ) = 12 && DAY ( [Date] ) <= 22, "Pico Natal",
                "Operação Regular"
            )
    )
```

> **Classificação de Colunas Obrigatória no Power BI:**
> - `dCalendario[MesNome]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[MesAbrev]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[DiaSemanaNome]` $\rightarrow$ Classificar por coluna `DiaSemanaNum`.

---

## 🔗 2. Mapeamento de Relacionamentos (Role-Playing Dimensions)

No Power BI, relacione `dCalendario[Date]` com as 4 colunas de data da `fPedidos`:

| Tabela Origem | Tabela Destino | Cardinalidade | Estado do Relacionamento |
| :--- | :--- | :---: | :---: |
| `dCalendario[Date]` | `fPedidos[Data_Pedido]` | **1 para Muitos (1:\*)** | **Ativo** (Filtro Padrão do Dashboard) |
| `dCalendario[Date]` | `fPedidos[Data_Envio]` | **1 para Muitos (1:\*)** | **Inativo** (Ativado via `USERELATIONSHIP`) |
| `dCalendario[Date]` | `fPedidos[Data_Entrega_Real]` | **1 para Muitos (1:\*)** | **Inativo** (Ativado via `USERELATIONSHIP`) |
| `dCalendario[Date]` | `fPedidos[Data_Previsao_Entrega]`| **1 para Muitos (1:\*)** | **Inativo** (Ativado via `USERELATIONSHIP`) |

---

## 💰 3. Medidas de Faturamento e Rentabilidade Financeira

### 3.1. Faturamento Bruto e Descontos
```dax
[Faturamento Bruto] = 
SUM ( fPedidos[Valor_Bruto] )
```

```dax
[Total Descontos] = 
SUM ( fPedidos[Desconto] )
```

### 3.2. Faturamento Líquido
- **Objetivo:** Receita líquida faturada após dedução dos descontos comerciais e promocionais.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Faturamento Líquido] = 
VAR ReceitaBruta = [Faturamento Bruto]
VAR DescontosConcedidos = [Total Descontos]
RETURN
    ReceitaBruta - DescontosConcedidos
```

---

### 3.3. Margem de Contribuição (R$ e %)
- **Objetivo:** Lucro marginal gerado após dedução do Custo das Mercadorias Vendidas (CMV) e do Custo Real de Frete incorrido.
- **Formatação:** Moeda (`R$ #,##0.00`) e Porcentagem (`0.0%`)

```dax
[Margem de Contribuição] = 
VAR ReceitaLiquida = [Faturamento Líquido]
VAR CustoMercadorias = 
    SUMX ( 
        fPedidos, 
        fPedidos[Quantidade] * RELATED ( dProdutos[Custo_Unitario] ) 
    )
VAR CustoFreteReal = SUM ( fPedidos[Custo_Frete_Real] )
RETURN
    ReceitaLiquida - ( CustoMercadorias + CustoFreteReal )
```

```dax
[Margem de Contribuição %] = 
VAR Margem = [Margem de Contribuição]
VAR Receita = [Faturamento Líquido]
RETURN
    DIVIDE ( 
        Margem, 
        Receita, 
        0.0 
    )
```

---

## 🚚 4. Indicadores de Nível de Serviço e SLA Logístico

### 4.1. Taxa de Entregas no Prazo (OTIF / On-Time Delivery %)
- **Objetivo:** Percentual de pedidos concluídos que foram entregues na data prevista ou antes (`Data_Entrega_Real <= Data_Previsao_Entrega`).
- **Formatação:** Porcentagem (`0.0%`)

```dax
[OTIF % (Entregas no Prazo)] = 
VAR TotalEntregues = 
    CALCULATE (
        COUNTROWS ( fPedidos ),
        fPedidos[Status_Pedido] IN { "Entregue", "Devolvido" },
        NOT ( ISBLANK ( fPedidos[Data_Entrega_Real] ) )
    )
VAR EntregasNoPrazo = 
    CALCULATE (
        COUNTROWS ( fPedidos ),
        fPedidos[Status_Pedido] IN { "Entregue", "Devolvido" },
        fPedidos[Data_Entrega_Real] <= fPedidos[Data_Previsao_Entrega]
    )
RETURN
    DIVIDE ( 
        EntregasNoPrazo, 
        TotalEntregues, 
        0.0 
    )
```

---

### 4.2. Pedidos em Atraso (Quantidade e Taxa)
```dax
[Pedidos em Atraso] = 
CALCULATE (
    COUNTROWS ( fPedidos ),
    fPedidos[Status_Pedido] IN { "Entregue", "Devolvido" },
    fPedidos[Data_Entrega_Real] > fPedidos[Data_Previsao_Entrega]
)
```

```dax
[Taxa de Atraso %] = 
VAR Atrasados = [Pedidos em Atraso]
VAR TotalEntregues = 
    CALCULATE (
        COUNTROWS ( fPedidos ),
        fPedidos[Status_Pedido] IN { "Entregue", "Devolvido" }
    )
RETURN
    DIVIDE ( Atrasados, TotalEntregues, 0.0 )
```

---

### 4.3. Lead Time Médio (Dias Corridos)
- **Objetivo:** Tempo médio total decorrido entre a realização do pedido pelo cliente (`Data_Pedido`) e a efetiva entrega física (`Data_Entrega_Real`).
- **Formatação:** Decimal (`0.0 dias`)

```dax
[Lead Time Médio (Dias)] = 
VAR PedidosCompletos = 
    FILTER (
        fPedidos,
        fPedidos[Status_Pedido] IN { "Entregue", "Devolvido" } &&
        NOT ( ISBLANK ( fPedidos[Data_Entrega_Real] ) )
    )
RETURN
    AVERAGEX (
        PedidosCompletos,
        INT ( fPedidos[Data_Entrega_Real] - fPedidos[Data_Pedido] )
    )
```

---

### 4.4. Tempo Médio de Expedição e Trânsito (Sub-etapas do Lead Time)
```dax
[Tempo Médio de Expedição (Dias)] = 
-- Tempo entre Data_Pedido e Data_Envio (SLA interno do Centro de Distribuição)
VAR PedidosEnviados = 
    FILTER (
        fPedidos,
        NOT ( ISBLANK ( fPedidos[Data_Envio] ) )
    )
RETURN
    AVERAGEX (
        PedidosEnviados,
        INT ( fPedidos[Data_Envio] - fPedidos[Data_Pedido] )
    )
```

```dax
[Tempo Médio de Trânsito (Dias)] = 
-- Tempo entre Data_Envio e Data_Entrega_Real (SLA da Transportadora)
VAR PedidosEntregues = 
    FILTER (
        fPedidos,
        NOT ( ISBLANK ( fPedidos[Data_Entrega_Real] ) ) &&
        NOT ( ISBLANK ( fPedidos[Data_Envio] ) )
    )
RETURN
    AVERAGEX (
        PedidosEntregues,
        INT ( fPedidos[Data_Entrega_Real] - fPedidos[Data_Envio] )
    )
```

---

## 📦 5. Análise de Eficiência de Frete

### 5.1. Custo Real de Frete vs Frete Cobrado
```dax
[Custo Total Frete Real] = 
SUM ( fPedidos[Custo_Frete_Real] )
```

```dax
[Total Frete Cobrado] = 
SUM ( fPedidos[Valor_Frete_Cobrado] )
```

### 5.2. Subsídio de Frete (Despesa Líquida de Envio)
- **Objetivo:** Custo de frete absorvido pela empresa para oferecer campanhas promocionais de frete grátis ou descontos de envio.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Subsídio de Frete] = 
VAR CustoReal = [Custo Total Frete Real]
VAR CobradoCliente = [Total Frete Cobrado]
RETURN
    CustoReal - CobradoCliente
```

### 5.3. % Frete sobre Faturamento
- **Objetivo:** Peso do frete na receita líquida, essencial para avaliar a sustentabilidade logística por região de entrega.
- **Formatação:** Porcentagem (`0.0%`)

```dax
[% Frete sobre Faturamento] = 
DIVIDE ( 
    [Custo Total Frete Real], 
    [Faturamento Líquido], 
    0.0 
)
```

---

## 🔄 6. Medidas com Relacionamentos Inativos (Role-Playing / USERELATIONSHIP)

### 6.1. Faturamento por Data de Entrega Efetiva
- **Objetivo:** Reconhecimento contábil de receita no momento em que a entrega é realizada no destino final, ativando o relacionamento inativo entre `dCalendario[Date]` e `fPedidos[Data_Entrega_Real]`.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Faturamento Entregue] = 
CALCULATE (
    [Faturamento Líquido],
    USERELATIONSHIP ( dCalendario[Date], fPedidos[Data_Entrega_Real] ),
    fPedidos[Status_Pedido] = "Entregue"
)
```

### 6.2. Faturamento Despachado
- **Objetivo:** Monitora o volume financeiro expedido pelas docas dos Centros de Distribuição no mês selecionado.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Faturamento Despachado] = 
CALCULATE (
    [Faturamento Líquido],
    USERELATIONSHIP ( dCalendario[Date], fPedidos[Data_Envio] )
)
```

### 6.3. Pedidos em Trânsito
- **Objetivo:** Volume de pedidos que já saíram dos CDs mas ainda não foram finalizados no destino.
- **Formatação:** Inteiro (`#,##0`)

```dax
[Pedidos em Trânsito] = 
CALCULATE (
    COUNTROWS ( fPedidos ),
    fPedidos[Status_Pedido] = "Em Transporte"
)
```

---

## 🎨 7. Formatação Condicional para Painéis de Logística

### 7.1. Cor Dinâmica para OTIF %
- **Regra:** Verde (`#2E7D32`) se $\ge 85\%$ (meta operacional atingida); Amarelo/Laranja (`#F39C12`) entre $80\%$ e $84.9\%$; Vermelho (`#C62828`) se $< 80\%$ (alerta de ruptura de SLA).

```dax
[Cor OTIF] = 
VAR TaxaOTIF = [OTIF % (Entregas no Prazo)]
RETURN
    SWITCH (
        TRUE (),
        ISBLANK ( TaxaOTIF ), "#757575",
        TaxaOTIF >= 0.85,    "#2E7D32", -- Verde Suave (Dentro da Meta)
        TaxaOTIF >= 0.80,    "#F39C12", -- Laranja / Alerta
        "#C62828"                       -- Vermelho Suave (Crítico)
    )
```
