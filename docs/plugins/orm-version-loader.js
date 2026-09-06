const { version } = require('../../packages/core/package.json');

// the playground bundles the ORM sources, where the version is still the placeholder
// that `scripts/copy.mjs` fills in when publishing
module.exports = source => source.replace('[[MIKRO_ORM_VERSION]]', version);
