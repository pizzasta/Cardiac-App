import { Platform, Share } from 'react-native';

const APP_URL = 'https://pizzasta.github.io/Cardiac-App/';

// Cross-platform share. Returns 'shared' | 'copied' | 'none' so the UI can show
// the right confirmation. A dismissed share sheet counts as 'none'. Never throws.
export async function shareText(message: string): Promise<'shared' | 'copied' | 'none'> {
  const body = `${message}\n\nFind your rhythm → ${APP_URL}`;
  try {
    if (Platform.OS === 'web') {
      const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) {
        // Rejects (AbortError) when the user cancels, which lands in the catch.
        await nav.share({ text: body });
        return 'shared';
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(body);
        return 'copied';
      }
      return 'none';
    }
    const result = await Share.share({ message: body });
    if (result?.action === Share.dismissedAction) return 'none';
    return 'shared';
  } catch {
    return 'none';
  }
}
