// Circadia visual system — "your nervous system, rendered as an OS."
// Black canvas, charcoal glass, one hot-pink signal, red pulse glows.

export const T = {
  bg: '#08080A', // true near-black canvas
  surface: '#121214', // charcoal panel
  elevated: '#1A1A1E', // raised glass
  hairline: 'rgba(255,255,255,0.08)',
  glass: 'rgba(18,18,20,0.55)',
  text: '#F5F5F7',
  muted: '#8A8A93',
  accent: '#FF2E7E', // hot pink — the signal
  accent2: '#FF3B5C', // red pulse glow
  // Shared dark backdrop gradient (top -> bottom), faint pink at the floor.
  bgGradient: ['#08080A', '#121014', '#1A0C14'] as [string, string, string],
};
