# 🗡️ Catálogo de Medidas DAX - RPG Dungeon Crawler no Power BI

Este catálogo documenta a medida DAX **`[RPG_HTML_Engine]`**, projetada para injetar dinamicamente um motor de jogo em **HTML5 Canvas & JavaScript** dentro do visual certificado **HTML Content** no Power BI Desktop. 

Além do motor interativo do jogo, este catálogo inclui métricas analíticas em DAX para exibição em Cards e visuais de RPG Analytics no dashboard.

---

## 🎮 1. A Medida Motor: `[RPG_HTML_Engine]`

> **Como usar no Power BI Desktop:**
> 1. Importe o visual customizado gratuito e certificado **"HTML Content"** (por Daniel Marsh-Patrick) via AppSource.
> 2. Crie uma **Nova Medida** na tabela `fMapa_Spawns` ou em uma tabela de medidas `_Medidas`.
> 3. Cole o código DAX abaixo exatamente como está.
> 4. Arraste a medida `[RPG_HTML_Engine]` para o campo **"Values"** do visual HTML Content.
> 5. Ajuste a largura do visual para ~`840px` e altura para ~`680px`.

```dax
RPG_HTML_Engine = 
-- 1. Captura dinâmica dos atributos do Herói selecionado no Slicer de dHerois
VAR _HeroiAtual = SELECTEDVALUE ( dHerois[Nome], "Guerreiro" )
VAR _HeroiHP = CALCULATE ( MAX ( dHerois[HP_Maximo] ), dHerois[Nome] = _HeroiAtual )
VAR _HeroiAtk = CALCULATE ( MAX ( dHerois[Ataque] ), dHerois[Nome] = _HeroiAtual )
VAR _HeroiDef = CALCULATE ( MAX ( dHerois[Defesa] ), dHerois[Nome] = _HeroiAtual )
VAR _HeroiImg = CALCULATE ( MAX ( dHerois[Sprite] ), dHerois[Nome] = _HeroiAtual )

-- 2. Constrói o array JSON de monstros lendo a tabela fato fMapa_Spawns
VAR _MonstrosJSON = 
    "[" & 
    CONCATENATEX (
        fMapa_Spawns,
        VAR _IdMonstro = fMapa_Spawns[ID_Monstro]
        VAR _NomeMonstro = LOOKUPVALUE ( dMonstros[Nome], dMonstros[ID_Monstro], _IdMonstro )
        VAR _HPMonstro = LOOKUPVALUE ( dMonstros[HP], dMonstros[ID_Monstro], _IdMonstro )
        VAR _DanoMonstro = LOOKUPVALUE ( dMonstros[Dano], dMonstros[ID_Monstro], _IdMonstro )
        VAR _SpriteMonstro = LOOKUPVALUE ( dMonstros[Sprite], dMonstros[ID_Monstro], _IdMonstro )
        VAR _X = fMapa_Spawns[Coord_X]
        VAR _Y = fMapa_Spawns[Coord_Y]
        VAR _IsBoss = IF ( _IdMonstro = 5, "true", "false" )
        RETURN
            "{id: " & fMapa_Spawns[ID_Spawn] & 
            ", idMonstro: " & _IdMonstro & 
            ", nome: '" & _NomeMonstro & "'" & 
            ", x: " & _X & 
            ", y: " & _Y & 
            ", hp: " & _HPMonstro & 
            ", hpMax: " & _HPMonstro & 
            ", dano: " & _DanoMonstro & 
            ", isBoss: " & _IsBoss & 
            ", sprite: '" & _SpriteMonstro & "'}",
        ", "
    ) & 
    "]"

-- 3. Código HTML5 + CSS + JavaScript Game Loop
VAR _HTML_Code = 
    "<!DOCTYPE html>" &
    "<html>" &
    "<head>" &
    "<meta charset='utf-8'>" &
    "<style>" &
    "  body { margin: 0; padding: 10px; background-color: #121214; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; user-select: none; color: #fff; overflow: hidden; }" &
    "  .game-container { position: relative; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.8); border-radius: 8px; overflow: hidden; border: 2px solid #3e3e42; }" &
    "  .rpg-hud { width: 800px; background: linear-gradient(180deg, #252528 0%, #1a1a1c 100%); padding: 10px 16px; box-sizing: border-box; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b8860b; font-size: 13px; }" &
    "  .hud-stat { display: flex; align-items: center; gap: 8px; font-weight: 600; }" &
    "  .hud-badge { background: #2d2d30; padding: 4px 10px; border-radius: 4px; border: 1px solid #454549; color: #f1c40f; }" &
    "  .btn-reset { background: #b8860b; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: 0.2s; font-size: 12px; }" &
    "  .btn-reset:hover { background: #d4af37; transform: scale(1.03); }" &
    "  canvas { display: block; background: #2c2c2c; cursor: pointer; outline: none; }" &
    "</style>" &
    "</head>" &
    "<body>" &
    "<div class='game-container'>" &
    "  <div class='rpg-hud'>" &
    "    <div class='hud-stat'>" &
    "      <span>🗡️ Herói:</span>" &
    "      <span class='hud-badge' id='hudHeroiNome'>" & _HeroiAtual & "</span>" &
    "      <span>❤️ HP:</span>" &
    "      <span class='hud-badge' id='hudHeroiHP'>" & _HeroiHP & " / " & _HeroiHP & "</span>" &
    "      <span>⚔️ Atk:</span>" &
    "      <span class='hud-badge'>" & _HeroiAtk & "</span>" &
    "      <span>🛡️ Def:</span>" &
    "      <span class='hud-badge'>" & _HeroiDef & "</span>" &
    "    </div>" &
    "    <div class='hud-stat'>" &
    "      <button class='btn-reset' onclick='window.reiniciarJogo()'>🔄 Reiniciar Masmorra</button>" &
    "    </div>" &
    "  </div>" &
    "  <canvas id='gameCanvas' width='800' height='600' tabindex='1'></canvas>" &
    "</div>" &
    "<script>" &
    "  (function() {" &
    "    const canvas = document.getElementById('gameCanvas');" &
    "    const ctx = canvas.getContext('2d');" &
    "    const TILE_SIZE = 32;" &
    "    const heroiNome = '" & _HeroiAtual & "';" &
    "    const heroiAtk = " & _HeroiAtk & ";" &
    "    const heroiDef = " & _HeroiDef & ";" &
    "    const heroiMaxHP = " & _HeroiHP & ";" &
    "    const heroiSpriteUrl = '" & _HeroiImg & "';" &
    "    const monstrosIniciais = " & _MonstrosJSON & ";" &
    "" &
    "    let heroiX = parseInt(localStorage.getItem('heroiX'));" &
    "    let heroiY = parseInt(localStorage.getItem('heroiY'));" &
    "    if (isNaN(heroiX) || heroiX % 32 !== 0) heroiX = 32;" &
    "    if (isNaN(heroiY) || heroiY % 32 !== 0) heroiY = 32;" &
    "" &
    "    let heroiHP = parseInt(localStorage.getItem('heroiHP'));" &
    "    if (isNaN(heroiHP) || heroiHP <= 0) heroiHP = heroiMaxHP;" &
    "" &
    "    let monstros = [];" &
    "    const monstrosSalvos = localStorage.getItem('rpg_monstros_estado');" &
    "    if (monstrosSalvos) {" &
    "      try { monstros = JSON.parse(monstrosSalvos); } catch(e) { monstros = [...monstrosIniciais]; }" &
    "    } else {" &
    "      monstros = JSON.parse(JSON.stringify(monstrosIniciais));" &
    "    }" &
    "" &
    "    const imageCache = {};" &
    "    function getSprite(url) {" &
    "      if (!imageCache[url]) {" &
    "        const img = new Image();" &
    "        img.src = url;" &
    "        imageCache[url] = img;" &
    "      }" &
    "      return imageCache[url];" &
    "    }" &
    "" &
    "    function salvarEstado() {" &
    "      localStorage.setItem('heroiX', heroiX);" &
    "      localStorage.setItem('heroiY', heroiY);" &
    "      localStorage.setItem('heroiHP', heroiHP);" &
    "      localStorage.setItem('rpg_monstros_estado', JSON.stringify(monstros));" &
    "      atualizarHUD();" &
    "    }" &
    "" &
    "    window.reiniciarJogo = function() {" &
    "      localStorage.removeItem('heroiX');" &
    "      localStorage.removeItem('heroiY');" &
    "      localStorage.removeItem('heroiHP');" &
    "      localStorage.removeItem('rpg_monstros_estado');" &
    "      heroiX = 32;" &
    "      heroiY = 32;" &
    "      heroiHP = heroiMaxHP;" &
    "      monstros = JSON.parse(JSON.stringify(monstrosIniciais));" &
    "      salvarEstado();" &
    "      desenhar();" &
    "    };" &
    "" &
    "    function atualizarHUD() {" &
    "      const elHP = document.getElementById('hudHeroiHP');" &
    "      if (elHP) elHP.innerText = heroiHP + ' / ' + heroiMaxHP;" &
    "    }" &
    "" &
    "    function desenharMasmorra() {" &
    "      ctx.fillStyle = '#2c2c2c';" &
    "      ctx.fillRect(0, 0, canvas.width, canvas.height);" &
    "      ctx.strokeStyle = '#383838';" &
    "      ctx.lineWidth = 1;" &
    "      for (let x = 32; x < 800 - 32; x += TILE_SIZE) {" &
    "        for (let y = 32; y < 600 - 32; y += TILE_SIZE) {" &
    "          ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);" &
    "        }" &
    "      }" &
    "      ctx.fillStyle = '#181818';" &
    "      ctx.fillRect(0, 0, 800, 32);" &
    "      ctx.fillRect(0, 600 - 32, 800, 32);" &
    "      ctx.fillRect(0, 0, 32, 600);" &
    "      ctx.fillRect(800 - 32, 0, 32, 600);" &
    "      ctx.strokeStyle = '#b8860b';" &
    "      ctx.lineWidth = 2;" &
    "      ctx.strokeRect(32, 32, 800 - 64, 600 - 64);" &
    "      ctx.fillStyle = '#f1c40f';" &
    "      ctx.font = '11px Segoe UI';" &
    "      ctx.fillText('🚪 ENTRADA (Spawn: 32, 32)', 36, 22);" &
    "      ctx.fillStyle = '#e74c3c';" &
    "      ctx.fillText('🔥 CÂMARA DO BOSS (704, 64)', 610, 22);" &
    "    }" &
    "" &
    "    function desenharMonstros() {" &
    "      monstros.forEach(function(m) {" &
    "        if (m.hp > 0) {" &
    "          const img = getSprite(m.sprite);" &
    "          const w = m.isBoss ? 64 : 32;" &
    "          const h = m.isBoss ? 64 : 32;" &
    "          if (img.complete && img.naturalWidth > 0) {" &
    "            ctx.drawImage(img, m.x, m.y, w, h);" &
    "          } else {" &
    "            ctx.fillStyle = m.isBoss ? '#e74c3c' : '#27ae60';" &
    "            ctx.fillRect(m.x, m.y, w, h);" &
    "          }" &
    "          const barW = w;" &
    "          const barH = 4;" &
    "          const pct = Math.max(0, m.hp / m.hpMax);" &
    "          ctx.fillStyle = '#000';" &
    "          ctx.fillRect(m.x, m.y - 7, barW, barH);" &
    "          ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.2 ? '#f39c12' : '#e74c3c';" &
    "          ctx.fillRect(m.x, m.y - 7, barW * pct, barH);" &
    "          ctx.fillStyle = '#fff';" &
    "          ctx.font = '9px Segoe UI';" &
    "          ctx.fillText(m.nome.split(' ')[0], m.x, m.y - 9);" &
    "        }" &
    "      });" &
    "    }" &
    "" &
    "    function desenharHeroi() {" &
    "      const img = getSprite(heroiSpriteUrl);" &
    "      if (img.complete && img.naturalWidth > 0) {" &
    "        ctx.drawImage(img, heroiX, heroiY, 32, 32);" &
    "      } else {" &
    "        ctx.fillStyle = '#3498db';" &
    "        ctx.fillRect(heroiX, heroiY, 32, 32);" &
    "      }" &
    "      const barW = 32;" &
    "      const barH = 4;" &
    "      const pct = Math.max(0, heroiHP / heroiMaxHP);" &
    "      ctx.fillStyle = '#000';" &
    "      ctx.fillRect(heroiX, heroiY - 7, barW, barH);" &
    "      ctx.fillStyle = '#3498db';" &
    "      ctx.fillRect(heroiX, heroiY - 7, barW * pct, barH);" &
    "    }" &
    "" &
    "    function desenhar() {" &
    "      desenharMasmorra();" &
    "      desenharMonstros();" &
    "      desenharHeroi();" &
    "    }" &
    "" &
    "    function processarCombate(monstro) {" &
    "      alert('⚔️ COMBATE INICIADO!\\nVocê atacou ' + monstro.nome + '! Dano causado: ' + heroiAtk);" &
    "      monstro.hp -= heroiAtk;" &
    "      if (monstro.hp <= 0) {" &
    "        monstro.hp = 0;" &
    "        if (monstro.isBoss) {" &
    "          alert('🏆 VITÓRIA ÉPICA!\\nVocê derrotou o lendário Dragão Ancião e conquistou a Masmorra do Power BI!');" &
    "        } else {" &
    "          alert('💀 ' + monstro.nome + ' foi derrotado!');" &
    "        }" &
    "      } else {" &
    "        const danoSofrido = Math.max(1, monstro.dano - Math.floor(heroiDef / 5));" &
    "        heroiHP -= danoSofrido;" &
    "        alert('💥 ' + monstro.nome + ' contra-atacou! Dano recebido: ' + danoSofrido + '\\nSeu HP atual: ' + Math.max(0, heroiHP) + ' / ' + heroiMaxHP);" &
    "        if (heroiHP <= 0) {" &
    "          alert('⚰️ VOCÊ CAIU EM BATALHA!\\nSeu herói sucumbiu aos perigos da masmorra. Retornando ao ponto de início...');" &
    "          heroiX = 32;" &
    "          heroiY = 32;" &
    "          heroiHP = heroiMaxHP;" &
    "        }" &
    "      }" &
    "      salvarEstado();" &
    "      desenhar();" &
    "    }" &
    "" &
    "    window.addEventListener('keydown', function(e) {" &
    "      let moveu = false;" &
    "      let novoX = heroiX;" &
    "      let novoY = heroiY;" &
    "      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {" &
    "        novoY -= TILE_SIZE;" &
    "        moveu = true;" &
    "      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {" &
    "        novoY += TILE_SIZE;" &
    "        moveu = true;" &
    "      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {" &
    "        novoX -= TILE_SIZE;" &
    "        moveu = true;" &
    "      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {" &
    "        novoX += TILE_SIZE;" &
    "        moveu = true;" &
    "      }" &
    "      if (moveu) {" &
    "        e.preventDefault();" &
    "        if (novoX >= 32 && novoX <= 800 - 64 && novoY >= 32 && novoY <= 600 - 64) {" &
    "          heroiX = novoX;" &
    "          heroiY = novoY;" &
    "          salvarEstado();" &
    "          desenhar();" &
    "          const monstroColidido = monstros.find(function(m) {" &
    "            if (m.hp <= 0) return false;" &
    "            if (m.isBoss) {" &
    "              return (heroiX >= m.x && heroiX <= m.x + 32 && heroiY >= m.y && heroiY <= m.y + 32);" &
    "            }" &
    "            return (m.x === heroiX && m.y === heroiY);" &
    "          });" &
    "          if (monstroColidido) {" &
    "            processarCombate(monstroColidido);" &
    "          }" &
    "        }" &
    "      }" &
    "    });" &
    "" &
    "    canvas.focus();" &
    "    atualizarHUD();" &
    "    salvarEstado();" &
    "    desenhar();" &
    "    setTimeout(desenhar, 400);" &
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
