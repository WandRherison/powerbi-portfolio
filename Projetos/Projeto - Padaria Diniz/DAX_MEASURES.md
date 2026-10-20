# 🥖 Catálogo de Medidas DAX - Padaria Diniz (E-commerce & Analytics)

Este documento consolida a especificação analítica completa, a tabela dimensão de tempo (`dCalendario`), as medidas em **DAX (Data Analysis Expressions)** e as regras de negócio modeladas para o ecossistema da **Padaria Diniz**, integrando dados transacionais do **MySQL (AWS RDS)** ao **Power BI Desktop**.

---

## 📅 1. Tabela Calendário Dimensão (`dCalendario`)

> **Requisito Técnico:** Crie uma Nova Tabela no Power BI Desktop com o código abaixo e marque como **"Tabela de Data Oficial"** selecionando a coluna `Data`.

```dax
dCalendario = 
VAR DataMinima = MIN ( vw_fato_vendas[data_pedido_data] )
VAR DataMaxima = MAX ( vw_fato_vendas[data_pedido_data] )
-- Inicia no primeiro dia do mês das primeiras movimentações
VAR DataInicio = IF ( ISBLANK ( DataMinima ), DATE ( 2026, 7, 1 ), DATE ( YEAR ( DataMinima ), MONTH ( DataMinima ), 1 ) )
-- Finaliza no último dia com movimentação de vendas (ou TODAY())
VAR DataFim    = IF ( ISBLANK ( DataMaxima ), TODAY (), DataMaxima )

RETURN
ADDCOLUMNS (
    CALENDAR ( DataInicio, DataFim ),
    "Data", [Date],
    "Ano", YEAR ( [Date] ),
    "TrimestreNum", QUARTER ( [Date] ),
    "Trimestre", "T" & FORMAT ( [Date], "Q" ),
    "TrimestreAno", "T" & FORMAT ( [Date], "Q" ) & "/" & YEAR ( [Date] ),
    "MesNum", MONTH ( [Date] ),
    "MesNome", FORMAT ( [Date], "mmmm", "pt-BR" ),
    "MesAbrev", UPPER ( FORMAT ( [Date], "mmm", "pt-BR" ) ),
    "MesAno", FORMAT ( [Date], "mmm/yyyy", "pt-BR" ),
    "AnoMesNum", YEAR ( [Date] ) * 100 + MONTH ( [Date] ),
    "Dia", DAY ( [Date] ),
    "DiaSemanaNum", WEEKDAY ( [Date], 2 ), -- 1 = Segunda-feira, 7 = Domingo
    "DiaSemanaNome", FORMAT ( [Date], "dddd", "pt-BR" ),
    "DiaSemanaAbrev", FORMAT ( [Date], "ddd", "pt-BR" ),
    "SemanaAno", WEEKNUM ( [Date], 2 ),
    "DiaDoAno", DATEDIFF ( DATE ( YEAR ( [Date] ), 1, 1 ), [Date], DAY ) + 1,
    "EhFimDeSemana", IF ( WEEKDAY ( [Date], 2 ) >= 6, "Sim", "Não" ),
    "EhDiaUtil", IF ( WEEKDAY ( [Date], 2 ) < 6, 1, 0 )
)
```

> **Classificação de Colunas Obrigatória:**
> - `dCalendario[MesNome]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[MesAbrev]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[MesAno]` $\rightarrow$ Classificar por coluna `AnoMesNum`.
> - `dCalendario[DiaSemanaNome]` $\rightarrow$ Classificar por coluna `DiaSemanaNum`.

---

## 💰 2. Faturamento & Receita (`vw_fato_vendas`)

