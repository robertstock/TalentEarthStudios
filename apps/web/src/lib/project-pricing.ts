export const DELIVERY_COST_CATEGORY = "COURIER_FREIGHT";

export interface ProjectPricingLine {
  id: string;
  amount: number;
  category: string;
  vendorName: string;
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
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
  const customerLineItems = lines.map((line) => ({
    id: line.id,
    description: line.vendorName,
    amount: calculateCustomerLineAmount(line.amount, line.category, multiplier),
    isDelivery: isDeliveryCost(line.category),
  }));
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
