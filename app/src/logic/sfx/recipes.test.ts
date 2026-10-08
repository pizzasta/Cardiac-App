import { encodeWav, renderSfx, SFX, SFX_IDS, sfxDuration } from './recipes';

const RATE = 22050;

describe('renderSfx', () => {
  it.each(SFX_IDS)('%s renders finite, normalised audio that ends in silence', (id) => {
    const s = renderSfx(id, RATE);
    expect(s.length).toBe(Math.ceil(sfxDuration(id) * RATE) + 1);
    let peak = 0;
    s.forEach((x) => {
      expect(Number.isFinite(x)).toBe(true);
      peak = Math.max(peak, Math.abs(x));
    });
    expect(peak).toBeCloseTo(SFX[id].level, 5);
    expect(Math.abs(s[s.length - 1])).toBeLessThan(0.001);
  });

  it('keeps every interface sound short', () => {
    SFX_IDS.forEach((id) => expect(sfxDuration(id)).toBeLessThanOrEqual(2.5));
  });
});


describe('encodeWav', () => {
  it('writes a 16-bit mono PCM header', () => {
    const wav = encodeWav(new Float32Array([0, 1, -1]), RATE);
    const text = (a: number, b: number) => String.fromCharCode(...wav.slice(a, b));
    const view = new DataView(wav.buffer);
    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 12)).toBe('WAVE');
    expect(view.getUint32(24, true)).toBe(RATE);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(6);
    expect(view.getInt16(46, true)).toBe(32767);
    expect(view.getInt16(48, true)).toBe(-32767);
  });
});
