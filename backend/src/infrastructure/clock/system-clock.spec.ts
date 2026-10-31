import { SystemClock } from './system-clock';

describe('SystemClock', () => {
  it('devolve a hora local no formato YYYY-MM-DDTHH:mm', () => {
    expect(new SystemClock().agoraLocal()).toMatch(
      /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/,
    );
  });
});
