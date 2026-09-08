# SUPER KART 16-BIT — Estrutura de Produção

Abra `index.html` para executar localmente. A engine foi separada em arquivos clássicos JavaScript na ordem correta, portanto não exige bundler nem servidor para o fluxo atual.

## Estrutura

- `index.html` — estrutura da interface e canvas
- `css/game.css` — todo o visual HTML/CSS
- `js/core.js` — canvas e contexto base
- `js/tracks.js` — pistas, spline, textura do mundo e objetos de pista
- `js/racers.js` — criação/configuração dos corredores
- `js/camera.js` — câmera terceira pessoa/Mode 7
- `js/graphics.js` — presets, LOD e qualidade adaptativa
- `js/input.js` — teclado/input
- `js/menu.js` — menu e opções
- `js/state.js` — estado da corrida e reset
- `js/physics.js` — física, drift, IA, colisões e progresso
- `js/render-top.js` — câmera superior
- `js/render-mode7.js` — chão Mode 7, projeção e billboards
- `js/render-poly.js` — camada poligonal híbrida e LOD
- `js/hud.js` — HUD, minimapa e overlays
- `js/game-loop.js` — fixed timestep e ciclo principal
- `assets/` — recursos externos separados por categoria

## Próxima etapa recomendada

Migrar os dados das pistas para arquivos próprios e introduzir um AssetManager para imagens/áudio, mantendo fallback procedural durante a produção.


## Sistema de itens

- Caixas de item espalhadas pelas 5 pistas.
- `E` ou `X`: usa o item carregado.
- Bomba: arremessada à frente e explode por impacto ou tempo.
- Poça de óleo: fica no chão e faz o adversário rodar.
- Turbo: aceleração prolongada.
- Escudo: absorve ataques e armadilhas.
- Míssil: procura um adversário à frente.
- Choque: reduz temporariamente os demais karts.
- A IA coleta e usa itens automaticamente.
