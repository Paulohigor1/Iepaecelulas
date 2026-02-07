# Landing Page (100% grátis) — Encontrar a Célula Mais Próxima (Angra dos Reis)

Esta versão é **apenas uma página estática** (sem servidor, sem banco e sem admin).
Ela:
- Converte o endereço digitado em latitude/longitude usando **Nominatim (OpenStreetMap)**
- Calcula a célula mais próxima usando **Haversine**
- Mostra nome, endereço, distância e botão "Ver no mapa" (Google Maps)

## Arquivos
- index.html
- styles.css
- app.js  (contém a lista de células e a lógica)

## Como publicar grátis (GitHub Pages)
1) Crie um repositório no GitHub (ex: `celulas-angra`)
2) Envie os arquivos desta pasta (index.html, styles.css, app.js)
3) No repositório:
   Settings → Pages → Deploy from a branch
   Branch: main / (root) → Save
4) Espere 1-2 minutos e abra a URL do Pages.

## Cadastrar/editar células
Abra `app.js` e edite o array `CELLS`.
Cada célula precisa ter:
- name
- address
- lat
- lng

## Observação sobre o Nominatim
O Nominatim é um serviço comunitário com limites de uso.
Para tráfego muito alto, o ideal é usar um provedor pago (Google/Mapbox/etc) ou montar backend com cache.
