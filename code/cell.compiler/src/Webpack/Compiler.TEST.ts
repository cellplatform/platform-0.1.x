import { Compiler } from '.';
import { expect } from '../test';

describe('Compiler', () => {
  it('static entry', () => {
    expect(typeof Compiler.bundle).to.eql('function');
    expect(typeof Compiler.config.create).to.eql('function');
    expect(typeof Compiler.dev).to.eql('function');
    expect(typeof Compiler.upload).to.eql('function');
    expect(typeof Compiler.watch).to.eql('function');
    expect(typeof Compiler.cell).to.eql('function');
  });
});
