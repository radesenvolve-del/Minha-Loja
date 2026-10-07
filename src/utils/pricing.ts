import { MarkupMethod, RoundingMethod } from '../types';

export interface ExtraCostsInput {
  packaging?: number;
  shipping?: number;
  cardFeePercent?: number;
  marketplaceFeePercent?: number;
  commissionPercent?: number;
  other?: number;
}

export interface PricingCalculationResult {
  baseCost: number;
  extraCostsTotal: number;
  effectiveTotalCost: number;
  suggestedPrice: number;
  roundedPrice: number;
  minPrice: number;
  grossProfit: number;
  profitPercentOfSale: number;
  markupPercentOfCost: number;
}

export function applyRounding(value: number, method: RoundingMethod): number {
  if (value <= 0) return 0;
  if (method === 'none') {
    return Math.round(value * 100) / 100;
  }

  const floorVal = Math.floor(value);
  const cents = value - floorVal;

  if (method === '90') {
    if (cents <= 0.90) {
      return floorVal + 0.90;
    } else {
      return floorVal + 1.90;
    }
  }

  if (method === '99') {
    if (cents <= 0.99) {
      return floorVal + 0.99;
    } else {
      return floorVal + 1.99;
    }
  }

  if (method === '00') {
    return Math.ceil(value);
  }

  return Math.round(value * 100) / 100;
}

export function calculatePricing({
  cost,
  markupMethod = 'markup',
  marginPercent = 40,
  extraCosts,
  includeExtraCosts = false,
  roundingMethod = 'none',
}: {
  cost: number;
  markupMethod: MarkupMethod;
  marginPercent: number;
  extraCosts?: ExtraCostsInput;
  includeExtraCosts?: boolean;
  roundingMethod?: RoundingMethod;
}): PricingCalculationResult {
  const baseCost = Math.max(0, Number(cost) || 0);
  let extraCostsTotal = 0;

  if (includeExtraCosts && extraCosts) {
    const fixedExtra = (Number(extraCosts.packaging) || 0) + (Number(extraCosts.shipping) || 0) + (Number(extraCosts.other) || 0);
    const variablePercent =
      (Number(extraCosts.cardFeePercent) || 0) +
      (Number(extraCosts.marketplaceFeePercent) || 0) +
      (Number(extraCosts.commissionPercent) || 0);

    const variableExtra = baseCost * (variablePercent / 100);
    extraCostsTotal = fixedExtra + variableExtra;
  }

  const effectiveTotalCost = baseCost + extraCostsTotal;

  // Minimum selling price = total cost without loss
  const minPrice = Math.max(0.01, Math.round(effectiveTotalCost * 100) / 100);

  let rawCalculatedPrice = effectiveTotalCost;
  const safePercent = Math.max(0, Number(marginPercent) || 0);

  if (markupMethod === 'markup') {
    // Markup sobre custo: Preço = Custo * (1 + Markup / 100)
    rawCalculatedPrice = effectiveTotalCost * (1 + safePercent / 100);
  } else {
    // Margem sobre venda: Preço = Custo / (1 - Margem / 100)
    if (safePercent >= 99.9) {
      rawCalculatedPrice = effectiveTotalCost * 10;
    } else {
      rawCalculatedPrice = effectiveTotalCost / (1 - safePercent / 100);
    }
  }

  const suggestedPrice = Math.round(rawCalculatedPrice * 100) / 100;
  const roundedPrice = applyRounding(suggestedPrice, roundingMethod);

  const finalSellingPrice = roundedPrice > 0 ? roundedPrice : suggestedPrice;
  const grossProfit = Math.max(0, finalSellingPrice - effectiveTotalCost);

  const profitPercentOfSale = finalSellingPrice > 0 ? (grossProfit / finalSellingPrice) * 100 : 0;
  const markupPercentOfCost = effectiveTotalCost > 0 ? (grossProfit / effectiveTotalCost) * 100 : 0;

  return {
    baseCost,
    extraCostsTotal: Math.round(extraCostsTotal * 100) / 100,
    effectiveTotalCost: Math.round(effectiveTotalCost * 100) / 100,
    suggestedPrice,
    roundedPrice,
    minPrice,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitPercentOfSale: Math.round(profitPercentOfSale * 10) / 10,
    markupPercentOfCost: Math.round(markupPercentOfCost * 10) / 10,
  };
}

/** Check if product currently has active promotional price */
export function getEffectiveProductPrice(product: {
  price: number;
  promotionalPrice?: number;
  promoStartDate?: string;
  promoEndDate?: string;
}): { price: number; isPromo: boolean } {
  if (
    typeof product.promotionalPrice === 'number' &&
    product.promotionalPrice > 0 &&
    product.promotionalPrice < product.price
  ) {
    const today = new Date().toISOString().slice(0, 10);
    const startValid = !product.promoStartDate || today >= product.promoStartDate;
    const endValid = !product.promoEndDate || today <= product.promoEndDate;

    if (startValid && endValid) {
      return { price: product.promotionalPrice, isPromo: true };
    }
  }
  return { price: product.price, isPromo: false };
}
