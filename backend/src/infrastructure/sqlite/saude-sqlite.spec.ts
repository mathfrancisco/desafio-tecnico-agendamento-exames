import { criarBanco } from './database';
import { SaudeSqlite } from './saude-sqlite';

describe('SaudeSqlite', () => {
  it('não lança quando o banco responde', () => {
    expect(() =>
      new SaudeSqlite(criarBanco(':memory:')).verificar(),
    ).not.toThrow();
  });

  it('lança quando o banco está fechado', () => {
    const db = criarBanco(':memory:');
    db.close();
    expect(() => new SaudeSqlite(db).verificar()).toThrow();
  });
});
