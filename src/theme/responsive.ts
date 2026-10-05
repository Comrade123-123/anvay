import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

// Screens are designed on a 390pt-wide frame. Layout sizes scale with the window
// (within limits) so phones from ~320pt to tablets keep the same proportions,
// while text scales more gently so it never gets tiny or huge.
const BASE_WIDTH = 390;
const MAX_CONTENT_WIDTH = 480;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// On desktop web the app is shown inside a phone-sized frame (see DeviceFrame); it provides the frame's size here so
// every screen lays out for the frame instead of the whole browser window. On a real phone there is no provider.
export const ViewportContext = createContext<{ width: number; height: number } | null>(null);

export function useViewport() {
  const win = useWindowDimensions();
  const frame = useContext(ViewportContext);
  return frame ?? win;
}

export function useResponsive() {
  const { width, height } = useViewport();
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const scale = clamp(contentWidth / BASE_WIDTH, 0.82, 1.2);
  const fontScale = clamp(contentWidth / BASE_WIDTH, 0.9, 1.1);

  return {
    width,
    height,
    contentWidth,
    isNarrow: width < 360,
    /** scale a layout dimension (padding, sizes, radii) */
    s: (n: number) => Math.round(n * scale),
    /** scale a font size; never shrinks below the design size or 9.5pt, whichever is smaller, so captions stay readable */
    fs: (n: number) => Math.max(Math.round(n * fontScale * 10) / 10, Math.min(n, 9.5)),
    maxContentWidth: MAX_CONTENT_WIDTH,
  };
}

export type Responsive = ReturnType<typeof useResponsive>;
