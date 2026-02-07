// ====== CÉLULAS (edite aqui quando quiser) ======
// Importante: lat/lng já precisam estar preenchidos.
// Você pode cadastrar mais células copiando um bloco.
const CELLS = [
  {
    name: "ISAS SHARAT",
    address: "Avenida Doce Angra, 368 - Village, Angra dos Reis - RJ",
    lat: -22.99369,
    lng: -44.24050
  },
  {
    name: "YAHWEH SHAMMAH",
    address: "Rua Geovane, 45 - Morro do Moreno, Angra dos Reis - RJ",
    lat: -22.98509,
    lng: -44.23265
  },
  {
    name: "JEOVÁ RAFAH",
    address: "Rua Araxá, 179 - Village, Angra dos Reis - RJ",
    lat: -22.99080,
    lng: -44.23538
  },
  {
    name: "ELOHIM",
    address: "Rua Muriaé, 247 - Village, Angra dos Reis - RJ",
    lat: -22.9918498,
    lng: -44.2340687
  },
  {
    name: "EMANUEL",
    address: "Rua José Nicásio, 2 - Morro do Moreno, Angra dos Reis - RJ",
    lat: -23.0057347,
    lng: -44.3157591
  },
  {
    name: "EFATÁ",
    address: "Rua Pedro Teixeira, 94 - Village, Angra dos Reis - RJ",
    lat: -22.9884737,
    lng: -44.2347172
  }
];

// ====== UI ======
const form = document.getElementById("form");
const streetEl = document.getElementById("street");
const numberEl = document.getElementById("number");
const neighborhoodEl = document.getElementById("neighborhood");

const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const cellNameEl = document.getElementById("cellName");
const cellAddressEl = document.getElementById("cellAddress");
const distanceEl = document.getElementById("distance");
const mapsLinkEl = document.getElementById("mapsLink");
const mapFrame = document.getElementById("mapFrame");
const geoInfoEl = document.getElementById("geoInfo");

const btn = document.getElementById("btn");
const newSearchBtn = document.getElementById("newSearch");

function setStatus(msg, isError=false){
  statusEl.textContent = msg || "";
  statusEl.classList.toggle("error", !!isError);
}

function resetUI(){
  resultEl.classList.add("hidden");
  setStatus("");
  mapFrame.src = "";
  geoInfoEl.textContent = "";
}

newSearchBtn.addEventListener("click", () => {
  resetUI();
  streetEl.focus();
});

// ====== DISTÂNCIA (Haversine) ======
function toRad(v){ return (v * Math.PI) / 180; }

function haversineKm(lat1, lon1, lat2, lon2){
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ====== Geocodificação (Nominatim / OpenStreetMap) ======
// Observação: Nominatim tem limites. Evite muitos cliques seguidos.
// Para reduzir chamadas: cache simples no localStorage por endereço digitado.
function cacheKey(q){ return `geo_cache_v1:${q.toLowerCase()}`; }

async function geocode(q){
  const cached = localStorage.getItem(cacheKey(q));
  if (cached){
    try{ return JSON.parse(cached); }catch{}
  }

  // Nominatim aceita o parâmetro "email" (recomendado para identificação)
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  // url.searchParams.set("email", "SEU_EMAIL@EXEMPLO.COM"); // opcional

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!res.ok) throw new Error(`Falha na geocodificação: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const out = {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name
  };

  localStorage.setItem(cacheKey(q), JSON.stringify(out));
  return out;
}

// ====== Mapas ======
function googleMapsSearchUrl(query){
  const u = new URL("https://www.google.com/maps/search/?api=1");
  u.searchParams.set("query", query);
  return u.toString();
}

function osmEmbedUrl(lat, lng){
  const d = 0.01;
  const left = lng - d, right = lng + d, top = lat + d, bottom = lat - d;
  const u = new URL("https://www.openstreetmap.org/export/embed.html");
  u.searchParams.set("bbox", `${left},${bottom},${right},${top}`);
  u.searchParams.set("layer", "mapnik");
  u.searchParams.set("marker", `${lat},${lng}`);
  return u.toString();
}

// ====== Lógica principal ======
function findNearest(userLat, userLng){
  let best = null;
  for (const cell of CELLS){
    const d = haversineKm(userLat, userLng, cell.lat, cell.lng);
    if (!best || d < best.distanceKm){
      best = { cell, distanceKm: d };
    }
  }
  return best;
}

function showResult(geo, best){
  cellNameEl.textContent = best.cell.name;
  cellAddressEl.textContent = best.cell.address;
  distanceEl.textContent = best.distanceKm.toFixed(2);
  mapsLinkEl.href = googleMapsSearchUrl(best.cell.address);
  mapFrame.src = osmEmbedUrl(best.cell.lat, best.cell.lng);
  geoInfoEl.textContent = `Seu endereço: ${geo.displayName || "—"} | lat ${geo.lat.toFixed(6)} • lng ${geo.lng.toFixed(6)}`;

  resultEl.classList.remove("hidden");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetUI();

  const street = streetEl.value.trim();
  const number = numberEl.value.trim();
  const neighborhood = neighborhoodEl.value.trim();

  if (!street || !number){
    setStatus("Preencha Rua e Número.", true);
    return;
  }

  if (!CELLS.length){
    setStatus("Nenhuma célula cadastrada no código (CELLS).", true);
    return;
  }

  btn.disabled = true;
  setStatus("Localizando seu endereço...");

  try{
    const query = [
      `${street}, ${number}`,
      neighborhood ? neighborhood : null,
      "Angra dos Reis",
      "RJ",
      "Brasil"
    ].filter(Boolean).join(", ");

    const geo = await geocode(query);
    if (!geo){
      setStatus("Não foi possível localizar este endereço. Tente adicionar o bairro.", true);
      return;
    }

    setStatus("Calculando a célula mais próxima...");
    const best = findNearest(geo.lat, geo.lng);

    setStatus("Encontrado! ✅");
    showResult(geo, best);
  }catch(err){
    setStatus(err.message || "Falha ao localizar/endereço.", true);
  }finally{
    btn.disabled = false;
  }
});
