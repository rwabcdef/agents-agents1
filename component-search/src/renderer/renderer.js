const queryEl = document.getElementById('query');
const searchBtn = document.getElementById('searchBtn');
const inStockEl = document.getElementById('inStock');
const smallVolumeEl = document.getElementById('smallVolume');
const resultsEl = document.getElementById('results');

function selectedDistributors() {
  return [...document.querySelectorAll('input[name="distributor"]:checked')].map((el) => el.value);
}

function formatPrices(prices, currency) {
  if (!prices.length) return 'n/a';
  return prices.map((p) => `${p.from}+ ${currency}${p.cost}`).join(' | ');
}

function formatProduct(p, currency) {
  const head = [`[${p.distributor}] ${p.sku}`, p.mpn, p.manufacturer && `— ${p.manufacturer}`]
    .filter(Boolean)
    .join('  ');
  return [
    head,
    `  ${p.description || ''}`,
    `  Stock: ${p.stock.toLocaleString()}   Min qty: ${p.minQty}   Price: ${formatPrices(p.prices, currency)}`,
  ].join('\n');
}

function formatResponse({ term, results }) {
  const count = results.reduce((n, r) => n + (r.products?.length || 0), 0);
  const names = results.map((r) => r.distributor).join(', ');
  const lines = [`Search: "${term}" — ${count} result${count === 1 ? '' : 's'} (${names})`, ''];

  for (const r of results) {
    if (r.error) {
      lines.push(`[${r.distributor}] ERROR: ${r.error}`, '');
      continue;
    }
    if (r.hiddenBulk) {
      lines.push(`[${r.distributor}] hid ${r.hiddenBulk} bulk/reel-only part${r.hiddenBulk === 1 ? '' : 's'}`);
    }
    if (!r.products.length) {
      lines.push(`[${r.distributor}] No results`, '');
      continue;
    }
    if (r.total > r.products.length) {
      lines.push(`[${r.distributor}] showing ${r.products.length} of ${r.total}`, '');
    }
    for (const p of r.products) lines.push(formatProduct(p, r.currency), '');
  }
  return lines.join('\n');
}

async function runSearch() {
  const query = queryEl.value.trim();
  if (!query) return;

  const distributors = selectedDistributors();
  if (!distributors.length) {
    resultsEl.value = 'Select a distributor';
    return;
  }

  resultsEl.value = 'Searching…';
  queryEl.disabled = true;
  searchBtn.disabled = true;
  try {
    const response = await window.api.search({
      query,
      distributors,
      inStock: inStockEl.checked,
      smallVolume: smallVolumeEl.checked,
    });
    resultsEl.value = formatResponse(response);
  } catch (err) {
    resultsEl.value = `Error: ${err.message}`;
  } finally {
    queryEl.disabled = false;
    searchBtn.disabled = false;
    queryEl.focus();
  }
}

queryEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') runSearch();
});
searchBtn.addEventListener('click', runSearch);
