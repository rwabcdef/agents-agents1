// Turns an informal component description (e.g. "5K0 0805 1%") into a
// distributor-friendly search term (e.g. "5 kohm 0805 1%").

const RES_UNITS = { r: 'ohm', k: 'kohm', M: 'Mohm' };

// "1.50" -> "1.5", "5.0" -> "5"
function tidy(num) {
  return String(Number(num));
}

// Join RKM-style parts: "4" + "7" -> "4.7"; "4.7" + "" -> "4.7"
function joinValue(whole, frac) {
  if (!frac) return tidy(whole);
  if (whole.includes('.')) return null; // e.g. "4.7k7" is ambiguous
  return tidy(`${whole}.${frac}`);
}

function resistanceUnit(letter) {
  if (letter === 'M') return RES_UNITS.M;
  return RES_UNITS[letter.toLowerCase()];
}

function normaliseToken(token) {
  const t = token.replace(/µ/g, 'u');

  // Resistance written with an explicit unit: 10kohm, 4.7kΩ, 100ohms, 1MΩ
  let m = t.match(/^(\d+(?:\.\d+)?)([kKM]?)(?:ohms?|Ω)$/i);
  if (m) {
    const unit = m[2] ? resistanceUnit(m[2]) : 'ohm';
    return `${tidy(m[1])} ${unit}`;
  }

  // Resistance in RKM notation: 5K0, 4K99, 4R7, 100R, 10k, 1M
  m = t.match(/^(\d+(?:\.\d+)?)([rRkKM])(\d*)$/);
  if (m) {
    const value = joinValue(m[1], m[3]);
    if (value !== null) return `${value} ${resistanceUnit(m[2])}`;
  }

  // Capacitance: 100n, 100nF, 4u7, 10p, 0.1uF
  m = t.match(/^(\d+(?:\.\d+)?)([pPnNuU])(\d*)[fF]?$/);
  if (m) {
    const value = joinValue(m[1], m[3]);
    if (value !== null) return `${value}${m[2].toLowerCase()}F`;
  }

  // Everything else (packages, tolerances, voltages, inductors...) passes through
  return token;
}

function toSearchTerm(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(normaliseToken)
    .join(' ');
}

module.exports = { toSearchTerm };
