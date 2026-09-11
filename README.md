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


## Atualização de cenário e render
- Objetos de pista validados pela distância global aos segmentos do circuito.
- Guard-rails ancorados nas bordas da pista.
- Adversários usam sprite real do kart em distância próxima/média e low-poly distante.
- Objetos e adversários compartilham ordenação por profundidade.
- Culling e LOD mantidos para desempenho.


## Otimização de assets
- Sprites principais e itens convertidos para **WEBP lossless**.
- Background do menu principal também convertido para **WEBP**.


## Sprites de cenário em WEBP
- Adicionados sprites WEBP para árvores, pinheiros, palmeiras, cactos, arbustos, pedras, placas, luminária e guard-rails.
- O render de cenário agora usa imagens WEBP aplicadas diretamente no jogo.
- Duplicatas PNG e assets não usados foram removidos para deixar o projeto mais leve.


## Otimizações extras aplicadas nesta versão
- Redução agressiva da resolução fonte dos sprites WEBP usando reamostragem nearest-neighbor para manter o visual pixel-art.
- Tamanho total dos assets reduzido de aproximadamente 7.0 MB para 2.8 MB.
- Arredondamento de coordenadas de render para reduzir blur/subpixel e ajudar o canvas.
- Criação centralizada de imagens com decoding assíncrono.
- Mantidos fallbacks e compatibilidade do jogo.
