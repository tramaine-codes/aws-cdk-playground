import type { Config } from 'release-it';

export default {
  git: {
    commitMessage: 'chore(release): release v${version}',
    commitArgs: ['-S'],
    tagAnnotation: 'release v${version}',
    tagName: 'v${version}',
    tagArgs: ['-S'],
  },
  github: {
    release: true,
    releaseName: 'v${version}',
  },
  npm: {
    publish: true,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      preset: {
        name: 'conventionalcommits',
        types: [
          {
            type: 'feat',
            section: 'Features',
          },
          {
            type: 'fix',
            section: 'Bug Fixes',
          },
          {},
        ],
      },
    },
  },
} satisfies Config;
