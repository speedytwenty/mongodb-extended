module.exports = {
  displayName: 'integration',
  preset: '@shelf/jest-mongodb',
  rootDir: '..',
  roots: ['<rootDir>/tests/functional'],
  setupFilesAfterEnv: [
    'jest-expect-message',
  ],
};
