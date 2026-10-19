# 🗡️ Catálogo de Medidas DAX - RPG Dungeon Crawler no Power BI

Este catálogo documenta a medida DAX **`[RPG_HTML_Engine]`**, corrigida e blindada para execução no visual certificado **HTML Content** (por Daniel Marsh-Patrick) no Power BI Desktop e Power BI Service.

---

## 🎮 1. A Medida Motor Corrigida: `[RPG_HTML_Engine]`

### 🛠️ Correções Técnicas Aplicadas nesta Versão:
1. **Eliminação de `VAR` dentro de `CONCATENATEX`:** No DAX do Power BI Desktop, declarar variáveis `VAR` no argumento de expressão de iteradores gera erro de sintaxe (*Token inesperado 'VAR'*). A nova sintaxe usa `LOOKUPVALUE` direto e inline, sendo 100% válida e funcionando mesmo que o relacionamento não tenha sido criado.
2. **Substituição de `alert()` por HUD de Combate In-Game:** O visual *HTML Content* roda dentro de um `<iframe>` restrito (*sandboxed*) sem a permissão `allow-modals`. Chamar `alert()` causava bloqueio silencioso do navegador. Agora, as mensagens de batalha, dano recebido e vitória/derrota são renderizadas em tempo real diretamente no HUD e no Canvas!
3. **Persistência Segura (*Safe Storage*):** O acesso a `localStorage` agora possui tratamento com `try/catch` e fallback para memória `window`, impedindo que políticas de segurança corporativas do Power BI causem `SecurityError`.
4. **Controles Híbridos (Teclado + Botões Direcionais D-Pad):** Além das setas direcionais e WASD, foram inseridos botões na barra do HUD para permitir jogar via clique do mouse ou toque na tela (Power BI Mobile).
5. **Fallback de Sprites Retro:** Caso haja lentidão no carregamento das imagens externas, o Canvas desenha instantaneamente tokens medievais estilizados com as siglas (`GUE`, `MAG`, `SLI`, `GOB`, `BOSS`).

---

