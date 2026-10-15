# 🍷 Projeto 1: Analytics Comercial & Sazonalidade B2B - Adega & Distribuidora

[![Power BI](https://img.shields.io/badge/Power_BI-Online_Demo-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)](https://app.powerbi.com/view?r=eyJrIjoiNmVhZmZhMDYtOGExZi00MDIyLTg2MmQtMzM3NWFlZmExZjZjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)
[![Modelagem](https://img.shields.io/badge/Modelagem-Star_Schema-blue?style=for-the-badge)](https://github.com)
[![DAX](https://img.shields.io/badge/DAX-Time_Intelligence-green?style=for-the-badge)](https://github.com)

🔗 **[Clique aqui para interagir com o Dashboard Online](https://app.powerbi.com/view?r=eyJrIjoiNmVhZmZhMDYtOGExZi00MDIyLTg2MmQtMzM3NWFlZmExZjZjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)**

---

## 🎯 1. Problema de Negócio & Storytelling

Uma distribuidora de bebidas e adega B2B atende mais de 250 pontos de venda (bares, restaurantes, empórios e conveniências). A operação enfrentava dois gargalos críticos:
1. **Ruptura de Estoque nos Fins de Semana:** Bares e restaurantes concentram seus pedidos de reposição nas quintas, sextas e sábados (*Weekend Rush*). Sem visibilidade antecipada da demanda diária, a distribuidora sofria com custos extras de frete emergencial e falta de produtos.
2. **Conflito Giro vs Margem:** Produtos de alto volume (cervejas mainstream) possuem margens brutas estreitas (28%-32%), enquanto destilados e vinhos entregam margens acima de 40%, porém com giro menor. A diretoria precisava identificar o equilíbrio ideal no mix de produtos.

---

## 🏛️ 2. Arquitetura do Modelo Dimensional (Star Schema)

O modelo foi projetado estritamente no padrão **Star Schema**, garantindo compressão ideal na engine VertiPaq e simplificação de filtros DAX:

- **Fato:** `fVendas` (~5.250 registros de vendas com integridade referencial estrita).
- **Dimensões:**
  - `dClientes`: Cadastro de pontos de venda com tipo de cliente, limite de crédito e UF.
  - `dProdutos`: Mix de bebidas categorizado por tipo de embalagem, custo padrão e preço de tabela.
  - `dCanais`: Venda Direta / Balcão, Representante Externo, E-Commerce B2B / App e Televendas.
  - `dCalendario`: Tabela de datas com hierarquias, dias da semana e sinalizadores de dias de pico.

---

## 💡 3. Principais Métricas em DAX

- **Faturamento Líquido:** `[Total Vendas] = SUM ( fVendas[Valor_Liquido] )`
- **Lucro Bruto:** `[Lucro Bruto] = [Total Vendas] - SUM ( fVendas[Custo_Total] )`
- **Margem de Lucro %:** `[Margem de Lucro %] = DIVIDE ( [Lucro Bruto], [Total Vendas], 0.0 )`
- **Ticket Médio:** `[Ticket Médio] = DIVIDE ( [Total Vendas], DISTINCTCOUNT ( fVendas[ID_Venda] ), 0.0 )`
- **Crescimento MoM %:** Variação percentual frente ao mês anterior via `DATEADD` com tratamento de contexto.
- **Acumulado Anual (YTD):** `TOTALYTD ( [Total Vendas], dCalendario[Date] )`
- **Formatação Condicional:** Medida com código Hexadecimal (`[Cor Vendas MoM]`) que colore automaticamente de verde (crescimento) ou vermelho (queda).

---

## 📈 4. Insights de Negócio Gerados

- **Concentração de Sazonalidade:** **68,6%** de todo o faturamento da empresa se concentra nas **quintas, sextas e sábados**.
- **Canal Mais Eficiente:** Vendas consultivas por **Representantes Externos B2B** lideram o volume absoluto, mas o **E-Commerce B2B (App)** apresentou o maior crescimento percentual e ticket médio mais estável.
- **Eficiência de Precificação:** A margem bruta global consolidou-se em **36,4%**, sustentada pela venda combinada de caixas de cerveja e garrafas de destilados/vinhos.

---

## 📂 Arquivos Disponíveis

- `PowerBI - Adega.pbix`: Arquivo completo para download e inspeção no Power BI Desktop.
- `PowerBI - Adega.htm`: Documentação técnica completa das tabelas, tipos e medidas gerada pelo Power BI Helper.
