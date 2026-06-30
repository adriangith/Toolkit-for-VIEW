/* global module */

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  collectCoverage: false,
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.(js|ts)'],
};
