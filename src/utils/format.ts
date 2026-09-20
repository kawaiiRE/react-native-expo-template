export function formatCount(
  value: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatPercent(value: number) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return `${Math.round(boundedValue)}%`;
}
