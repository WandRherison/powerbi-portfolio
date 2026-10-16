# Catálogo de Medidas DAX - ONG Multi-Programas (Gestão Estratégica & Impacto)

Este documento consolida a modelagem analítica e as fórmulas em **DAX (Data Analysis Expressions)** projetadas para a **Organização Social Multi-Programas**. 

O modelo adota a arquitetura **Multi-Fato Star Schema (Constellation Schema)** com três tabelas fato (`fDoacoes`, `fAtendimentos` e `fOrcamentoMetas`) compartilhando quatro dimensões conformadas (`dProjetos`, `dDoadores`, `dCanais`, `dRegioes` e `dCalendario`), eliminando qualquer relacionamento muitos-para-muitos (N:N).

---

## 📅 1. Tabela Calendário Dimensão (`dCalendario`)

> **Requisito Técnico:** Crie uma Nova Tabela no Power BI Desktop com o código abaixo e marque como **"Tabela de Data"** selecionando a coluna `[Date]`.

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
        "AnoMesNum", ( YEAR ( [Date] ) * 100 ) + MONTH ( [Date] ), -- Chave para fOrcamentoMetas (Ex: 202501)
        "AnoMesTexto", FORMAT ( [Date], "YYYY-MM" ),
        "Dia", DAY ( [Date] ),
        "DiaSemanaNum", WEEKDAY ( [Date], 2 ), -- 1 = Segunda, 7 = Domingo
        "DiaSemanaNome", FORMAT ( [Date], "dddd", "pt-BR" ),
        "CampanhaSazonal", 
            SWITCH (
                MONTH ( [Date] ),
                11, "Campanha Aquecimento Natal",
                12, "Campanha Natal Solidário",
                5,  "Campanha Mães & Inverno",
                "Operação Padrão"
            )
    )
```

> **Classificação de Colunas Obrigatória no Power BI:**
> - `dCalendario[MesNome]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[MesAbrev]` $\rightarrow$ Classificar por coluna `MesNum`.
> - `dCalendario[AnoMesTexto]` $\rightarrow$ Classificar por coluna `AnoMesNum`.
> - `dCalendario[DiaSemanaNome]` $\rightarrow$ Classificar por coluna `DiaSemanaNum`.

---

## 🔗 2. Mapeamento de Relacionamentos do Modelo

Todas as conexões são **1 para Muitos (1:\*)** com direção de filtro **Única (Dimensão filtra Fato)**:

| Tabela Origem (1) | Tabela Destino (\*) | Coluna de Junção | Tipo de Relacionamento | Direção do Filtro |
| :--- | :--- | :--- | :---: | :---: |
| `dProjetos` | `fDoacoes` | `ID_Projeto` | Ativo | Única (1 $\rightarrow$ \*) |
| `dProjetos` | `fAtendimentos` | `ID_Projeto` | Ativo | Única (1 $\rightarrow$ \*) |
| `dProjetos` | `fOrcamentoMetas` | `ID_Projeto` | Ativo | Única (1 $\rightarrow$ \*) |
| `dDoadores` | `fDoacoes` | `ID_Doador` | Ativo | Única (1 $\rightarrow$ \*) |
| `dCanais` | `fDoacoes` | `ID_Canal` | Ativo | Única (1 $\rightarrow$ \*) |
| `dRegioes` | `fAtendimentos` | `ID_Regiao` | Ativo | Única (1 $\rightarrow$ \*) |
| `dCalendario` | `fDoacoes` | `Date` = `Data_Doacao` | Ativo | Única (1 $\rightarrow$ \*) |
| `dCalendario` | `fAtendimentos` | `Date` = `Data_Atendimento` | Ativo | Única (1 $\rightarrow$ \*) |
| `dCalendario` | `fOrcamentoMetas` | `Date` = `Data_Meta` | Ativo | Única (1 $\rightarrow$ \*) |

> [!TIP]
> **Arquitetura Dimensional - Resolução do Conflito de Grão (Evitando M:M):**
> A tabela `dCalendario` possui granularidade **diária** (onde `[Date]` é chave primária estritamente única, mas `[AnoMesNum]` repete 28 a 31 vezes por mês). Já a tabela `fOrcamentoMetas` possui granularidade **mensal por projeto** (o mês repete 6 vezes, uma por projeto). 
> 
> Se relacionássemos por `AnoMesNum = AnoMes`, o Power BI forçaria uma relação **Muitos-para-Muitos (*:*)**, que gera ambiguidade no modelo. A solução recomendada de padrão ouro em engenharia de dados é **ancorar a meta no primeiro dia de cada mês (`Data_Meta = YYYY-MM-01`)**. Assim, relacionamos `dCalendario[Date]` (1) $\rightarrow$ `fOrcamentoMetas[Data_Meta]` (*), transformando a conexão em um relacionamento estrito de **1 para Muitos (1:*)**, ativo e com direção de filtro única!

---

## 💰 3. Métricas de Captação e Saúde Financeira (`fDoacoes` e `fOrcamentoMetas`)

### 3.1. Total Arrecadado Líquido
- **Objetivo:** Montante financeiro líquido efetivamente creditado na conta da ONG (deduzidas as taxas de intermediação de canais de pagamento) e considerando apenas doações confirmadas.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Total Arrecadado Líquido] = 
CALCULATE (
    SUM ( fDoacoes[Valor_Liquido] ),
    KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Confirmado" )
)
```

