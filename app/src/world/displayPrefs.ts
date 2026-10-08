import { createContext, useContext } from 'react';

// App-wide display choices that 3D pieces outside the world read: `simple`
// is on with the battery-saver background or in Low Power Mode.
export type DisplayPrefs = { simple: boolean };

export const DisplayPrefsContext = createContext<DisplayPrefs>({ simple: false });

export function useDisplayPrefs(): DisplayPrefs {
  return useContext(DisplayPrefsContext);
}
