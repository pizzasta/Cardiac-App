/**
 * Minimal AsyncStorage stub for Jest.
 * Replace with @react-native-async-storage/async-storage/jest/async-storage-mock
 * once it is added as a dev dependency, or keep this lightweight version.
 */

const store: Record<string, string> = {};

const AsyncStorage = {
    getItem: jest.fn(async (key: string) => store[key] ?? null),
    setItem: jest.fn(async (key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn(async (key: string) => { delete store[key]; }),
    multiRemove: jest.fn(async (keys: string[]) => { keys.forEach((k) => delete store[k]); }),
    clear: jest.fn(async () => { Object.keys(store).forEach((k) => delete store[k]); }),
};

export default AsyncStorage;
