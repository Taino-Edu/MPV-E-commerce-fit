type Dimensions = {
  weightKg: number
  heightCm: number
  widthCm: number
  depthCm: number
  quantity: number
}

export function calcBilledWeight(d: Dimensions): number {
  const cubicWeight = (d.heightCm * d.widthCm * d.depthCm) / 6000
  return Math.max(d.weightKg, cubicWeight) * d.quantity
}

export function calcTotalBilledWeight(items: Dimensions[]): number {
  return items.reduce((acc, item) => acc + calcBilledWeight(item), 0)
}

export function calcTotalRealWeight(items: Dimensions[]): number {
  return items.reduce((acc, item) => acc + item.weightKg * item.quantity, 0)
}
