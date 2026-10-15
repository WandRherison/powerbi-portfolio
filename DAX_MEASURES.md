# Catálogo de Medidas DAX - Gestão Analítica para ONG Social

Este documento consolida a modelagem analítica e as fórmulas em **DAX (Data Analysis Expressions)** projetadas para a Organização Não Governamental (ONG) de assistência comunitária. O modelo adota a arquitetura **Star Schema Multi-Fato** (*Constellation / Galaxy Schema*), compartilhando dimensões com as tabelas fato **`fDoacoes`** (captação de recursos) e **`fAtendimentos`** (impacto social e execução de projetos).

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
        "CampanhaSazonal", 
            SWITCH (
                MONTH ( [Date] ),
                5, "Campanha Mães / Inverno Solidário",
                12, "Campanha Natal Solidário",
                "Operação Padrão"
            )
    )
```

> **Classificação de Colunas Obrigatória:**
> - `dCalendario[MesNome]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[MesAbrev]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[DiaSemanaNome]` $\rightarrow$ Classificar por coluna `DiaSemanaNum`.

---

## 💰 2. Medidas Essenciais de Captação e Fundraising (`fDoacoes`)

### 2.1. Arrecadação Total (Doações Aprovadas)
- **Objetivo:** Total financeiro arrecadado considerando exclusivamente doações com status `Aprovada`.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Total Arrecadado] = 
CALCULATE (
    SUM ( fDoacoes[Valor] ),
    KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Aprovada" )
)
```

---

### 2.2. Média por Doação (Ticket Médio de Doação)
- **Objetivo:** Valor médio aportado por cada transação de doação efetivamente aprovada.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Ticket Médio Doação] = 
VAR TotalValor = [Total Arrecadado]
VAR QtdDoacoesAprovadas = 
    CALCULATE (
        COUNTROWS ( fDoacoes ),
        KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Aprovada" )
    )
RETURN
    DIVIDE ( 
        TotalValor, 
        QtdDoacoesAprovadas, 
        0.0 
    )
```

---

### 2.3. Variação MoM (Month-over-Month) da Arrecadação
- **Objetivo:** Crescimento ou redução percentual da arrecadação líquida frente ao mês imediatamente anterior.
- **Formatação:** Porcentagem (`+0.00%;-0.00%;0.00%`)

```dax
[Arrecadação MoM %] = 
VAR MesAtual = [Total Arrecadado]
VAR MesAnterior = 
    CALCULATE (
        [Total Arrecadado],
        DATEADD ( dCalendario[Date], -1, MONTH )
    )
VAR VariacaoAbsoluta = MesAtual - MesAnterior
RETURN
    DIVIDE (
        VariacaoAbsoluta,
        MesAnterior,
        BLANK ()
    )
```

---

### 2.4. % de Atingimento da Meta por Projeto
- **Objetivo:** Acompanhamento do percentual atingido da meta orçamentária estipulada para cada projeto social.
- **Formatação:** Porcentagem (`0.0%`)

```dax
[% Atingimento da Meta] = 
VAR TotalArrecadadoProjeto = [Total Arrecadado]
VAR MetaOrcada = SUM ( dProjetos[Meta_Arrecadacao] )
RETURN
    DIVIDE (
        TotalArrecadadoProjeto,
        MetaOrcada,
        0.0
    )
```

---

### 2.5. Quantidade de Doadores Ativos Recorrentes
- **Objetivo:** Contagem de doadores únicos (Pessoa Física ou Jurídica) cujo perfil de aporte é contínuo (`Recorrente` ou `Mensal`) e que possuem transações aprovadas.
- **Formatação:** Inteiro (`#,##0`)

```dax
[Doadores Ativos Recorrentes] = 
CALCULATE (
    DISTINCTCOUNT ( fDoacoes[ID_Doador] ),
    fDoacoes[Tipo_Doacao] IN { "Recorrente", "Mensal" },
    fDoacoes[Status_Pagamento] = "Aprovada"
)
```

