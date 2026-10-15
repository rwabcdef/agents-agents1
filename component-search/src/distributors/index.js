// Distributor id -> module exposing { name, search(term, { inStock }) }.
// Add new distributors here and a matching checkbox in the renderer.
module.exports = {
  farnell: require('./farnell'),
};