### 3.2. Total Arrecadado Bruto e Taxas Retidas
```dax
[Total Arrecadado Bruto] = 
CALCULATE (
    SUM ( fDoacoes[Valor_Bruto] ),
    KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Confirmado" )
)
```

```dax
[Total Taxas Intermediadores] = 
CALCULATE (
    SUM ( fDoacoes[Taxa_Intermediador] ),
    KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Confirmado" )
)
```

---

### 3.3. Variação MoM (Month-over-Month) da Arrecadação
- **Objetivo:** Mede a expansão ou contração do fluxo de doações líquidas em relação ao mês anterior. Projetada de forma inteligente para funcionar tanto em **visuais temporais/slicers** quanto em **Cartões de KPI (New Card com Rótulo de Referência)** quando nenhum mês está selecionado.
- **Formatação:** Porcentagem (`+0.00%;-0.00%;0.00%` ou `0.0%`)

```dax
[Arrecadação MoM %] = 
VAR TemMesFiltrado = HASONEVALUE ( dCalendario[AnoMesNum] )

-- Cenário 1: Existe 1 mês no contexto (linha de Matriz, Gráfico temporal ou Slicer selecionado)
VAR MoM_Filtrado = 
    VAR Atual = [Total Arrecadado Líquido]
    VAR Anterior = 
        CALCULATE (
            [Total Arrecadado Líquido],
            DATEADD ( dCalendario[Date], -1, MONTH )
        )
    RETURN
        DIVIDE ( Atual - Anterior, Anterior, BLANK () )

-- Cenário 2: Card Geral sem mês selecionado -> Ancorar no Último Mês com Dados vs Mês Anterior
VAR UltimaDataFato = CALCULATE ( MAX ( fDoacoes[Data_Doacao] ), ALL ( fDoacoes ) )
VAR UltimoAno = YEAR ( UltimaDataFato )
VAR UltimoMes = MONTH ( UltimaDataFato )
VAR UltimoAnoMes = ( UltimoAno * 100 ) + UltimoMes

VAR AnoAnt = IF ( UltimoMes = 1, UltimoAno - 1, UltimoAno )
VAR MesAnt = IF ( UltimoMes = 1, 12, UltimoMes - 1 )
VAR PenultimoAnoMes = ( AnoAnt * 100 ) + MesAnt

VAR ArrecadacaoUltimoMes = 
    CALCULATE (
        [Total Arrecadado Líquido],
        dCalendario[AnoMesNum] = UltimoAnoMes,
        ALL ( dCalendario )
    )
VAR ArrecadacaoPenultimoMes = 
    CALCULATE (
        [Total Arrecadado Líquido],
        dCalendario[AnoMesNum] = PenultimoAnoMes,
        ALL ( dCalendario )
    )

VAR MoM_UltimoMes = 
    DIVIDE ( ArrecadacaoUltimoMes - ArrecadacaoPenultimoMes, ArrecadacaoPenultimoMes, BLANK () )

RETURN
    IF ( TemMesFiltrado, MoM_Filtrado, MoM_UltimoMes )
```

