window.PORTFOLIO_CASES = {
  adega: {
    code: 'CASE 01 // STAR SCHEMA · B2B',
    title: 'Adega & Distribuidora de Bebidas',
    subtitle: 'Analytics Comercial & Sazonalidade B2B',
    dashboardUrl: 'https://app.powerbi.com/view?r=eyJrIjoiNmVhZmZhMDYtOGExZi00MDIyLTg2MmQtMzM3NWFlZmExZjZjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9',
    highlights: [
      { value: '~5.250', label: 'Pedidos validados (Python)' },
      { value: '68,6%', label: 'Receita no Weekend Rush' },
      { value: '36,4%', label: 'Margem Bruta Global' },
      { value: '250+', label: 'Pontos de Venda B2B' }
    ],
    businessContext: [
      'Distribuidora de bebidas B2B atendendo mais de 250 pontos de venda (bares, restaurantes, empórios e conveniências).',
      'Ruptura de Estoque nos Fins de Semana: bares e restaurantes concentram pedidos de reposição em quintas, sextas e sábados (Weekend Rush), gerando custos extras de frete emergencial e falta de produtos sem visibilidade antecipada.',
      'Conflito Giro vs. Margem: cervejas mainstream entregam alto giro com margens estreitas (28%–32%), enquanto destilados e vinhos superam 40% de margem com menor giro.'
    ],
    insights: [
      'Concentração de Sazonalidade: 68,6% de todo o faturamento da empresa se concentra nas quintas, sextas e sábados.',
      'Canal Mais Eficiente: Representantes Externos B2B lideram o volume absoluto, mas o E-Commerce B2B (App) apresentou o maior crescimento percentual e ticket médio mais estável.',
      'Eficiência de Precificação: margem bruta global consolidada em 36,4%, equilibrando caixas de cerveja e destilados/vinhos.'
    ],
    architecture: 'Modelagem estritamente em Star Schema, otimizando compressão na engine VertiPaq e simplificando filtros DAX.',
    tables: [
      { role: 'FATO', name: 'fVendas', desc: '~5.250 registros de vendas com integridade referencial estrita (Valor_Liquido, Custo_Total, ID_Venda).' },
      { role: 'DIMENSÃO', name: 'dClientes', desc: 'Cadastro de pontos de venda com tipo de cliente, limite de crédito e UF.' },
      { role: 'DIMENSÃO', name: 'dProdutos', desc: 'Mix de bebidas categorizado por embalagem, custo padrão e preço de tabela.' },
      { role: 'DIMENSÃO', name: 'dCanais', desc: 'Venda Direta / Balcão, Representante Externo, E-Commerce B2B / App e Televendas.' },
      { role: 'DIMENSÃO', name: 'dCalendario', desc: 'Tabela de datas com hierarquias, dias da semana e sinalizadores de pico.' }
    ],
    daxMeasures: [
      {
        name: 'Faturamento Líquido & Lucro Bruto',
        code: '[Total Vendas] = SUM ( fVendas[Valor_Liquido] )\n[Lucro Bruto] = [Total Vendas] - SUM ( fVendas[Custo_Total] )'
      },
      {
        name: 'Margem de Lucro % & Ticket Médio',
        code: '[Margem de Lucro %] = DIVIDE ( [Lucro Bruto], [Total Vendas], 0.0 )\n[Ticket Médio] = DIVIDE ( [Total Vendas], DISTINCTCOUNT ( fVendas[ID_Venda] ), 0.0 )'
      },
      {
        name: 'Time Intelligence (YTD, MoM % & Cor Dinâmica)',
        code: '[Vendas YTD] = TOTALYTD ( [Total Vendas], dCalendario[Date] )\n-- Crescimento MoM % via DATEADD com tratamento de contexto\n-- [Cor Vendas MoM]: código Hexadecimal automático (verde/vermelho)'
      }
    ]
  },

  'ong-viva': {
    code: 'CASE 02 // GALAXY SCHEMA · TERCEIRO SETOR',
    title: 'ONG Viva Comunidade',
    subtitle: 'Gestão Analítica & Impacto Social (Multi-Fato)',
    dashboardUrl: 'https://app.powerbi.com/view?r=eyJrIjoiNTYzNjE5YmYtYWRmMy00YzFhLTg1NWMtOTE5OTAyYmRjOWJlIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9',
    highlights: [
      { value: '~3.050', label: 'Doações (2025–2026)' },
      { value: '~1.520', label: 'Atendimentos Sociais' },
      { value: '80% PF', label: 'Volume de Doadores' },
      { value: 'R$ 76,80', label: 'Menor Custo/Atendimento' }
    ],
    businessContext: [
      'Organizações do terceiro setor enfrentam altas exigências de transparência de doadores individuais, conselhos fiscais e patrocinadores corporativos.',
      'Previsibilidade Financeira (Fundraising): monitorar entrada de doadores recorrentes (mensalistas) vs. aportes únicos frente às metas orçamentárias por projeto.',
      'Prestação de Contas do Impacto Social: demonstrar com rigor contábil como cada Real arrecadado foi revertido em ações concretas (Alimentação, Saúde, Capacitação e Apoio Jurídico).'
    ],
    insights: [
      'Composição da Receita: Pessoas Físicas (PF) respondem por 80% do volume de doadores (R$ 20 a R$ 250), enquanto Pessoas Jurídicas (PJ) aportam os maiores cheques (R$ 1.000 a R$ 15.000), garantindo liquidez.',
      'Picos Sazonais de Solidariedade: campanhas de Maio (Mães / Inverno) e Dezembro (Natal Solidário) concentram mais de 28% da captação anual.',
      'Eficiência Operacional: o projeto Prato Solidário entregou o menor custo unitário por atendimento (média de R$ 76,80 por ação de alimentação).'
    ],
    architecture: 'Arquitetura Multi-Fato (Galaxy Schema) integrando captação financeira e execução social através de dimensões conformadas sem relacionamentos N:N.',
    tables: [
      { role: 'FATO 1', name: 'fDoacoes', desc: '~3.050 doações entre 2025 e 2026 (Valor, Tipo_Doacao, Status_Pagamento).' },
      { role: 'FATO 2', name: 'fAtendimentos', desc: '~1.520 atendimentos comunitários com custo unitário real.' },
      { role: 'COMPARTILHADA', name: 'dProjetos', desc: 'Catálogo de 6 programas sociais com metas e coordenadores responsáveis.' },
      { role: 'COMPARTILHADA', name: 'dCalendario', desc: 'Datas contínuas com indicadores de campanhas sazonais (Inverno e Natal).' },
      { role: 'ESPECÍFICA', name: 'dDoadores & dCanais', desc: 'Segmentação PF/PJ e meios de arrecadação (Pix, Cartão, Boleto, Transferência).' }
    ],
    daxMeasures: [
      {
        name: 'Arrecadação Total Aprovada',
        code: '[Total Arrecadado] =\nCALCULATE (\n    SUM ( fDoacoes[Valor] ),\n    KEEPFILTERS ( fDoacoes[Status_Pagamento] = "Aprovada" )\n)'
      },
      {
        name: '% Atingimento de Meta & Custo Médio por Atendimento',
        code: '[% Atingimento da Meta] = DIVIDE ( [Total Arrecadado], SUM ( dProjetos[Meta_Arrecadacao] ), 0.0 )\n[Custo Médio Atendimento] = DIVIDE ( SUM ( fAtendimentos[Custo_Atendimento] ), COUNTROWS ( fAtendimentos ), 0.0 )'
      },
      {
        name: 'Doadores Ativos Recorrentes & Superávit',
        code: '[Doadores Ativos Recorrentes] =\nCALCULATE (\n    DISTINCTCOUNT ( fDoacoes[ID_Doador] ),\n    fDoacoes[Tipo_Doacao] IN { "Recorrente", "Mensal" },\n    fDoacoes[Status_Pagamento] = "Aprovada"\n)\n-- Superávit = [Total Arrecadado] - SUM ( fAtendimentos[Custo_Atendimento] )'
      }
    ]
  },

  petshop: {
    code: 'CASE 03 // STAR SCHEMA · CUSTOMER ANALYTICS',
    title: 'PetShop Gatitos & Cia',
    subtitle: 'Varejo Especializado & Comportamento do Consumidor',
    dashboardUrl: 'https://app.powerbi.com/view?r=eyJrIjoiZjhhODBjZTctYTI0My00ZDE4LTgwNzctMGZjZWM1OTU0MDRjIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9',
    highlights: [
      { value: '+45%', label: 'Ticket Médio Multi-Pet' },
      { value: '>60%', label: 'Receita em 3 Bairros' },
      { value: '5 Cat.', label: 'Mix Pet Completo' },
      { value: 'Power Query', label: 'ETL & Imagens Dinâmicas' }
    ],
    businessContext: [
      'A rede Gatitos & Cia atua em múltiplas categorias (Alimentação, Brinquedos, Higiene, Medicamentos e Acessórios) e precisava mapear o comportamento real de seus tutores.',
      'Perfil Demográfico: entender como quantidade de pets (1 pet vs. múltiplos pets), estado civil e bairro impactam ticket médio e recorrência.',
      'Desempenho de Marcas & Cestas: identificar quais marcas sustentam o faturamento e padrões de compra combinada.'
    ],
    insights: [
      'Efeito Multi-Pet: tutores com 2 ou mais pets apresentam ticket médio 45% superior aos de único animal, com foco em compras recorrentes de rações de grande porte.',
      'Concentração Geográfica: três bairros principais concentram mais de 60% da receita, permitindo campanhas geolocalizadas e fidelidade direcionada.',
      'Liderança por Categoria: Alimentos e Petiscos lideram o volume de recompra, enquanto Acessórios e Farmácia Pet entregam maior valor médio unitário.'
    ],
    architecture: 'Star Schema consolidando dados transacionais e cadastrais tratados via Power Query (M), incluindo URLs dinâmicas de produtos nos visuais do Power BI.',
    tables: [
      { role: 'FATO', name: 'Vendas', desc: 'Transacao, Data de compra, ID Consumidor (FK), ID Produto (FK) e Quantidade.' },
      { role: 'DIMENSÃO', name: 'Clientes', desc: 'ID Consumidor, Gênero, Estado civil, Pets (qtd. sob tutela) e Bairro.' },
      { role: 'DIMENSÃO', name: 'Produtos', desc: 'ID Produto, Nome produto, Categoria, Marca, Valor unitário e Url img.' },
      { role: 'DIMENSÃO', name: 'dCalendario', desc: 'Datas contínuas para análises mensais, semanais e sazonalidade.' }
    ],
    daxMeasures: [
      {
        name: 'Faturamento Total (Iterador SUMX + RELATED)',
        code: '[Faturamento Total] =\nSUMX (\n    Vendas,\n    Vendas[Quantidade] * RELATED ( Produtos[Valor] )\n)'
      },
      {
        name: 'Transações & Ticket Médio por Consumidor',
        code: '[Total Transações] = DISTINCTCOUNT ( Vendas[Transacao] )\n[Ticket Médio por Cliente] = DIVIDE ( [Faturamento Total], DISTINCTCOUNT ( Vendas[ID Consumidor] ), 0.0 )'
      },
      {
        name: 'Volume Físico & Média de Pets',
        code: '[Total Itens Vendidos] = SUM ( Vendas[Quantidade] )\n[Média de Pets] = AVERAGE ( Clientes[Pets] )'
      }
    ]
  },

  supplychain: {
    code: 'CASE 04 // ROLE-PLAYING STAR SCHEMA · LOGÍSTICA',
    title: 'Supply Chain & Logística Omnichannel',
    subtitle: 'Torre de Controle, OTIF, SLAs & Rentabilidade de Frete',
    dashboardUrl: 'https://app.powerbi.com/view?r=eyJrIjoiNTg3Y2Y5ZGItNmI5OS00Mzk4LWI0NTMtZjVhOGMzYmRkMGU3IiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9',
    highlights: [
      { value: '8.150', label: 'Pedidos Omnichannel' },
      { value: '84,6%', label: 'OTIF Global (Meta 85%)' },
      { value: '15,37%', label: 'Taxa Média de Atraso' },
      { value: '4 Datas', label: 'Role-Playing Calendar' }
    ],
    businessContext: [
      'Operação de Varejo Omnichannel e Logística de E-commerce integrando 4 Centros de Distribuição (Cajamar-SP, Extrema-MG, Gravataí-RS e Cabo Santo Agostinho-PE), 5 transportadoras e vendas B2C/B2B.',
      'Gargalo dos Atrasos: taxa média de atraso de 15,37%, saltando para quase 25% nos picos de Black Friday e Natal.',
      'Trade-off do Frete Grátis: pedidos acima de R$ 350 com itens pesados saindo de Cajamar (SP) para Norte/Nordeste geram fretes acima de R$ 180, consumindo até 70% da margem bruta.'
    ],
    insights: [
      'Scorecard de Transportadoras: AeroCargo Brasil entrega 95,8% de OTIF (1,0 dia, frete R$ 74,50), LogBrasil Express entrega 89,4% (2,1 dias, R$ 28,40) e TransRodoviário cai para 78,2% em rotas longas.',
      'Rentabilidade Regional: Sudeste entrega 36% de margem pós-logística, enquanto Norte/Nordeste recua para 21% devido ao subsídio de frete (-R$ 380,2 mil).',
      'Arquitetura em 3 Páginas: (1) Torre de Controle & SLA, (2) Rentabilidade & Subsídio de Frete e (3) Scorecard de Transportadoras com Quadrante Mágico OTIF vs. Custo.'
    ],
    architecture: 'Star Schema com Role-Playing Dimension: uma única tabela dCalendario estabelece 4 relacionamentos com fPedidos (1 ativo em Data_Pedido e 3 inativos em Data_Envio, Data_Previsao_Entrega e Data_Entrega_Real, ativados via USERELATIONSHIP).',
    tables: [
      { role: 'FATO', name: 'fPedidos', desc: '8.150 pedidos com 4 chaves de data, Valor_Bruto, Desconto, Valor_Frete_Cobrado, Custo_Frete_Real e Status_Pedido.' },
      { role: 'DIMENSÃO', name: 'dCentrosDistribuicao', desc: '4 hubs logísticos (SP, MG, RS, PE) com capacidade de armazenagem.' },
      { role: 'DIMENSÃO', name: 'dTransportadoras', desc: 'Operadoras logísticas, Modal (Expresso, Rodoviário, Aéreo) e SLA contratado.' },
      { role: 'DIMENSÃO', name: 'dProdutos & dClientes', desc: 'Peso_Kg, CMV, Preco_Tabela e segmentação B2C/B2B por UF/Região.' },
      { role: 'ROLE-PLAYING', name: 'dCalendario', desc: '1 relacionamento ativo (Data_Pedido) + 3 inativos para análises de expedição e entrega.' }
    ],
    daxMeasures: [
      {
        name: 'Relacionamentos Role-Playing (USERELATIONSHIP)',
        code: '-- Contexto padrão: Data_Pedido (Ativo)\n-- [Faturamento Despachado]: USERELATIONSHIP ( dCalendario[Date], fPedidos[Data_Envio] )\n-- [Faturamento Entregue]: USERELATIONSHIP ( dCalendario[Date], fPedidos[Data_Entrega_Real] )'
      },
      {
        name: 'KPIs de Torre de Controle & Financeiro',
        code: 'OTIF % (No Prazo): 84,6% vs Meta 85%\nLead Time Médio (Porta a Porta): 5,8 Dias (Expedição CD + Trânsito)\nMargem de Contribuição Pós-Logística: Faturamento Líquido - CMV - Custo Frete Real'
      }
    ]
  },

  'ong-multi': {
    code: 'CASE 05 // CONSTELLATION SCHEMA · 3 FATOS',
    title: 'ONG Multi-Programas',
    subtitle: 'Captação, Orçamento Mensal & Impacto Social',
    dashboardUrl: 'https://app.powerbi.com/view?r=eyJrIjoiOTQyODQ1ZGItN2I4Mi00ZTVhLWE1ZTctODYxOGI1M2ZjNzg1IiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9',
    highlights: [
      { value: '3 Fatos', label: 'Constellation Schema' },
      { value: '3.550', label: 'Atendimentos Realizados' },
      { value: '1.200', label: 'Beneficiários Únicos' },
      { value: '8.420h', label: 'Horas de Voluntariado' }
    ],
    businessContext: [
      'Ambiente analítico de grande porte conectando três pilares independentes do terceiro setor: captação financeira, planejamento orçamentário mensal e execução de impacto social em campo.',
      'Permite à Diretoria Executiva cruzar realizado vs. meta mensal por programa, taxa retida por intermediadores de pagamento e churn de doadores.',
      'Oferece prestação de contas auditável ao Conselho Fiscal e patrocinadores PJ sobre beneficiários únicos e horas de voluntariado mobilizadas.'
    ],
    insights: [
      'Página 1 (Saúde Financeira & Fundraising): acompanha Arrecadação Líquida confirmada, Ticket Médio (Geral vs. PJ), % Atingimento de Meta, % Churn mensal e impacto das taxas por canal (Pix, Cartão, Edital).',
      'Página 2 (Execução Social & Prestação de Contas): monitora 3.550 atendimentos, 1.200 beneficiários únicos, custo médio de R$ 178,40 por pessoa atendida e 8.420 horas de voluntariado.',
      'Mapeamento de Vulnerabilidade: distribuição territorial por Zona (Norte, Sul, Leste, Oeste e Rural) e área de foco (Infância, Saúde, Profissionalização e Moradia).'
    ],
    architecture: 'Constellation Schema (Multi-Fato) com 3 tabelas fato (fDoacoes, fAtendimentos e fOrcamentoMetas ancorada no dia 01 de cada mês) compartilhando 5 dimensões conformadas em 1:N.',
    tables: [
      { role: 'FATO 1', name: 'fDoacoes', desc: 'Valor_Bruto, Taxa_Intermediador, Valor_Liquido, Tipo_Recorrencia e Status_Pagamento.' },
      { role: 'FATO 2', name: 'fAtendimentos', desc: 'ID_Beneficiario anonimizado, Tipo_Servico, Custo_Estimado e Horas_Voluntariado.' },
      { role: 'FATO 3', name: 'fOrcamentoMetas', desc: 'Granularidade mensal (YYYY-MM-01) com Meta_Arrecadacao, Meta_Atendimentos e Orcamento_Teto_Custos.' },
      { role: 'DIMENSÕES', name: 'dProjetos · dDoadores · dCanais · dRegioes · dCalendario', desc: 'Dimensões conformadas com áreas de foco, perfil PF/PJ, taxas de canal, zonas geográficas e campanhas sazonais.' }
    ],
    daxMeasures: [
      {
        name: 'Pipeline & Integridade Referencial',
        code: '# Geração autônoma de datasets com 100% de integridade referencial\npython generate_ong_multiprogram_data.py\n-- Relacionamento estrito 1:N entre fOrcamentoMetas[Data_Meta] e dCalendario[Date]'
      },
      {
        name: 'Cruzamento Multi-Fato',
        code: '-- Arrecadação Líquida Realizada (fDoacoes) vs Meta Orçada Mensal (fOrcamentoMetas)\n-- Execução de Custos (fAtendimentos) vs Teto Orçamentário por Projeto'
      }
    ]
  },

  padaria: {
    code: 'CASE 06 // END-TO-END · MYSQL CLOUD & LGPD',
    title: 'Padaria Diniz: E-commerce & BI com LGPD',
    subtitle: 'Full-Stack, MySQL AWS RDS, Data Masking & 30+ Medidas DAX',
    dashboardUrl: 'https://app.powerbi.com/view?r=eyJrIjoiZjEwNDJjZjgtNzY3NS00NWFjLThhYjEtYjU3YzgzMzA3NmYxIiwidCI6IjBhMGE3YmMxLWUxYTEtNDNjOS04MGYwLTY0YzEyMzVjY2M0OSJ9',
    liveAppUrl: 'https://padaria-antigravity.onrender.com/padaria-landinpage.html',
    highlights: [
      { value: '160+', label: 'Itens no Catálogo' },
      { value: '30+', label: 'Medidas DAX' },
      { value: '30 min', label: 'Meta SLA Preparo' },
      { value: 'LGPD', label: 'Data Masking SQL' }
    ],
    businessContext: [
      'Projeto Integrador UNISAL 2026 em parceria real com a Padaria Diniz (Hortolândia-SP), modernizando um comércio que operava apenas com cartazes físicos e boca a boca.',
      'Front-End & Back-End: e-commerce responsivo acessível (WCAG 2.1 AA) com agendamento "Peça e Retire", transações ACID em Node.js/Express e persistência em MySQL 8.0 na AWS RDS com Soft Delete para preservar histórico analítico.',
      'Governança LGPD: o Power BI conecta-se exclusivamente via usuário dedicado (powerbi_user) com GRANT SELECT restrito a 4 views mascaradas, sem acesso a senhas, hashes ou CPFs/telefones integrais.'
    ],
    insights: [
      'Faturamento & Lucratividade: visibilidade completa de Receita Bruta, Faturada, em Aberto, Cancelada, CMV, Lucro Real, Margem Real % e Markup Médio %.',
      'SLA & Operação ("Peça e Retire"): cálculo automático de Lead Time de preparo em minutos com meta de 30 min e previsão de demanda agendada por turno.',
      'Gestão de Estoque: monitoramento de itens esgotados e em alerta mínimo em produtos de alto giro (ex.: pão francês, frios e confeitaria).'
    ],
    architecture: 'Pipeline End-to-End: Web App (Render) -> MySQL 8.0 (AWS RDS) -> Camada LGPD (4 Views SQL + powerbi_user Least Privilege) -> Power BI Star Schema + dCalendario oficial.',
    tables: [
      { role: 'VIEW FATO', name: 'vw_fato_vendas', desc: 'subtotal_venda, custo_total, lucro_bruto, lead_time_minutos, status_pedido, forma_pagto e is_excluido (Soft Delete).' },
      { role: 'VIEW DIM', name: 'vw_dim_produtos', desc: 'preco_venda, preco_custo, margem_unitaria, setor, estoque_atual, estoque_minimo e status_estoque.' },
      { role: 'VIEW DIM', name: 'vw_dim_clientes (LGPD)', desc: 'CPF mascarado (***.XXX.XXX-**), telefone mascarado (XX *****-XXXX) e e-mail ofuscado (wa***@dominio.com).' },
      { role: 'VIEW DIM', name: 'vw_dim_setor & dCalendario', desc: 'Setores comerciais e calendário oficial para Time Intelligence (MoM%, YTD, dias úteis/fim de semana).' }
    ],
    daxMeasures: [
      {
        name: 'Data Masking SQL (Conformidade LGPD)',
        code: "-- Ofuscação de CPF, Telefone e E-mail direto na View SQL:\nCONCAT('***.', SUBSTRING(c.cpf, 5, 7), '-**') AS cpf,\nCONCAT(SUBSTRING(c.telefone, 1, 5), ' *****-', RIGHT(c.telefone, 4)) AS telefone,\nCONCAT(LEFT(u.email, 2), '***@', SUBSTRING_INDEX(u.email, '@', -1)) AS email"
      },
      {
        name: 'Eficiência de SLA (% Pedidos no Prazo - 30 min)',
        code: '% Pedidos no Prazo =\nVAR MetaMinutos = [Meta Lead Time] -- SLA acordado: 30 minutos\nRETURN\nDIVIDE (\n    CALCULATE (\n        DISTINCTCOUNT ( vw_fato_vendas[codigo_pedido] ),\n        vw_fato_vendas[status_pedido] = "Finalizado",\n        vw_fato_vendas[is_excluido] = FALSE (),\n        FILTER ( vw_fato_vendas, vw_fato_vendas[lead_time_minutos] <= MetaMinutos )\n    ),\n    [Qtd Pedidos Finalizados],\n    0.0\n)'
      }
    ]
  }
};
