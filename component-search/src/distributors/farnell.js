// Farnell / element14 Product Search API
// https://partner.element14.com/docs/Product_Search_API_REST__Description

const ENDPOINT = 'https://api.element14.com/catalog/products';

const CURRENCY_BY_STORE = {
  'uk.farnell.com': '£',
  'de.farnell.com': '€',
  'fr.farnell.com': '€',
  'ie.farnell.com': '€',
  'it.farnell.com': '€',
  'es.farnell.com': '€',
  'nl.farnell.com': '€',
  'www.newark.com': '$',
};

function buildUrl(term, { apiKey, store, inStock, count = 10 }) {
  const params = new URLSearchParams({
    term: `any:${term}`,
    'storeInfo.id': store,
    'resultsSettings.offset': '0',
    'resultsSettings.numberOfResults': String(count),
    'resultsSettings.responseGroup': 'large',
    'callInfo.responseDataFormat': 'json',
    'callInfo.apiKey': apiKey,
  });
  if (inStock) params.set('resultsSettings.refinements.filters', 'inStock');
  return `${ENDPOINT}?${params}`;
}

function faultMessage(body) {
  const fault = body && (body.Fault || body.fault);
  if (!fault) return null;
  const detail = fault.Detail || fault.detail;
  return (
    fault.Description ||
    fault.faultstring ||
    (detail && JSON.stringify(detail)) ||
    JSON.stringify(fault)
  );
}

// Parts that can't be bought in quantities this small are treated as reel/bulk only.
const SMALL_VOLUME_MAX = 10;
const DISPLAY_COUNT = 10;

function mapProduct(p) {
  const stock = Number(p.stock?.level ?? p.inv ?? 0);
  const firstBreak = Math.min(...(p.prices || []).map((pr) => Number(pr.from)).filter(Number.isFinite));
  // "translatedMinimumOrderQuality" is the API's own (misspelt) field name
  const minQty = Math.max(
    Number(p.translatedMinimumOrderQuality) || 1,
    Number.isFinite(firstBreak) ? firstBreak : 1
  );
  return {
    minQty,
    distributor: 'Farnell',
    sku: p.sku,
    mpn: p.translatedManufacturerPartNumber,
    manufacturer: p.brandName || p.vendorName,
    description: p.displayName,
    stock,
    prices: (p.prices || []).map((pr) => ({ from: pr.from, cost: pr.cost })),
  };
}

async function search(term, { inStock = false, smallVolume = false } = {}) {
  const apiKey = process.env.FARNELL_API_KEY;
  const store = process.env.FARNELL_STORE || 'uk.farnell.com';
  if (!apiKey) {
    throw new Error('FARNELL_API_KEY is not set. Add it to component-search/.env and restart.');
  }

  // Fetch extra when filtering locally so enough survive to fill the display
  const count = smallVolume ? 25 : DISPLAY_COUNT;
  const res = await fetch(buildUrl(term, { apiKey, store, inStock, count }));
  const text = await res.text();

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  const fault = faultMessage(body);
  if (!res.ok || fault) {
    const reason = fault || text.slice(0, 300) || res.statusText;
    throw new Error(`Farnell API error (HTTP ${res.status}): ${reason}`);
  }

  const ret = body?.keywordSearchReturn ?? {};
  let products = (ret.products || []).map(mapProduct);
  if (inStock) products = products.filter((p) => p.stock > 0);
  const fetched = products.length;
  if (smallVolume) products = products.filter((p) => p.minQty <= SMALL_VOLUME_MAX);
  const hiddenBulk = fetched - products.length;
  products = products.slice(0, DISPLAY_COUNT);

  return {
    products,
    hiddenBulk,
    total: ret.numberOfResults ?? products.length,
    currency: CURRENCY_BY_STORE[store] ?? '',
  };
}

module.exports = { name: 'Farnell', search, buildUrl };
