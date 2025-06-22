/* global module */

module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  collectCoverage: true,
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.(js|ts)'],
};