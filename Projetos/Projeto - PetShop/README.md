# 🐾 Projeto 3: Varejo Especializado & Customer Analytics - PetShop Gatitos

[![Power BI](https://img.shields.io/badge/Power_BI-Online_Demo-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)](https://app.powerbi.com/view?r=eyJrIjoiZjhhODBjZTctYTI0My00ZDE4LTgwNzctMGZjZWM1OTU0MDRjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)
[![Varejo](https://img.shields.io/badge/Segmento-Varejo_Pet-orange?style=for-the-badge)](https://github.com)
[![Customer Analytics](https://img.shields.io/badge/Analytics-Comportamento_do_Consumidor-blue?style=for-the-badge)](https://github.com)

🔗 **[Clique aqui para interagir com o Dashboard Online](https://app.powerbi.com/view?r=eyJrIjoiZjhhODBjZTctYTI0My00ZDE4LTgwNzctMGZjZWM1OTU0MDRjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)**

---

## 🎯 1. Problema de Negócio & Storytelling

O mercado pet é um dos setores de maior expansão no varejo físico e digital. A rede **Gatitos & Cia** comercializa produtos em múltiplas categorias (Alimentação, Brinquedos, Higiene, Medicamentos e Acessórios) e necessitava compreender profundamente:
1. **Perfil Demográfico e Comportamento dos Tutores:** Quem são os clientes mais rentáveis? Como a quantidade de pets por tutor (1 pet vs múltiplos pets), estado civil e localização geográfica (bairros) impactam o ticket médio e a frequência de compra?
2. **Desempenho de Marcas e Categorias:** Quais marcas apresentam a maior penetração de mercado e quais produtos sustentam o faturamento da loja?
3. **Cestas de Compras e Transações:** Identificar tendências de compra combinada e evolução temporal das vendas diárias e mensais.

---

## 🏛️ 2. Arquitetura do Modelo Dimensional (Star Schema)

O projeto consolida dados transacionais e cadastrais tratados via **Power Query (M)**:

- **Fato Vendas:**
  - `Transacao`: Identificador único da transação comercial.
  - `Data de compra`: Data do pedido.
  - `ID Consumidor`: Chave estrangeira para a dimensão de clientes.
  - `ID Produto`: Chave estrangeira para o catálogo de produtos.
  - `Quantidade`: Volume de unidades adquiridas.
- **Dimensão Clientes:**
  - `ID Consumidor`, `Gênero`, `Estado civil`, `Pets` (quantidade de animais de estimação sob tutela) e `Bairro`.
- **Dimensão Produtos:**
  - `ID Produto`, `Nome produto`, `Categoria`, `Marca`, `Valor` (preço unitário de venda) e `Url img` (suporte a imagens dinâmicas nos cartões do Power BI).
- **Dimensão Calendário:**
  - Datas contínuas permitindo análises mensais, semanais e de sazonalidade de compras.

---

## 💡 3. Principais Métricas em DAX

- **Faturamento Total de Vendas:**
  ```dax
  [Faturamento Total] = 
  SUMX ( 
      Vendas, 
      Vendas[Quantidade] * RELATED ( Produtos[Valor] ) 
  )
  ```
- **Quantidade de Transações:**
  ```dax
  [Total Transações] = DISTINCTCOUNT ( Vendas[Transacao] )
  ```
- **Ticket Médio por Consumidor:**
  ```dax
  [Ticket Médio por Cliente] = 
  DIVIDE ( [Faturamento Total], DISTINCTCOUNT ( Vendas[ID Consumidor] ), 0.0 )
  ```
- **Volume Físico de Itens Comercializados:**
  ```dax
  [Total Itens Vendidos] = SUM ( Vendas[Quantidade] )
  ```
- **Média de Pets por Cliente Ativo:**
  ```dax
  [Média de Pets] = AVERAGE ( Clientes[Pets] )
  ```

---

## 📈 4. Insights de Negócio Gerados

- **Efeito 'Multi-Pet' no Ticket Médio:** Tutores com 2 ou mais pets apresentam um ticket médio **45% superior** aos tutores de um único animal, com compras recorrentes focadas em rações de grande porte (fardos).
- **Concentração Geográfica por Bairro:** Três bairros principais concentram mais de 60% da receita da loja, permitindo direcionar campanhas de tráfego pago geolocalizadas e programas de fidelidade específicos.
- **Liderança por Categoria:** Alimentos e Petiscos lideram o volume transacional de recompra, enquanto Acessórios e Farmácia Pet entregam os maiores valores médios por unidade.

---

## 📂 Arquivos Disponíveis

- `PowerBI - PetShop.pbix`: Arquivo completo para download e inspeção no Power BI Desktop.
- `PowerBI - PetShop.htm`: Documentação técnica completa das tabelas, tipos e medidas gerada pelo Power BI Helper.