---

## 🤝 3. Medidas de Impacto Social e Execução (`fAtendimentos`)

### 3.1. Custo Médio por Atendimento Social
- **Objetivo:** Indicador de eficiência operacional que mede o investimento médio despendido em cada atendimento comunitário realizado.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Custo Médio Atendimento] = 
VAR CustoTotal = SUM ( fAtendimentos[Custo_Atendimento] )
VAR TotalServicosPrestados = COUNTROWS ( fAtendimentos )
RETURN
    DIVIDE (
        CustoTotal,
        TotalServicosPrestados,
        0.0
    )
```

---

### 3.2. Total de Atendimentos Realizados
- **Objetivo:** Volume total de serviços de assistência executados nos projetos.
- **Formatação:** Inteiro (`#,##0`)

```dax
[Total Atendimentos] = 
COUNTROWS ( fAtendimentos )
```

---

### 3.3. Beneficiários Únicos Acolhidos
- **Objetivo:** Quantidade de cidadãos e famílias únicas beneficiadas pelos programas sociais.
- **Formatação:** Inteiro (`#,##0`)

```dax
[Beneficiários Únicos] = 
DISTINCTCOUNT ( fAtendimentos[ID_Beneficiario] )
```

---

### 3.4. Investimento Social Direto (Custo Total das Ações)
- **Objetivo:** Montante financeiro diretamente aplicado nas categorias de serviço (Alimentação, Capacitação, Saúde, Apoio Jurídico).
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Investimento Social Direto] = 
SUM ( fAtendimentos[Custo_Atendimento] )
```

---

## ⚖️ 4. Medidas de Governança, Saldo e Prestação de Contas (Multi-Fato)

### 4.1. Superávit Operacional / Saldo em Caixa
- **Objetivo:** Demonstra a liquidez da entidade (`Total Arrecadado - Custo de Atendimentos Sociais`). Essencial para auditoria e prestação de contas do conselho fiscal.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Saldo Operacional Projetos] = 
[Total Arrecadado] - [Investimento Social Direto]
```

---

### 4.2. Arrecadação por Tipo de Pessoa (PF vs PJ)
- **Objetivo:** Discriminação de captação comunitária (*PF*) vs incentivo corporativo/filantropia empresarial (*PJ*).
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Arrecadação PF] = 
CALCULATE (
    [Total Arrecadado],
    dDoadores[Tipo_Pessoa] = "PF"
)
```

```dax
[Arrecadação PJ] = 
CALCULATE (
    [Total Arrecadado],
    dDoadores[Tipo_Pessoa] = "PJ"
)
```

---

## 🎨 5. Formatação Condicional e Apoio Visual aos Painéis

### 5.1. Cor Dinâmica para MoM (Hexadecimal)
- **Objetivo:** Aplicar verde para meses de alta na captação e vermelho para quedas de receita.
- **Tipo de Retorno:** Texto

```dax
[Cor MoM Arrecadacao] = 
VAR Variacao = [Arrecadação MoM %]
RETURN
    SWITCH (
        TRUE (),
        ISBLANK ( Variacao ), "#757575", -- Cinza para o primeiro mês da série
        Variacao > 0,         "#2E7D32", -- Verde Suave
        Variacao < 0,         "#C62828", -- Vermelho Suave
        "#757575"
    )
```

### 5.2. MoM com Indicador Visual (Seta Unicode)
- **Objetivo:** Indicador direto para cartões de KPI.
- **Tipo de Retorno:** Texto

```dax
[Arrecadação MoM (com Ícone)] = 
VAR Variacao = [Arrecadação MoM %]
RETURN
    SWITCH (
        TRUE (),
        ISBLANK ( Variacao ), "-",
        Variacao > 0, "▲ " & FORMAT ( Variacao, "+0.0%" ),
        Variacao < 0, "▼ " & FORMAT ( Variacao, "0.0%" ),
        "▬ " & FORMAT ( Variacao, "0.0%" )
    )
```
