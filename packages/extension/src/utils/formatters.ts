// Duplicated from use-wallet-ui BeforeSignDialog.tsx
// Will be extracted into a shared package later.

export interface AssetInfo {
  decimals: number
  unitName: string
}

export function formatAssetAmount(rawAmount: string | undefined, info: AssetInfo): string {
  if (rawAmount === undefined) return `0 ${info.unitName}`
  const raw = BigInt(rawAmount)
  if (info.decimals === 0) return `${raw} ${info.unitName}`
  const divisor = 10n ** BigInt(info.decimals)
  const whole = raw / divisor
  const remainder = raw % divisor
  if (remainder === 0n) return `${whole} ${info.unitName}`
  const frac = remainder.toString().padStart(info.decimals, '0').replace(/0+$/, '')
  return `${whole}.${frac} ${info.unitName}`
}

export function assetLabel(assetIndex?: number): string {
  if (!assetIndex) return 'ASA'
  return `ASA#${assetIndex}`
}