> 💡 **Dica de Visualização (Novo Card / Rótulo de Referência):**
> - Se o usuário selecionar um mês específico no segmentador (ex: `Out/2026`), a medida calcula a variação daquele mês contra o mês anterior (`Set/2026`).
> - Se o painel estiver no estado padrão geral (sem nenhum filtro de mês aplicado), a medida identifica automaticamente o fechamento mais recente (`Out/2026` vs `Set/2026`) e exibe o MoM correto no rótulo de referência, evitando o valor estático `0.0%`!

---

### 3.4. % de Atingimento da Meta de Captação
- **Objetivo:** Compara a arrecadação real contra a meta orçada cadastrada mensalmente para os projetos.
- **Formatação:** Porcentagem (`0.0%`)

```dax
[Meta Captação Orçada] = 
SUM ( fOrcamentoMetas[Meta_Arrecadacao] )
```

```dax
[% Atingimento Meta Captação] = 
VAR Realizado = [Total Arrecadado Líquido]
VAR Meta = [Meta Captação Orçada]
RETURN
    DIVIDE ( 
        Realizado, 
        Meta, 
        0.0 
    )
```

---

### 3.5. Taxa de Retenção e Churn de Doadores Recorrentes
- **Objetivo:** Percentual de doadores mensais/recorrentes ativos em relação ao total cadastrado.
- **Formatação:** Porcentagem (`0.0%`)

```dax
[Doadores Recorrentes Ativos] = 
CALCULATE (
    DISTINCTCOUNT ( fDoacoes[ID_Doador] ),
    fDoacoes[Tipo_Recorrencia] == "Mensalista/Assinatura",
    fDoacoes[Status_Pagamento] == "Confirmado"
)
```

```dax
[Taxa de Retenção Recorrentes %] = 
VAR AtivosRecorrentes = [Doadores Recorrentes Ativos]
VAR TotalBaseDoadores = DISTINCTCOUNT ( dDoadores[ID_Doador] )
RETURN
    DIVIDE ( 
        AtivosRecorrentes, 
        TotalBaseDoadores, 
        0.0 
    )
```

```dax
[% Churn de Doadores] = 
VAR DoadoresInativos = 
    CALCULATE (
        COUNTROWS ( dDoadores ),
        dDoadores[Status_Doador] == "Inativo/Churn"
    )
VAR TotalDoadores = COUNTROWS ( dDoadores )
RETURN
    DIVIDE ( DoadoresInativos, TotalDoadores, 0.0 )
```

---

### 3.6. Ticket Médio por Doador (Geral, PF e PJ)
```dax
[Ticket Médio Doação] = 
DIVIDE ( 
    [Total Arrecadado Líquido], 
    CALCULATE ( COUNTROWS ( fDoacoes ), fDoacoes[Status_Pagamento] = "Confirmado" ), 
    0.0 
)
```

```dax
[Arrecadação PJ (Empresas / Editais)] = 
CALCULATE (
    [Total Arrecadado Líquido],
    dDoadores[Tipo_Doador] == "PJ"
)
```

```dax
[Arrecadação PF (Pessoa Física)] = 
CALCULATE (
    [Total Arrecadado Líquido],
    dDoadores[Tipo_Doador] == "PF"
)
```

---

## 🤝 4. Métricas de Impacto Social e Eficiência (`fAtendimentos` e `fOrcamentoMetas`)

### 4.1. Total de Atendimentos Sociais Realizados
- **Objetivo:** Volume físico total de serviços prestados à população vulnerável.
- **Formatação:** Inteiro (`#,##0`)

```dax
[Total Atendimentos] = 
COUNTROWS ( fAtendimentos )
```

