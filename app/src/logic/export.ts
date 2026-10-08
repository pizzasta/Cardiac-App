// Export — your data, in a file you own.
//
// Builds a plain CSV of every check-in (plus a header block with the rhythm
// profile) and hands it to the platform: a file download on web, the share
// sheet on native. Nothing leaves the device unless the user sends it.
import { Platform, Share } from 'react-native';
import { ARCHETYPES } from '../data/archetypes';
import { PulseEntry } from './pulselog';
import { RhythmResult } from './score';

function cell(value: string | number | undefined | null): string {
  const s = value == null ? '' : String(value);
  // Neutralise spreadsheet formula injection, then quote if needed.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(log: PulseEntry[], result: RhythmResult | null): string {
  const lines: string[] = [];
  if (result) {
    const a = ARCHETYPES[result.animal];
    lines.push(`# Wildhour rhythm profile: ${a?.name ?? result.animal}`);
    lines.push(`# peak: ${result.peak} | crash: ${result.crash} | recharge: ${result.recharge}`);
  }
  lines.push('date,level,reason,logged_at');
  [...log]
    .sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0))
    .forEach((e) => {
      const at = Number.isFinite(e.ts) ? new Date(e.ts).toISOString() : '';
      lines.push([cell(e.date), cell(e.level), cell(e.reason), cell(at)].join(','));
    });
  return lines.join('\n') + '\n';
}

export function exportFilename(now = new Date()): string {
  return `wildhour-checkins-${now.toISOString().slice(0, 10)}.csv`;
}

// Returns 'downloaded' | 'shared' | 'none'. Never throws.
export async function exportCsv(
  log: PulseEntry[],
  result: RhythmResult | null
): Promise<'downloaded' | 'shared' | 'none'> {
  const csv = toCsv(log, result);
  try {
    if (Platform.OS === 'web') {
      // DOM globals, typed loosely: React Native's Blob typings differ from the browser's.
      const g: any = globalThis;
      if (!g.document || !g.Blob || !g.URL?.createObjectURL) return 'none';
      const url = g.URL.createObjectURL(new g.Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = g.document.createElement('a');
      link.href = url;
      link.download = exportFilename();
      g.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => g.URL.revokeObjectURL(url), 1000);
      return 'downloaded';
    }
    const res = await Share.share({ title: exportFilename(), message: csv });
    return res.action === Share.dismissedAction ? 'none' : 'shared';
  } catch {
    return 'none';
  }
}
