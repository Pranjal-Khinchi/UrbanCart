const slugify = require('slugify');

function makeSlug(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

module.exports = { makeSlug };
