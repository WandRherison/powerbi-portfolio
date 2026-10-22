# 🥖 Projeto 6: Padaria Diniz (E-commerce Full-Stack, MySQL na AWS RDS & BI com Governança LGPD)

[![Power BI](https://img.shields.io/badge/Power_BI-Online_Demo-F2C811?style=for-the-badge&logo=powerbi&logoColor=black)](https://app.powerbi.com/view?r=eyJrIjoiZjEwNDJjZjgtNzY3NS00NWFjLThhYjEtYjU3YzgzMzA3NmYxIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)
[![Live Web App](https://img.shields.io/badge/Web_App-Live_no_Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://padaria-antigravity.onrender.com/padaria-landinpage.html)
[![MySQL AWS RDS](https://img.shields.io/badge/MySQL_8.0-AWS_RDS_Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://aws.amazon.com/rds/)
[![LGPD](https://img.shields.io/badge/Compliance-LGPD_%26_Least_Privilege-green?style=for-the-badge)](views_powerbi_lgpd.sql)
[![Modelagem](https://img.shields.io/badge/Modelagem-Star_Schema-00599C?style=for-the-badge)](DAX_MEASURES.md)

🔗 **[Clique aqui para interagir com o Dashboard Online](https://app.powerbi.com/view?r=eyJrIjoiZjEwNDJjZjgtNzY3NS00NWFjLThhYjEtYjU3YzgzMzA3NmYxIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9)**  
🌐 **Aplicação Web em Produção:** [**Padaria Diniz | O Sabor Artesanal da Região**](https://padaria-antigravity.onrender.com/padaria-landinpage.html)  
📊 **Arquivo Power BI (.pbix):** [`PowerBI - Padaria Diniz.pbix`](PowerBI%20-%20Padaria%20Diniz.pbix)  
📜 **Script SQL das Views & LGPD:** [`views_powerbi_lgpd.sql`](views_powerbi_lgpd.sql)  
📐 **Catálogo Completo de Medidas DAX:** [`DAX_MEASURES.md`](DAX_MEASURES.md)

---

## 🎯 1. Visão Geral do Projeto

A **Padaria Diniz** é uma solução *End-to-End* de comércio eletrônico e Business Intelligence desenvolvida para modernizar a operação de uma empresa regional do ramo de panificação e confeitaria artesanal. 

O projeto unifica:
1. **Front-End & E-commerce:** Interface moderna e responsiva com vitrine de produtos por setores (Padaria, Confeitaria, Frios, Bebidas, etc.), carrinho de compras inteligente, modal de agendamento de pedidos para a modalidade **"Peça e Retire"** e painéis administrativos para gestão de pedidos e estoque.
2. **Back-End & Banco de Dados em Nuvem:** API RESTful com persistência em banco relacional **MySQL 8.0 hospedado na nuvem AWS (Amazon RDS)**.
3. **Governança de Dados & LGPD:** Camada de views analíticas com *Data Masking* (mascaramento irreversível de CPF, telefone e e-mail) e usuário dedicado com **Princípio do Menor Privilégio (*Least Privilege*)**, impedindo o acesso do Power BI a senhas, hashes ou dados pessoais sensíveis.
4. **Business Intelligence no Power BI:** Modelagem dimensional em **Star Schema**, tabela calendário customizada e catálogo analítico com mais de **30 medidas DAX** cobrindo Faturamento Líquido, CMV, Lucro Real, Margem %, Lead Time/SLA de produção (30 min) e Time Intelligence (MoM e YTD).

---

## 🏛️ 2. Arquitetura da Solução (End-to-End)

```mermaid
flowchart TD
    subgraph FRONTEND["🌐 Camada Web & E-commerce (Render)"]
        LP["Landing Page & Vitrine<br/>(Filtros por Setor & Busca)"]
        CART["Carrinho & Checkout<br/>(Peça e Retire / Imediato)"]
        ADM["Painel Administrativo<br/>(Gestão de Pedidos & Estoque)"]
    end

    subgraph CLOUD_DB["☁️ Banco Transacional (AWS RDS - MySQL 8.0)"]
        T_USERS[("usuarios")]
        T_CLI[("clientes")]
        T_PROD[("produtos")]
        T_SET[("setor")]
        T_PED[("pedidos")]
        T_ITENS[("itens_venda")]
    end

    subgraph LGPD_LAYER["🛡️ Camada de Governança & Segurança (LGPD)"]
        V_FATO["vw_fato_vendas<br/>(Subtotal, Custos, Lead Time)"]
        V_PROD["vw_dim_produtos<br/>(Preço Custo/Venda, Reposição)"]
        V_SET["vw_dim_setor<br/>(Setores Comerciais)"]
        V_CLI["vw_dim_clientes<br/>(Data Masking: CPF, Email, Fone)"]
        SEC_USER["👤 powerbi_user<br/>(GRANT SELECT apenas nas Views)"]
    end

    subgraph BI_LAYER["📊 Camada Analítica (Power BI Desktop & Service)"]
        STAR["Star Schema Dimensional<br/>(Relacionamentos 1:N)"]
        CAL["dCalendario Oficial<br/>(Time Intelligence)"]
        DAX_KPI["Motor DAX<br/>(Lucro Real, SLA 30min, MoM%)"]
        DASH["Dashboards Executivos<br/>(Vendas, Custos, SLA & Estoque)"]
    end

    LP --> CLOUD_DB
    CART --> CLOUD_DB
    ADM --> CLOUD_DB

    CLOUD_DB --> V_FATO
    CLOUD_DB --> V_PROD
    CLOUD_DB --> V_SET
    CLOUD_DB --> V_CLI
    SEC_USER -.->|Conexão Segura| BI_LAYER

    V_FATO --> STAR
    V_PROD --> STAR
    V_SET --> STAR
    V_CLI --> STAR
    CAL --> STAR
    STAR --> DAX_KPI --> DASH
```

---

## 🗄️ 3. Modelagem Dimensional (Star Schema)

No Power BI, as tabelas analíticas foram conectadas no formato **Star Schema** puro, garantindo desempenho de processamento em memória pelo motor VertiPaq:

```mermaid
erDiagram
    vw_dim_clientes ||--o{ vw_fato_vendas : "1:N (codigo_cliente)"
    vw_dim_produtos ||--o{ vw_fato_vendas : "1:N (codigo_produto)"
    vw_dim_setor    ||--o{ vw_fato_vendas : "1:N (codigo_setor)"
    dCalendario     ||--o{ vw_fato_vendas : "1:N (Data = data_pedido_data)"

    vw_fato_vendas {
        int codigo_item PK
        int codigo_pedido FK
        int codigo_cliente FK
        int codigo_produto FK
        int codigo_setor FK
        int quantidade
        float preco_unitario
        float subtotal_venda
        float custo_total
        float lucro_bruto
        datetime data_pedido
        date data_pedido_data FK
        datetime data_hora_atualizacao
        int lead_time_minutos
        string status_pedido
        string tipo_pedido
        string tipo_pagamento
        string origem
        boolean is_excluido
    }

    vw_dim_produtos {
        int codigo_produto PK
        string nome_produto
        float preco_venda
        float preco_custo
        float margem_unitaria
        int codigo_setor
        string nome_setor
        string tipo_venda
        int estoque_atual
        int estoque_minimo
        string status_estoque
        boolean ativo
    }

    vw_dim_setor {
        int codigo_setor PK
        string nome_setor
    }

    vw_dim_clientes {
        int codigo_cliente PK
        string nome_cliente
        string primeiro_nome
        string cpf "MASCARADO (***.XXX.XXX-**)"
        string telefone "MASCARADO (XX *****-XXXX)"
        string email "OFUSCADO (wa***@dominio.com)"
        string tipo_usuario
    }

    dCalendario {
        date Data PK
        int Ano
        int MesNum
        string MesNome
        string MesAno
        int DiaSemanaNum
        string DiaSemanaNome
        string EhFimDeSemana
        int EhDiaUtil
    }
```

---

## 🔒 4. Governança de Dados, Segurança & LGPD

Para estar em total conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** e as melhores práticas corporativas de segurança da informação:

1. **Ofuscação e Anonimização de Dados (*Data Masking*):**
   - O Power BI **não acessa** o número integral de CPF, telefone ou e-mail dos clientes.
   - Regras aplicadas diretamente na view SQL:
     ```sql
     -- Ofuscação de CPF (exibe apenas os dígitos centrais):
     CONCAT('***.', SUBSTRING(c.cpf, 5, 7), '-**') AS cpf
     
     -- Mascaramento de Telefone:
     CONCAT(SUBSTRING(c.telefone, 1, 5), ' *****-', RIGHT(c.telefone, 4)) AS telefone
     
     -- Ofuscação de E-mail:
     CONCAT(LEFT(u.email, 2), '***@', SUBSTRING_INDEX(u.email, '@', -1)) AS email
     ```
2. **Princípio do Menor Privilégio (*Least Privilege*):**
   - O usuário de conexão `powerbi_user` possui permissões estritamente restritas de leitura (`GRANT SELECT`) nas 4 views analíticas.
   - Tabelas contendo senhas, credenciais de autenticação, tokens ou dados operacionais brutos são **completamente inacessíveis** para o conector do BI.

---

## 📊 5. Principais Indicadores e Métricas DAX

O modelo conta com mais de 30 medidas estruturadas organizadas em pastas temáticas no arquivo [`DAX_MEASURES.md`](DAX_MEASURES.md):

| Grupo Temático | Principais Medidas DAX | Objetivo de Negócio |
| :--- | :--- | :--- |
| **Faturamento** | `[Receita Bruta]`, `[Receita Faturada]`, `[Receita em Aberto]`, `[Receita Cancelada]` | Visibilidade da esteira de pedidos: retirados, em produção e perdas financeiras por cancelamento. |
| **Lucratividade** | `[Custo Total (CMV)]`, `[Lucro Real]`, `[Margem de Lucro Real %]`, `[Markup Médio %]` | Análise real de rentabilidade deduzindo os insumos de panificação e confeitaria. |
| **SLA & Operação** | `[Lead Time Médio de Preparo]`, `[Meta Lead Time (30 min)]`, `[% Pedidos no Prazo]` | Monitoramento da velocidade da cozinha/balcão para garantir que o cliente não espere além do acordado. |
| **Peça e Retire** | `[Qtd Pedidos Agendados]`, `[Qtd Agendados para Hoje]` | Previsão de demanda diária para a equipe de produção do turno matutino/vespertino. |
| **Time Intelligence** | `[Receita Mês Anterior]`, `[Crescimento MoM %]`, `[Receita YTD]` | Comparabilidade temporal de evolução da microempresa. |
| **Estoque** | `[Estoque Total]`, `[Qtd Produtos Esgotados]`, `[Qtd Produtos em Alerta]` | Prevenção de rupturas em produtos de alto giro (ex.: pão francês, queijo muçarela). |

### Destaque de DAX: Eficiência de SLA (Lead Time de Preparo)

```dax
% Pedidos no Prazo = 
VAR MetaMinutos = [Meta Lead Time] -- SLA acordado: 30 minutos
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

## 🛠️ 6. Como Executar e Replicar

1. **Interagir com o Dashboard Online:**
   - Acesse o relatório publicado no [Power BI Service](https://app.powerbi.com/view?r=eyJrIjoiZjEwNDJjZjgtNzY3NS00NWFjLThhYjEtYjU3YzgzMzA3NmYxIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9) para testar os filtros dinâmicos de setor, KPIs de faturamento e análise de SLA de preparo.
2. **Acessar a Aplicação Web:**
   - Navegue até [Padaria Diniz Online](https://padaria-antigravity.onrender.com/padaria-landinpage.html) para experimentar o catálogo de produtos, o fluxo de pedidos e o design da interface.
3. **Executar o Script SQL no Banco:**
   - Execute o script [`views_powerbi_lgpd.sql`](views_powerbi_lgpd.sql) em seu ambiente MySQL para provisionar as views e o usuário analítico.
4. **Explorar o Arquivo Power BI (.pbix):**
   - Abra o arquivo [`PowerBI - Padaria Diniz.pbix`](PowerBI%20-%20Padaria%20Diniz.pbix) no **Power BI Desktop**.
   - Os dados já estão importados e o modelo relacional está configurado com todas as medidas, formatações e colunas calculadas de calendário.