### 4.2. % de Atingimento da Meta de Atendimentos
- **Objetivo:** Cumprimento da meta de impacto programático estipulado pela coordenação de projetos.
- **Formatação:** Porcentagem (`0.0%`)

```dax
[Meta Atendimentos Orçada] = 
SUM ( fOrcamentoMetas[Meta_Atendimentos] )
```

```dax
[% Atingimento Meta Atendimentos] = 
VAR Realizado = [Total Atendimentos]
VAR Meta = [Meta Atendimentos Orçada]
RETURN
    DIVIDE ( 
        Realizado, 
        Meta, 
        0.0 
    )
```

---

### 4.3. Beneficiários Únicos Acolhidos
- **Objetivo:** Contagem de pessoas e famílias distintas que receberam assistência da ONG.
- **Formatação:** Inteiro (`#,##0`)

```dax
[Beneficiários Únicos] = 
DISTINCTCOUNT ( fAtendimentos[ID_Beneficiario] )
```

---

### 4.4. Custo Médio Real por Beneficiário Atendido
- **Objetivo:** Avalia a eficiência do investimento social direto por pessoa atendida.
- **Formatação:** Moeda (`R$ #,##0.00`)

```dax
[Total Custo Atendimentos] = 
SUM ( fAtendimentos[Custo_Estimado_Atendimento] )
```

```dax
[Custo Médio por Beneficiário] = 
VAR CustoTotal = [Total Custo Atendimentos]
VAR PessoasAtendidas = [Beneficiários Únicos]
RETURN
    DIVIDE ( 
        CustoTotal, 
        PessoasAtendidas, 
        0.0 
    )
```

```dax
[Custo Médio por Atendimento] = 
VAR CustoTotal = [Total Custo Atendimentos]
VAR TotalAtd = [Total Atendimentos]
RETURN
    DIVIDE ( 
        CustoTotal, 
        TotalAtd, 
        0.0 
    )
```

---

### 4.5. Horas de Voluntariado Empregadas
- **Objetivo:** Mede a força de trabalho voluntária mobilizada pelas causas da entidade.
- **Formatação:** Decimal (`#,##0.0 h`)

```dax
[Total Horas Voluntariado] = 
SUM ( fAtendimentos[Horas_Voluntariado_Empregadas] )
```

---

### 4.6. Índice de Eficiência de Captação (Valor Arrecadado vs Custo Operacional)
- **Objetivo:** Demonstra quantas vezes a captação financeira cobriu os custos diretos das ações sociais executadas (*Múltiplo de Sustentabilidade*).
- **Formatação:** Decimal (`0.00 x`)

```dax
[Índice de Eficiência de Captação] = 
VAR Arrecadacao = [Total Arrecadado Líquido]
VAR CustosSociais = [Total Custo Atendimentos]
RETURN
    DIVIDE ( 
        Arrecadacao, 
        CustosSociais, 
        0.0 
    )
```

```dax
[Superávit / Reserva de Continuidade] = 
[Total Arrecadado Líquido] - [Total Custo Atendimentos]
```

---

## 🎨 5. Formatação Condicional de Indicadores

### 5.1. Cor para MoM Arrecadação
```dax
[Cor MoM Arrecadação] = 
VAR Variacao = [Arrecadação MoM %]
RETURN
    SWITCH (
        TRUE (),
        ISBLANK ( Variacao ), "#757575",
        Variacao > 0,         "#2E7D32", -- Verde Suave
        Variacao < 0,         "#C62828", -- Vermelho Suave
        "#757575"
    )
```

### 5.2. Cor para Atingimento de Metas (Semáforo 85% / 100%)
```dax
[Cor Atingimento Meta] = 
VAR Atingimento = [% Atingimento Meta Captação]
RETURN
    SWITCH (
        TRUE (),
        ISBLANK ( Atingimento ), "#757575",
        Atingimento >= 1.00,    "#2E7D32", -- Verde (Meta Atingida)
        Atingimento >= 0.85,    "#F39C12", -- Laranja / Alerta
        "#C62828"                          -- Vermelho (Abaixo da Meta)
    )
```
