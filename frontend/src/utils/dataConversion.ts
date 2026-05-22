export function convertVolumeToGB(volumeUnits: number): number {
  if (!volumeUnits || volumeUnits <= 0) return 0;

  const volumeInMB = volumeUnits / 100;

  const volumeInGB = volumeInMB / 1024;

  return Math.round(volumeInGB * 10) / 10;
}
export function convertPriceToUSD(priceInCents: number): number {
  if (!priceInCents || priceInCents <= 0) return 0;
  return priceInCents / 100;
}
export function formatVolume(volumeUnits: number): string {
  if (!volumeUnits || volumeUnits <= 0) return '0 GB';

  const volumeInMB = volumeUnits / 100;
  const volumeInGB = volumeInMB / 1024;

  if (volumeInGB >= 1) {
    const gbRounded = Math.round(volumeInGB * 10) / 10;
    return `${gbRounded} GB`;
  }

  const mbRounded = Math.round(volumeInMB * 10) / 10;
  return `${mbRounded} MB`;
}
export function formatPrice(priceInCents: number): string {
  if (!priceInCents || priceInCents <= 0) return '$0.00';
  
  const usd = convertPriceToUSD(priceInCents);
  return `$${usd.toFixed(2)}`;
}
export function formatDuration(duration: number, durationUnit: string = 'days'): string {
  if (!duration || duration <= 0) return 'Unknown';
  
  const unit = durationUnit.toLowerCase();
  const singularUnit = duration === 1 ? unit.slice(0, -1) : unit;
  
  return `${duration} ${singularUnit.charAt(0).toUpperCase() + singularUnit.slice(1)}`;
}
