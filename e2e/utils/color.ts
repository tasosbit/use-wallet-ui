/**
 * Convert RGB color string to hex
 */
export function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (!match) {
    throw new Error(`Invalid RGB color: ${rgb}`)
  }
  return (
    '#' +
    [1, 2, 3]
      .map((i) => parseInt(match[i]).toString(16).padStart(2, '0'))
      .join('')
  )
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`)
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/**
 * Calculate color distance (Euclidean) for comparison
 */
export function colorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1.startsWith('#') ? color1 : rgbToHex(color1))
  const rgb2 = hexToRgb(color2.startsWith('#') ? color2 : rgbToHex(color2))

  return Math.sqrt(
    Math.pow(rgb2.r - rgb1.r, 2) +
      Math.pow(rgb2.g - rgb1.g, 2) +
      Math.pow(rgb2.b - rgb1.b, 2),
  )
}

/**
 * Assert two colors are similar within threshold
 */
export function assertColorsSimilar(
  actual: string,
  expected: string,
  threshold: number = 5,
): void {
  const distance = colorDistance(actual, expected)
  if (distance > threshold) {
    throw new Error(
      `Colors differ by ${distance.toFixed(2)} (threshold: ${threshold}). ` +
        `Actual: ${actual}, Expected: ${expected}`,
    )
  }
}
