import {expect} from 'chai';

describe('sinopia-cacher', () => {
  const module = require('../src');

  describe('exports', () => {
    it('should expose a default function', () => {
      expect(module.default).to.be.a('function');
    });
  });
});