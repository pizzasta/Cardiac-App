import { Share } from 'react-native';
import { exportCsv, exportFilename, toCsv } from './export';

describe('toCsv', () => {
  it('writes a profile header and sorted rows', () => {
    const csv = toCsv(
      [
        { date: '2026-10-02', level: 'flat', ts: Date.UTC(2026, 9, 2, 9) },
        { date: '2026-10-01', level: 'steady', reason: 'sleep', ts: Date.UTC(2026, 9, 1, 9) },
      ],
      { animal: 'dolphin', peak: 'late morning', crash: '2pm', recharge: 'quiet' }
    );
    const lines = csv.trim().split('\n');
    expect(lines[0]).toContain('Dolphin');
    expect(lines[2]).toBe('date,level,reason,logged_at');
    expect(lines[3]).toBe('2026-10-01,steady,sleep,2026-10-01T09:00:00.000Z');
    expect(lines[4]).toBe('2026-10-02,flat,,2026-10-02T09:00:00.000Z');
  });

  it('quotes commas and neutralises formula injection', () => {
    const csv = toCsv([{ date: '2026-10-01', level: 'wired', reason: '=HYPERLINK("x"),y', ts: 0 }], null);
    expect(csv).toContain(`"'=HYPERLINK(""x""),y"`);
    expect(csv.startsWith('date,level')).toBe(true);
  });
});

describe('exportFilename', () => {
  it('is dated', () => {
    expect(exportFilename(new Date('2026-10-07T12:00:00Z'))).toBe('circadia-checkins-2026-10-07.csv');
  });
});

describe('exportCsv', () => {
  it('hands the CSV to the native share sheet', async () => {
    const res = await exportCsv([{ date: '2026-10-01', level: 'steady', ts: 0 }], null);
    expect(res).toBe('shared');
    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('2026-10-01,steady') })
    );
  });
});
