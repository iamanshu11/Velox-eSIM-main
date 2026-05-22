import logger from './logger'

export interface PriceValidationResult {
  isValid: boolean;
  originalPrice: number;
  adjustedPrice: number;
  reason?: string;
}
export const validateAndAdjustPrice = (
  price: number,
  countryCode?: string
): PriceValidationResult => {
  const MIN_PRICE = 0.01;
  const MAX_PRICE = 1000;

  if (price < MIN_PRICE || price > MAX_PRICE) {
    return {
      isValid: false,
      originalPrice: price,
      adjustedPrice: price,
      reason: `Price ${price} is outside valid range [${MIN_PRICE}, ${MAX_PRICE}]`,
    };
  }

  let adjustedPrice = price;

  const regionalMultipliers: Record<string, number> = {
  };

  if (countryCode && regionalMultipliers[countryCode.toUpperCase()]) {
    adjustedPrice = parseFloat((price * regionalMultipliers[countryCode.toUpperCase()]).toFixed(2));
  }

  return {
    isValid: true,
    originalPrice: price,
    adjustedPrice,
  };
};
export const applyProfitMargin = (basePrice: number, profitMarginPercent: number = 20): number => {
  const margin = 1 + profitMarginPercent / 100;
  return parseFloat((basePrice * margin).toFixed(2));
};
export const calculateFinalPrice = (
  apiPrice: number,
  countryCode?: string,
  profitMarginPercent: number = 20
): number => {
  const priceInDollars = apiPrice / 100;

  const validation = validateAndAdjustPrice(priceInDollars, countryCode);
  
  if (!validation.isValid) {
    logger.warn(`Price validation failed: ${validation.reason}`);
    return 0;
  }

  const finalPrice = applyProfitMargin(validation.adjustedPrice, profitMarginPercent);

  return finalPrice;
};