```dax
RPG_HTML_Engine = 
-- 1. Captura dinâmica dos atributos do Herói selecionado no Slicer de dHerois
VAR _HeroiAtual = SELECTEDVALUE ( dHerois[Nome], "Guerreiro" )
VAR _HeroiHP = CALCULATE ( MAX ( dHerois[HP_Maximo] ), dHerois[Nome] = _HeroiAtual )
VAR _HeroiAtk = CALCULATE ( MAX ( dHerois[Ataque] ), dHerois[Nome] = _HeroiAtual )
VAR _HeroiDef = CALCULATE ( MAX ( dHerois[Defesa] ), dHerois[Nome] = _HeroiAtual )
VAR _HeroiImg = CALCULATE ( MAX ( dHerois[Sprite] ), dHerois[Nome] = _HeroiAtual )

-- 2. Constrói o array JSON de monstros lendo a tabela fMapa_Spawns (Sintaxe 100% válida sem VAR interno)
VAR _MonstrosJSON = 
    "[" & 
    CONCATENATEX (
        fMapa_Spawns,
        "{id: " & fMapa_Spawns[ID_Spawn] & 
        ", idMonstro: " & fMapa_Spawns[ID_Monstro] & 
        ", nome: '" & LOOKUPVALUE ( dMonstros[Nome], dMonstros[ID_Monstro], fMapa_Spawns[ID_Monstro] ) & "'" & 
        ", x: " & fMapa_Spawns[Coord_X] & 
        ", y: " & fMapa_Spawns[Coord_Y] & 
        ", hp: " & LOOKUPVALUE ( dMonstros[HP], dMonstros[ID_Monstro], fMapa_Spawns[ID_Monstro] ) & 
        ", hpMax: " & LOOKUPVALUE ( dMonstros[HP], dMonstros[ID_Monstro], fMapa_Spawns[ID_Monstro] ) & 
        ", dano: " & LOOKUPVALUE ( dMonstros[Dano], dMonstros[ID_Monstro], fMapa_Spawns[ID_Monstro] ) & 
        ", isBoss: " & IF ( fMapa_Spawns[ID_Monstro] = 5, "true", "false" ) & 
        ", sprite: '" & LOOKUPVALUE ( dMonstros[Sprite], dMonstros[ID_Monstro], fMapa_Spawns[ID_Monstro] ) & "'}",
        ", "
    ) & 
    "]"

-- 3. Código HTML5 + CSS + JavaScript Game Engine
VAR _HTML_Code = 
    "<!DOCTYPE html>" &
    "<html>" &
    "<head>" &
    "<meta charset='utf-8'>" &
    "<style>" &
    "  body { margin: 0; padding: 6px; background-color: #0f0f12; font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; user-select: none; color: #fff; overflow: hidden; }" &
    "  .game-wrapper { position: relative; display: flex; flex-direction: column; align-items: center; box-shadow: 0 12px 36px rgba(0,0,0,0.9); border-radius: 8px; border: 2px solid #b8860b; background: #18181b; outline: none; }" &
    "  .rpg-hud { width: 800px; background: linear-gradient(180deg, #27272a 0%, #18181b 100%); padding: 8px 14px; box-sizing: border-box; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #3f3f46; font-size: 13px; }" &
    "  .hud-stats { display: flex; align-items: center; gap: 8px; font-weight: 600; }" &
    "  .hud-pill { background: #27272a; padding: 3px 8px; border-radius: 4px; border: 1px solid #52525b; color: #facc15; font-size: 12px; }" &
    "  .dpad-controls { display: flex; align-items: center; gap: 4px; }" &
    "  .btn-dir { background: #3f3f46; color: #fff; border: 1px solid #71717a; width: 32px; height: 30px; border-radius: 4px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }" &
    "  .btn-dir:hover { background: #b8860b; }" &
    "  .btn-reset { background: #b8860b; color: #fff; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px; margin-left: 8px; }" &
    "  .btn-reset:hover { background: #d4af37; }" &
    "  .hud-log-bar { width: 800px; background: #121214; padding: 6px 14px; box-sizing: border-box; font-size: 12px; font-weight: 500; color: #67e8f9; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }" &
    "  canvas { display: block; background: #27272a; cursor: crosshair; outline: none; }" &
    "  .overlay-modal { position: absolute; top: 120px; left: 150px; width: 500px; background: rgba(15,15,18,0.95); border: 2px solid #b8860b; border-radius: 8px; padding: 20px; box-sizing: border-box; text-align: center; display: none; z-index: 100; box-shadow: 0 0 40px rgba(0,0,0,0.9); }" &
    "  .overlay-modal h2 { margin-top: 0; color: #facc15; font-size: 22px; }" &
    "  .overlay-modal p { font-size: 14px; color: #e4e4e7; line-height: 1.5; }" &
    "  .overlay-modal button { background: #b8860b; color: #fff; border: none; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 13px; margin-top: 10px; }" &
    "</style>" &
    "</head>" &
    "<body>" &
    "<div class='game-wrapper' id='gameContainer' tabindex='0' onclick='this.focus()'>" &
    "  <div class='rpg-hud'>" &
    "    <div class='hud-stats'>" &
    "      <span>🗡️ Herói:</span>" &
    "      <span class='hud-pill' id='hudHeroiNome'>" & _HeroiAtual & "</span>" &
    "      <span>❤️ HP:</span>" &
    "      <span class='hud-pill' id='hudHeroiHP'>" & _HeroiHP & " / " & _HeroiHP & "</span>" &
    "      <span>⚔️ Atk:</span>" &
    "      <span class='hud-pill'>" & _HeroiAtk & "</span>" &
    "      <span>🛡️ Def:</span>" &
    "      <span class='hud-pill'>" & _HeroiDef & "</span>" &
    "    </div>" &
    "    <div class='dpad-controls'>" &
    "      <button class='btn-dir' onclick='window.moverDirecao(0, -32)' title='Cima'>⬆️</button>" &
    "      <button class='btn-dir' onclick='window.moverDirecao(-32, 0)' title='Esquerda'>⬅️</button>" &
    "      <button class='btn-dir' onclick='window.moverDirecao(0, 32)' title='Baixo'>⬇️</button>" &
    "      <button class='btn-dir' onclick='window.moverDirecao(32, 0)' title='Direita'>➡️</button>" &
    "      <button class='btn-reset' onclick='window.reiniciarJogo()'>🔄 Reset</button>" &
    "    </div>" &
    "  </div>" &
    "  <div class='hud-log-bar'>" &
    "    <span id='combatLog'>⚔️ Masmorra Ativa! Use o Teclado (Setas / WASD) ou clique nos botões direcionais.</span>" &
    "    <span style='color: #a1a1aa; font-size: 11px;'>Clique na tela para dar foco ao teclado</span>" &
    "  </div>" &
    "  <canvas id='gameCanvas' width='800' height='600' tabindex='0'></canvas>" &
    "  <div class='overlay-modal' id='gameModal'>" &
    "    <h2 id='modalTitle'>🏆 VITÓRIA ÉPICA!</h2>" &
    "    <p id='modalMessage'>Você derrotou o Dragão Ancião e conquistou a Masmorra do Power BI!</p>" &
    "    <button onclick='window.fecharModalEReiniciar()'>Jogar Novamente</button>" &
    "  </div>" &
    "</div>" &
    "<script>" &
    "  (function() {" &
    "    const canvas = document.getElementById('gameCanvas');" &
    "    const ctx = canvas.getContext('2d');" &
    "    const container = document.getElementById('gameContainer');" &
    "    const logEl = document.getElementById('combatLog');" &
    "    const modal = document.getElementById('gameModal');" &
    "    const modalTitle = document.getElementById('modalTitle');" &
    "    const modalMsg = document.getElementById('modalMessage');" &
    "    const TILE_SIZE = 32;" &
    "    const heroiNome = '" & _HeroiAtual & "';" &
    "    const heroiAtk = " & _HeroiAtk & ";" &
    "    const heroiDef = " & _HeroiDef & ";" &
    "    const heroiMaxHP = " & _HeroiHP & ";" &
    "    const heroiSpriteUrl = '" & _HeroiImg & "';" &
    "    const monstrosIniciais = " & _MonstrosJSON & ";" &
    "" &
    "    function safeGet(key, def) {" &
    "      try {" &
    "        const v = localStorage.getItem(key);" &
    "        return (v !== null && v !== undefined) ? v : def;" &
    "      } catch(e) {" &
    "        return window['_rpg_' + key] !== undefined ? window['_rpg_' + key] : def;" &
    "      }" &
    "    }" &
    "" &
    "    function safeSet(key, val) {" &
    "      try { localStorage.setItem(key, val); } catch(e) {}" &
    "      window['_rpg_' + key] = val;" &
    "    }" &
    "" &
    "    let heroiX = parseInt(safeGet('heroiX', 32));" &
    "    let heroiY = parseInt(safeGet('heroiY', 32));" &
    "    if (isNaN(heroiX) || heroiX % 32 !== 0) heroiX = 32;" &
    "    if (isNaN(heroiY) || heroiY % 32 !== 0) heroiY = 32;" &
    "" &
    "    let heroiHP = parseInt(safeGet('heroiHP', heroiMaxHP));" &
    "    if (isNaN(heroiHP) || heroiHP <= 0) heroiHP = heroiMaxHP;" &
    "" &
    "    let monstros = [];" &
    "    const salvos = safeGet('rpg_monstros', null);" &
    "    if (salvos) {" &
    "      try { monstros = JSON.parse(salvos); } catch(e) { monstros = JSON.parse(JSON.stringify(monstrosIniciais)); }" &
    "    } else {" &
    "      monstros = JSON.parse(JSON.stringify(monstrosIniciais));" &
    "    }" &
    "" &
    "    const imgCache = {};" &
    "    function getImg(url) {" &
    "      if (!imgCache[url]) {" &
    "        const img = new Image();" &
    "        img.src = url;" &
    "        imgCache[url] = img;" &
    "      }" &
    "      return imgCache[url];" &
    "    }" &
    "" &
    "    function salvar() {" &
    "      safeSet('heroiX', heroiX);" &
    "      safeSet('heroiY', heroiY);" &
    "      safeSet('heroiHP', heroiHP);" &
    "      safeSet('rpg_monstros', JSON.stringify(monstros));" &
    "      const elHP = document.getElementById('hudHeroiHP');" &
    "      if (elHP) elHP.innerText = heroiHP + ' / ' + heroiMaxHP;" &
    "    }" &
    "" &
    "    function setLog(texto, cor) {" &
    "      if (logEl) {" &
    "        logEl.innerText = texto;" &
    "        logEl.style.color = cor || '#67e8f9';" &
    "      }" &
    "    }" &
    "" &
    "    window.reiniciarJogo = function() {" &
    "      safeSet('heroiX', 32);" &
    "      safeSet('heroiY', 32);" &
    "      safeSet('heroiHP', heroiMaxHP);" &
    "      safeSet('rpg_monstros', JSON.stringify(monstrosIniciais));" &
    "      heroiX = 32;" &
    "      heroiY = 32;" &
    "      heroiHP = heroiMaxHP;" &
    "      monstros = JSON.parse(JSON.stringify(monstrosIniciais));" &
    "      modal.style.display = 'none';" &
    "      salvar();" &
    "      setLog('🔄 Masmorra reiniciada com sucesso! Boa sorte!', '#facc15');" &
    "      desenhar();" &
    "    };" &
    "" &
    "    window.fecharModalEReiniciar = function() {" &
    "      modal.style.display = 'none';" &
    "      window.reiniciarJogo();" &
    "    };" &
    "" &
    "    function desenhar() {" &
    "      ctx.fillStyle = '#27272a';" &
    "      ctx.fillRect(0, 0, 800, 600);" &
    "      ctx.strokeStyle = '#333338';" &
    "      ctx.lineWidth = 1;" &
    "      for (let x = 32; x < 768; x += TILE_SIZE) {" &
    "        for (let y = 32; y < 568; y += TILE_SIZE) {" &
    "          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);" &
    "        }" &
    "      }" &
    "      ctx.fillStyle = '#18181b';" &
    "      ctx.fillRect(0, 0, 800, 32);" &
    "      ctx.fillRect(0, 568, 800, 32);" &
    "      ctx.fillRect(0, 0, 32, 600);" &
    "      ctx.fillRect(768, 0, 32, 600);" &
    "      ctx.strokeStyle = '#b8860b';" &
    "      ctx.lineWidth = 2;" &
    "      ctx.strokeRect(32, 32, 736, 536);" &
    "      ctx.fillStyle = '#facc15';" &
    "      ctx.font = 'bold 11px Segoe UI';" &
    "      ctx.fillText('🚪 ENTRADA (32, 32)', 36, 22);" &
    "      ctx.fillStyle = '#ef4444';" &
    "      ctx.fillText('🔥 CÂMARA DO BOSS (704, 64)', 600, 22);" &
    "" &
    "      monstros.forEach(function(m) {" &
    "        if (m.hp > 0) {" &
    "          const img = getImg(m.sprite);" &
    "          const w = m.isBoss ? 64 : 32;" &
    "          const h = m.isBoss ? 64 : 32;" &
    "          if (img.complete && img.naturalWidth > 0) {" &
    "            ctx.drawImage(img, m.x, m.y, w, h);" &
    "          } else {" &
    "            ctx.fillStyle = m.isBoss ? '#ef4444' : '#10b981';" &
    "            ctx.fillRect(m.x, m.y, w, h);" &
    "            ctx.fillStyle = '#fff';" &
    "            ctx.font = 'bold 10px Segoe UI';" &
    "            ctx.fillText(m.isBoss ? 'BOSS' : m.nome.substr(0,3).toUpperCase(), m.x + 3, m.y + 20);" &
    "          }" &
    "          const pct = Math.max(0, m.hp / m.hpMax);" &
    "          ctx.fillStyle = '#000';" &
    "          ctx.fillRect(m.x, m.y - 6, w, 4);" &
    "          ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.2 ? '#f59e0b' : '#ef4444';" &
    "          ctx.fillRect(m.x, m.y - 6, w * pct, 4);" &
    "          ctx.fillStyle = '#fff';" &
    "          ctx.font = '9px Segoe UI';" &
    "          ctx.fillText(m.nome.split(' ')[0], m.x, m.y - 8);" &
    "        }" &
    "      });" &
    "" &
    "      const heroImg = getImg(heroiSpriteUrl);" &
    "      if (heroImg.complete && heroImg.naturalWidth > 0) {" &
    "        ctx.drawImage(heroImg, heroiX, heroiY, 32, 32);" &
    "      } else {" &
    "        ctx.fillStyle = '#3b82f6';" &
    "        ctx.fillRect(heroiX, heroiY, 32, 32);" &
    "        ctx.fillStyle = '#fff';" &
    "        ctx.font = 'bold 10px Segoe UI';" &
    "        ctx.fillText(heroiNome.substr(0,3).toUpperCase(), heroiX + 4, heroiY + 20);" &
    "      }" &
    "      const heroPct = Math.max(0, heroiHP / heroiMaxHP);" &
    "      ctx.fillStyle = '#000';" &
    "      ctx.fillRect(heroiX, heroiY - 6, 32, 4);" &
    "      ctx.fillStyle = '#3b82f6';" &
    "      ctx.fillRect(heroiX, heroiY - 6, 32 * heroPct, 4);" &
    "    }" &
    "" &
    "    function combate(m) {" &
    "      m.hp -= heroiAtk;" &
    "      if (m.hp <= 0) {" &
    "        m.hp = 0;" &
    "        if (m.isBoss) {" &
    "          setLog('🏆 VITÓRIA ÉPICA! Você derrotou o Dragão Ancião!', '#22c55e');" &
    "          modalTitle.innerText = '🏆 VITÓRIA ÉPICA!';" &
    "          modalMsg.innerText = 'Parabéns, valoroso ' + heroiNome + '! Você derrotou o lendário Dragão Ancião e limpou a Masmorra do Power BI!';" &
    "          modal.style.display = 'block';" &
    "        } else {" &
    "          setLog('💀 ' + m.nome + ' foi eliminado! Dano desferido: ' + heroiAtk, '#facc15');" &
    "        }" &
    "      } else {" &
    "        const dano = Math.max(1, m.dano - Math.floor(heroiDef / 5));" &
    "        heroiHP -= dano;" &
    "        setLog('⚔️ Ataque em ' + m.nome + ' (-' + heroiAtk + ' HP). Contra-ataque sofrido: -' + dano + ' HP!', '#fb923c');" &
    "        if (heroiHP <= 0) {" &
    "          heroiHP = heroiMaxHP;" &
    "          heroiX = 32;" &
    "          heroiY = 32;" &
    "          setLog('⚰️ VOCÊ CAIU! Renascendo na entrada da masmorra...', '#ef4444');" &
    "          modalTitle.innerText = '⚰️ VOCÊ CAIU EM BATALHA!';" &
    "          modalMsg.innerText = 'Seu herói foi vencido por ' + m.nome + '. Suas forças foram restauradas na entrada da masmorra!';" &
    "          modal.style.display = 'block';" &
    "        }" &
    "      }" &
    "      salvar();" &
    "      desenhar();" &
    "    }" &
    "" &
    "    window.moverDirecao = function(dx, dy) {" &
    "      const nx = heroiX + dx;" &
    "      const ny = heroiY + dy;" &
    "      if (nx >= 32 && nx <= 736 && ny >= 32 && ny <= 536) {" &
    "        heroiX = nx;" &
    "        heroiY = ny;" &
    "        salvar();" &
    "        desenhar();" &
    "        const col = monstros.find(function(m) {" &
    "          if (m.hp <= 0) return false;" &
    "          if (m.isBoss) {" &
    "            return (heroiX >= m.x && heroiX <= m.x + 32 && heroiY >= m.y && heroiY <= m.y + 32);" &
    "          }" &
    "          return (m.x === heroiX && m.y === heroiY);" &
    "        });" &
    "        if (col) combate(col);" &
    "      }" &
    "    };" &
    "" &
    "    window.addEventListener('keydown', function(e) {" &
    "      let dx = 0, dy = 0, move = false;" &
    "      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { dy = -TILE_SIZE; move = true; }" &
    "      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { dy = TILE_SIZE; move = true; }" &
    "      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { dx = -TILE_SIZE; move = true; }" &
    "      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { dx = TILE_SIZE; move = true; }" &
    "      if (move) {" &
    "        e.preventDefault();" &
    "        window.moverDirecao(dx, dy);" &
    "      }" &
    "    });" &
    "" &
    "    container.focus();" &
    "    salvar();" &
    "    desenhar();" &
    "    setTimeout(desenhar, 350);" &
    "  })();" &
    "</script>" &
    "</body>" &
    "</html>"

RETURN
    _HTML_Code
```

