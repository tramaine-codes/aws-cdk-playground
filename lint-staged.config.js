export default {
  '*.{js,json,ts,md}':
    'biome check --write --no-errors-on-unmatched --files-ignore-unknown=true',
};
