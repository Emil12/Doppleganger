const MIN_CUSTOMER_DELAY = 18_000;
const MAX_CUSTOMER_DELAY = 30_000;
const MAX_NORMAL_CUSTOMERS = 1;
const BASE_ANOMALY_CHANCE = 0.7;
const ANOMALY_CHANCE_STEP = 0.2;
const MAX_ANOMALY_CHANCE = 0.95;

export function randomCustomerDelay() {
  const range = MAX_CUSTOMER_DELAY - MIN_CUSTOMER_DELAY + 1;
  return MIN_CUSTOMER_DELAY + Math.floor(Math.random() * range);
}

export function createAnomalySelector() {
  let normalCustomers = 0;

  return () => {
    const chance = Math.min(
      BASE_ANOMALY_CHANCE + normalCustomers * ANOMALY_CHANCE_STEP,
      MAX_ANOMALY_CHANCE,
    );
    const isAnomaly = normalCustomers >= MAX_NORMAL_CUSTOMERS || Math.random() < chance;
    normalCustomers = isAnomaly ? 0 : normalCustomers + 1;
    return isAnomaly;
  };
}
