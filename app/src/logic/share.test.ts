const mockShare = jest.fn();
const mockPlatform = { OS: 'ios' };

jest.mock('react-native', () => ({
  Platform: mockPlatform,
  Share: {
    share: (...args: unknown[]) => mockShare(...args),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}));

import { shareText } from './share';

describe('shareText (native)', () => {
  beforeEach(() => {
    mockShare.mockReset();
    mockPlatform.OS = 'ios';
  });

  it('reports shared when the sheet completes', async () => {
    mockShare.mockResolvedValue({ action: 'sharedAction' });
    await expect(shareText('hi')).resolves.toBe('shared');
  });

  it('reports none when the sheet is dismissed', async () => {
    mockShare.mockResolvedValue({ action: 'dismissedAction' });
    await expect(shareText('hi')).resolves.toBe('none');
  });

  it('reports none when sharing throws', async () => {
    mockShare.mockRejectedValue(new Error('nope'));
    await expect(shareText('hi')).resolves.toBe('none');
  });
});
