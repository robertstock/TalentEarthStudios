export const DELIVERY_COST_CATEGORY = "COURIER_FREIGHT";
export const MIN_RETAIL_MULTIPLIER = 0;
export const MAX_RETAIL_MULTIPLIER = 10;

export interface ProjectPricingLine {
  id: string;
  amount: number;
  category: string;
  vendorName: string;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundMultiplier(value: number) {
  return Math.round((value + Number.EPSILON) * 100_000_000) / 100_000_000;
}

export function parseRetailPriceInput(value: unknown) {
  const parsedPrice = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim()
      ? Number(value.trim().replaceAll(",", ""))
      : Number.NaN;

  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return null;
  }

  return roundCurrency(parsedPrice);
}

export function getRetailPriceRange(markupEligibleCosts: number, deliveryCosts: number) {
  return {
    minimumRetailPrice: roundCurrency(deliveryCosts),
    maximumRetailPrice: roundCurrency(deliveryCosts + (markupEligibleCosts * MAX_RETAIL_MULTIPLIER)),
  };
}

export function calculateRetailMultiplier(
  retailPrice: number,
  markupEligibleCosts: number,
  deliveryCosts: number,
) {
  const parsedRetailPrice = parseRetailPriceInput(retailPrice);
  if (parsedRetailPrice === null) return null;

  const { minimumRetailPrice, maximumRetailPrice } = getRetailPriceRange(markupEligibleCosts, deliveryCosts);
  if (parsedRetailPrice < minimumRetailPrice || parsedRetailPrice > maximumRetailPrice) {
    return null;
  }

  if (markupEligibleCosts <= 0) {
    return parsedRetailPrice === minimumRetailPrice ? MIN_RETAIL_MULTIPLIER : null;
  }

  const multiplier = (parsedRetailPrice - deliveryCosts) / markupEligibleCosts;
  if (multiplier < MIN_RETAIL_MULTIPLIER || multiplier > MAX_RETAIL_MULTIPLIER) {
    return null;
  }

  return roundMultiplier(multiplier);
}

export function isDeliveryCost(category: string) {
  return category === DELIVERY_COST_CATEGORY;
}

export function calculateCustomerLineAmount(amount: number, category: string, multiplier: number) {
  return roundCurrency(isDeliveryCost(category) ? amount : amount * multiplier);
}

export function calculateProjectPricing(lines: ProjectPricingLine[], multiplier: number) {
  const deliveryCosts = roundCurrency(
    lines.filter((line) => isDeliveryCost(line.category)).reduce((total, line) => total + line.amount, 0),
  );
  const markupEligibleCosts = roundCurrency(
    lines.filter((line) => !isDeliveryCost(line.category)).reduce((total, line) => total + line.amount, 0),
  );
  const totalCosts = roundCurrency(deliveryCosts + markupEligibleCosts);
  const targetRetailPrice = roundCurrency((markupEligibleCosts * multiplier) + deliveryCosts);
  let customerLineItems = lines.map((line) => ({
    id: line.id,
    description: line.vendorName,
    amount: calculateCustomerLineAmount(line.amount, line.category, multiplier),
    isDelivery: isDeliveryCost(line.category),
  }));
  const preliminaryRetailPrice = roundCurrency(customerLineItems.reduce((total, line) => total + line.amount, 0));
  const roundingDifference = roundCurrency(targetRetailPrice - preliminaryRetailPrice);
  let finalMarkupLineIndex = -1;
  customerLineItems.forEach((line, index) => {
    if (!line.isDelivery) finalMarkupLineIndex = index;
  });

  if (roundingDifference !== 0 && finalMarkupLineIndex >= 0) {
    customerLineItems = customerLineItems.map((line, index) => index === finalMarkupLineIndex
      ? { ...line, amount: roundCurrency(line.amount + roundingDifference) }
      : line);
  }

  const retailPrice = roundCurrency(customerLineItems.reduce((total, line) => total + line.amount, 0));
  const grossProfit = roundCurrency(retailPrice - totalCosts);
  const grossMargin = retailPrice > 0 ? (grossProfit / retailPrice) * 100 : 0;

  return {
    customerLineItems,
    deliveryCosts,
    grossMargin,
    grossProfit,
    markupEligibleCosts,
    retailPrice,
    totalCosts,
  };
}

export function upsertProjectCostLine<T extends { id: string }>(lines: T[], nextLine: T) {
  const existingLineIndex = lines.findIndex((line) => line.id === nextLine.id);

  if (existingLineIndex === -1) {
    return [...lines, nextLine];
  }

  return lines.map((line) => line.id === nextLine.id ? nextLine : line);
}

export function removeProjectCostLine<T extends { id: string }>(lines: T[], lineId: string) {
  return lines.filter((line) => line.id !== lineId);
}
