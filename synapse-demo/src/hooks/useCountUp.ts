import { interpolate } from "remotion";

/**
 * Returns a number that counts up from 0 to end over the given frame range.
 */
export function useCountUp(
  frame: number,
  startFrame: number,
  endFrame: number,
  endValue: number,
  startValue: number = 0
): number {
  return interpolate(
    frame,
    [startFrame, endFrame],
    [startValue, endValue],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );
}
