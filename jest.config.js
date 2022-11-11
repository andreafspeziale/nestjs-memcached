module.exports = {
  rootDir: 'lib',
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testRegex: '.*\\.(e2e-)?spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/test',
  ],
};
