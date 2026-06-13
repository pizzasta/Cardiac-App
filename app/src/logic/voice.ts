// Web speech-to-text via the browser's Web Speech API. Used on web/Pages.
// `listen` starts recognition and returns a stop() function.

export const voiceSupported =
  typeof window !== 'undefined' &&
  !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

export function listen(
  onResult: (text: string) => void,
  onEnd: () => void,
  onError?: (err: string) => void
): () => void {
  const SR =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    onEnd();
    return () => {};
  }
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let ended = false;
  const finish = () => {
    if (!ended) {
      ended = true;
      onEnd();
    }
  };
  rec.onresult = (e: any) => onResult(e.results[0][0].transcript);
  rec.onerror = (e: any) => onError?.(e.error ?? 'error');
  rec.onend = finish;
  rec.start();
  return () => {
    try {
      rec.stop();
    } catch {
      /* no-op */
    }
  };
}
