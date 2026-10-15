# 🤝 Projeto 2: Gestão Analítica & Impacto Social - ONG Viva Comunidade

[![Power BI](https://img.shields.io/badge/Power_BI-Online_Demo-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)](https://app.powerbi.com/view?r=eyJrIjoiNTYzNjE5YmYtYWRmMy00YzFhLTg1NWMtOTE5OTAyYmRjOWJlIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)
[![Modelagem](https://img.shields.io/badge/Modelagem-Multi--Fato_(Galaxy)-purple?style=for-the-badge)](https://github.com)
[![Governança](https://img.shields.io/badge/Governança-Transparência_Social-teal?style=for-the-badge)](https://github.com)

🔗 **[Clique aqui para interagir com o Dashboard Online](https://app.powerbi.com/view?r=eyJrIjoiNTYzNjE5YmYtYWRmMy00YzFhLTg1NWMtOTE5OTAyYmRjOWJlIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)**

---

## 🎯 1. Problema de Negócio & Governança

Organizações do terceiro setor enfrentam exigências rigorosas de transparência por parte de doadores individuais, conselhos fiscais e empresas patrocinadoras. Este projeto foi desenvolvido para responder a duas demandas centrais:
1. **Previsibilidade Financeira (*Fundraising*):** Monitorar a entrada de recursos via doadores recorrentes (mensalistas) vs aportes únicos, controlando metas orçamentárias estipuladas por projeto social.
2. **Prestação de Contas do Impacto Social:** Demonstrar com rigor contábil como cada Real arrecadado foi revertido em ações comunitárias concretas (`Alimentação`, `Saúde`, `Capacitação` e `Apoio Jurídico`), apurando o custo médio por atendimento.

---

## 🏛️ 2. Arquitetura Dimensional Multi-Fato (*Galaxy Schema*)

Para integrar a arrecadação financeira e a execução física na ponta sem redundâncias, o projeto implementa o padrão **Galaxy Schema** com duas tabelas fato compartilhando dimensões conformadas:

- **Fato 1 (Captação):** `fDoacoes` (~3.050 doações distribuídas entre 2025 e 2026).
- **Fato 2 (Execução Social):** `fAtendimentos` (~1.520 atendimentos comunitários com custo unitário real).
- **Dimensões Compartilhadas:**
  - `dProjetos`: Catálogo de 6 programas sociais com metas e coordenadores responsáveis.
  - `dCalendario`: Tabela de datas contínua com indicadores de campanhas de Inverno e Natal.
- **Dimensões Específicas:**
  - `dDoadores`: Cadastro com segmentação PF (Pessoa Física) e PJ (Pessoa Jurídica).
  - `dCanais`: Meios de arrecadação (Pix, Cartão de Crédito, Boleto, Transferência).

---

## 💡 3. Principais Métricas em DAX

- **Arrecadação Total Aprovada:**
  ```dax
  [Total Arrecadado] = 
  CALCULATE ( SUM ( fDoacoes[Valor] ), KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Aprovada" ) )
  ```
- **% Atingimento de Meta por Projeto:**
  ```dax
  [% Atingimento da Meta] = DIVIDE ( [Total Arrecadado], SUM ( dProjetos[Meta_Arrecadacao] ), 0.0 )
  ```
- **Custo Médio por Atendimento Social:**
  ```dax
  [Custo Médio Atendimento] = DIVIDE ( SUM ( fAtendimentos[Custo_Atendimento] ), COUNTROWS ( fAtendimentos ), 0.0 )
  ```
- **Fidelização (Doadores Ativos Recorrentes):**
  ```dax
  [Doadores Ativos Recorrentes] = 
  CALCULATE (
      DISTINCTCOUNT ( fDoacoes[ID_Doador] ),
      fDoacoes[Tipo_Doacao] IN { "Recorrente", "Mensal" },
      fDoacoes[Status_Pagamento] = "Aprovada"
  )
  ```
- **Superávit / Reserva de Contingência:** `[Total Arrecadado] - SUM ( fAtendimentos[Custo_Atendimento] )`

---

## 📈 4. Insights de Negócio Gerados

- **Composição da Receita:** Enquanto **Pessoa Física (PF)** responde por **80% do volume de doadores** com tíquetes acessíveis (R$ 20 a R$ 250), **Pessoas Jurídicas (PJ)** aportam os maiores cheques (R$ 1.000 a R$ 15.000), garantindo liquidez imediata.
- **Picos Sazonais de Solidariedade:** As campanhas de **Maio (Mães / Inverno)** e **Dezembro (Natal Solidário)** concentram mais de **28% da captação anual**.
- **Eficiência Operacional:** O projeto **Prato Solidário** entregou o menor custo unitário por atendimento (média de R$ 76,80 por ação de alimentação), maximizando o alcance social dos recursos.

---

## 📂 Arquivos Disponíveis

- `PowerBI - ONG.pbix`: Arquivo completo para download e inspeção no Power BI Desktop.
- `PowerBI - ONG.htm`: Documentação técnica completa das tabelas, tipos e medidas gerada pelo Power BI Helper.
