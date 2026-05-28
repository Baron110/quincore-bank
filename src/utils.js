// Generates a QuinCore account number
export function generateAccountNumber() {
  return `QC${Math.floor(100000000000 + Math.random() * 900000000000)}`;
}

// Returns account tier based on balance
export function getAccountType(balance) {
  if (balance >= 50000) return "Platinum";
  if (balance >= 10000) return "Gold";
  if (balance >= 2500)  return "Silver";
  return "Bronze";
}

// Formats a number as currency
export function fmt(amount, symbol = "$") {
  return `${symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Generates a transaction ID
export function generateTxnId() {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

// Returns current date and time strings
export function nowDateTime() {
  return {
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: new Date().toLocaleTimeString(),
  };
}

// Icon and color mapping for transaction types
export const TXN_META = {
  deposit:          { icon: "account_balance_wallet", color: "bg-primary-fixed" },
  sent:             { icon: "send",                   color: "bg-error-container" },
  received:         { icon: "payments",               color: "bg-secondary-container" },
  bill:             { icon: "bolt",                   color: "bg-tertiary-fixed" },
  request:          { icon: "request_quote",          color: "bg-secondary-fixed-dim" },
  request_received: { icon: "request_quote",          color: "bg-secondary-fixed-dim" },
};
