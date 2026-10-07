/**
 * Minimal react-native stub for Jest (node environment). Logic modules only
 * touch Platform and Share; screens are not unit-tested.
 */

export const Platform = { OS: 'ios', select: (o: Record<string, unknown>) => o.ios ?? o.default };

export const Share = {
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
    share: jest.fn(async () => ({ action: 'sharedAction' })),
};
