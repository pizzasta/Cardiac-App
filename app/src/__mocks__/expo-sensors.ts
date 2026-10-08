// Minimal expo-sensors stub for Jest: no device, no events.
export const DeviceMotion = {
  isAvailableAsync: async () => false,
  setUpdateInterval: () => {},
  addListener: () => ({ remove: () => {} }),
};