---

## 📊 2. Métricas Analíticas Auxiliares (RPG Analytics)

Estas medidas servem para compor os **Cards Executivos** ao lado ou acima da masmorra no Dashboard do Power BI Desktop:

### 2.1. Herói Selecionado
```dax
[Herói Atual] = 
SELECTEDVALUE ( dHerois[Nome], "Guerreiro" )
```

### 2.2. Poder de Ataque do Herói
```dax
[Poder de Ataque] = 
CALCULATE ( 
    MAX ( dHerois[Ataque] ), 
    dHerois[Nome] = [Herói Atual] 
)
```

### 2.3. Poder de Defesa do Herói
```dax
[Poder de Defesa] = 
CALCULATE ( 
    MAX ( dHerois[Defesa] ), 
    dHerois[Nome] = [Herói Atual] 
)
```

### 2.4. HP Máximo do Herói
```dax
[HP Máximo Herói] = 
CALCULATE ( 
    MAX ( dHerois[HP_Maximo] ), 
    dHerois[Nome] = [Herói Atual] 
)
```

### 2.5. Total de Ameaças na Masmorra
```dax
[Total de Monstros Ativos] = 
COUNTROWS ( fMapa_Spawns )
```

### 2.6. HP Total da Masmorra
```dax
[HP Total Masmorra] = 
SUMX (
    fMapa_Spawns,
    LOOKUPVALUE ( dMonstros[HP], dMonstros[ID_Monstro], fMapa_Spawns[ID_Monstro] )
)
```

### 2.7. Golpes Necessários para Derrotar o Dragão Ancião (Boss)
```dax
[Golpes Estimados Boss] = 
VAR Atk = [Poder de Ataque]
VAR HP_Boss = 300
RETURN
    ROUNDUP ( DIVIDE ( HP_Boss, Atk, 1 ), 0 )
```