### 2.1. Receita Bruta (Vendas Válidas)
- **Objetivo:** Total faturado em pedidos ativos (desconsidera pedidos cancelados ou com exclusão lógica *Soft Delete*).
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Receita Bruta = 
CALCULATE (
    SUM ( vw_fato_vendas[subtotal_venda] ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 2.2. Receita Faturada (Pedidos Concluídos)
- **Objetivo:** Faturamento efetivamente concluído e retirado no balcão (`Finalizado`).
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Receita Faturada = 
CALCULATE (
    SUM ( vw_fato_vendas[subtotal_venda] ),
    vw_fato_vendas[status_pedido] = "Finalizado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 2.3. Receita em Aberto (Esteira de Produção)
- **Objetivo:** Valor de pedidos ativos que estão pendentes na cozinha ou em produção.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Receita em Aberto = 
CALCULATE (
    SUM ( vw_fato_vendas[subtotal_venda] ),
    vw_fato_vendas[status_pedido] IN { "Pendente", "Em produção" },
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 2.4. Receita Cancelada (Perda Faturável)
- **Objetivo:** Montante de vendas canceladas.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Receita Cancelada = 
CALCULATE (
    SUM ( vw_fato_vendas[subtotal_venda] ),
    vw_fato_vendas[status_pedido] = "Cancelado"
)
```

---

## 📈 3. Custos, Lucro & Rentabilidade

### 3.1. Custo Total (CMV - Custo da Mercadoria Vendida)
- **Objetivo:** Soma do custo de fabricação/aquisição dos itens vendidos em pedidos válidos.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Custo Total = 
CALCULATE (
    SUM ( vw_fato_vendas[custo_total] ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 3.2. Lucro Real (Lucro Bruto Comercial)
- **Objetivo:** Resultado financeiro real da operação: Receita Bruta menos o CMV.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Lucro Real = 
[Receita Bruta] - [Custo Total]
```

### 3.3. Margem de Lucro Real (%)
- **Objetivo:** Percentual de rentabilidade líquida sobre o faturamento.
- **Formatação:** Porcentagem (`0.0%`)

```dax
Margem de Lucro Real = 
DIVIDE ( [Lucro Real], [Receita Bruta], 0.0 )
```

### 3.4. Markup Médio (%)
- **Objetivo:** Margem percentual de acréscimo aplicada sobre o custo dos produtos.
- **Formatação:** Porcentagem (`0.0%`)

```dax
Markup Médio = 
DIVIDE ( [Lucro Real], [Custo Total], 0.0 )
```

---

## 🏷️ 4. Gestão de Ofertas & Descontos Promocionais

### 4.1. Desconto Total Concedido
- **Objetivo:** Montante em reais economizado pelos clientes em itens de oferta versus o preço cheio de tabela.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
Desconto Total Concedido = 
CALCULATE (
    SUMX (
        vw_fato_vendas,
        VAR PrecoTabela = RELATED ( vw_dim_produtos[preco_venda] )
        VAR PrecoPraticado = vw_fato_vendas[preco_unitario]
        VAR Diferenca = ( PrecoTabela - PrecoPraticado ) * vw_fato_vendas[quantidade]
        RETURN IF ( Diferenca > 0, Diferenca, 0 )
    ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 4.2. % Médio de Desconto
```dax
% Desconto Médio = 
VAR ReceitaCheia = [Receita Bruta] + [Desconto Total Concedido]
RETURN
DIVIDE ( [Desconto Total Concedido], ReceitaCheia, 0.0 )
```

---

## 📦 5. Pedidos, Ticket Médio & Volume

### 5.1. Quantidade de Pedidos Válidos
```dax
Qtd Pedidos = 
CALCULATE (
    DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 5.2. Quantidade de Pedidos Finalizados
```dax
Qtd Pedidos Finalizados = 
CALCULATE (
    DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ),
    vw_fato_vendas[status_pedido] = "Finalizado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 5.3. Taxa de Cancelamento (%)
```dax
Taxa de Cancelamento = 
VAR Cancelados = CALCULATE ( DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ), vw_fato_vendas[status_pedido] = "Cancelado" )
VAR Total = DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] )
RETURN
DIVIDE ( Cancelados, Total, 0.0 )
```

### 5.4. Ticket Médio por Pedido
```dax
Ticket Médio = 
DIVIDE ( [Receita Bruta], [Qtd Pedidos], 0.0 )
```

### 5.5. Volume de Vendas (Unidades Físicas)
```dax
Volume de Vendas = 
CALCULATE (
    SUM ( vw_fato_vendas[quantidade] ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 5.6. Média de Itens por Pedido
```dax
Média Itens por Pedido = 
DIVIDE ( [Volume de Vendas], [Qtd Pedidos], 0.0 )
```

---

## ⏱️ 6. Eficiência Operacional & SLA de Preparo (*Lead Time*)

A view SQL `vw_fato_vendas` pré-calcula a coluna `lead_time_minutos` via `TIMESTAMPDIFF(MINUTE, p.data_pedido, p.data_hora_atualizacao)`, garantindo máxima velocidade no Power BI.

### 6.1. Lead Time Médio de Preparo (Minutos)
```dax
Lead Time Médio de Preparo (Minutos) = 
CALCULATE (
    AVERAGEX (
        SUMMARIZE (
            FILTER (
                vw_fato_vendas,
                vw_fato_vendas[status_pedido] = "Finalizado" &&
                NOT ( ISBLANK ( vw_fato_vendas[lead_time_minutos] ) )
            ),
            vw_fato_vendas[codigo_pedido],
            "MinutosPedido", MAX ( vw_fato_vendas[lead_time_minutos] )
        ),
        [MinutosPedido]
    )
)
```

### 6.2. Lead Time Formatado Amigável
```dax
Lead Time Formatado = 
VAR MinutosTotais = [Lead Time Médio de Preparo (Minutos)]
VAR Horas = INT ( DIVIDE ( MinutosTotais, 60 ) )
VAR Minutos = MOD ( ROUND ( MinutosTotais, 0 ), 60 )
RETURN
IF (
    ISBLANK ( MinutosTotais ),
    "-",
    IF ( Horas > 0, FORMAT ( Horas, "0" ) & "h ", "" ) & FORMAT ( Minutos, "0" ) & "min"
)
```

### 6.3. Meta de SLA Operacional (30 Minutos)
```dax
Meta Lead Time = 30
```

### 6.4. % de Pedidos no Prazo (Atingimento de SLA)
```dax
% Pedidos no Prazo = 
VAR MetaMinutos = [Meta Lead Time]
RETURN
DIVIDE (
    CALCULATE (
        DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ),
        vw_fato_vendas[status_pedido] = "Finalizado",
        vw_fato_vendas[is_excluido] = FALSE (),
        FILTER (
            vw_fato_vendas,
            vw_fato_vendas[lead_time_minutos] <= MetaMinutos
        )
    ),
    [Qtd Pedidos Finalizados],
    0.0
)
```

---

## 📅 7. Inteligência Temporal (*Time Intelligence*)

### 7.1. Receita do Mês Anterior (MoM)
```dax
Receita Mês Anterior = 
CALCULATE (
    [Receita Bruta],
    DATEADD ( dCalendario[Data], -1, MONTH )
)
```

### 7.2. Crescimento MoM (%)
```dax
Crescimento MoM % = 
VAR RecAtual = [Receita Bruta]
VAR RecAnterior = [Receita Mês Anterior]
RETURN
IF (
    ISBLANK ( RecAnterior ) || RecAnterior == 0,
    BLANK (),
    DIVIDE ( RecAtual - RecAnterior, RecAnterior, 0.0 )
)
```

### 7.3. Receita Acumulada no Ano (YTD)
```dax
Receita YTD = 
TOTALYTD ( [Receita Bruta], dCalendario[Data] )
```

---

## 👥 8. Clientes & Sistema "Peça e Retire"

### 8.1. Clientes Ativos Compradores
```dax
Clientes Compradores = 
CALCULATE (
    DISTINCTCOUNT ( vw_fato_vendas[codigo_cliente] ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 8.2. Pedidos com Agendamento de Retirada
```dax
Qtd Pedidos Agendados = 
CALCULATE (
    DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ),
    NOT ( ISBLANK ( vw_fato_vendas[data_retirada] ) ),
    vw_fato_vendas[status_pedido] <> "Cancelado",
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

### 8.3. Pedidos Agendados para Hoje (Operação do Dia)
```dax
Qtd Agendados para Hoje = 
CALCULATE (
    DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ),
    vw_fato_vendas[data_retirada] = TODAY (),
    vw_fato_vendas[status_pedido] IN { "Pendente", "Em produção" },
    vw_fato_vendas[is_excluido] = FALSE ()
)
```

---

## 🥖 9. Gestão de Estoque & Reposição

### 9.1. Estoque Total em Unidades
```dax
Estoque Total = 
SUM ( vw_dim_produtos[quantidade_estoque] )
```

### 9.2. Quantidade de Itens Esgotados
```dax
Qtd Produtos Esgotados = 
CALCULATE (
    COUNTROWS ( vw_dim_produtos ),
    vw_dim_produtos[quantidade_estoque] = 0
)
```

### 9.3. Quantidade de Itens em Alerta de Reposição
```dax
Qtd Produtos em Alerta = 
CALCULATE (
    COUNTROWS ( vw_dim_produtos ),
    vw_dim_produtos[quantidade_estoque] > 0,
    vw_dim_produtos[quantidade_estoque] <= 10
)
```
