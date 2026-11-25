# Portfólio Web — Wand Rherison

Site de portfólio profissional conectando projetos de **Business Intelligence (Power BI)**, **Padaria Diniz (E-commerce + BI/LGPD)** e **ONG Clube Gringas (estritamente via prints visuais)**.

## Como publicar no Render via GitHub

1. Crie um repositório no GitHub (ex.: `WandRherison/portfolio`) e envie esta pasta:
   ```bash
   git add .
   git commit -m "feat: estrutura inicial do site de portfolio"
   git remote add origin https://github.com/WandRherison/portfolio.git
   git push -u origin main
   ```
2. No [Render Dashboard](https://dashboard.render.com/project/prj-daklppnqj5pc73bl95eg/environment/evm-daklppnqj5pc73bl95f0), clique em **New > Static Site** (ou **Blueprint** usando `render.yaml`) e conecte o repositório criado.
