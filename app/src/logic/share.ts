import { Platform, Share } from 'react-native';

const APP_URL = 'https://pizzasta.github.io/Cardiac-App/';

// Cross-platform share. Returns 'shared' | 'copied' | 'none' so the UI can show
// the right confirmation. Never throws.
export async function shareText(message: string): Promise<'shared' | 'copied' | 'none'> {
  const body = `${message}\n\nFind your rhythm → ${APP_URL}`;
  try {
    if (Platform.OS === 'web') {
      const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) {
        await nav.share({ text: body });
        return 'shared';
      }
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(body);
        return 'copied';
      }
      return 'none';
    }
    await Share.share({ message: body });
    return 'shared';
  } catch {
    return 'none';
  }
}
