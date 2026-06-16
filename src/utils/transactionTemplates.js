// Country-specific transaction templates
export const COUNTRY_TEMPLATES = {
  // ── Nigeria ────────────────────────────────────────────────────────────────
  "Nigeria": {
    debits: [
      { desc: "MTN Airtime Recharge",      cat: "Utilities",     icon: "phone",             color: "bg-secondary-container",    min: 500,   max: 5000   },
      { desc: "DSTV Subscription",         cat: "Entertainment", icon: "tv",                color: "bg-error-container",        min: 2900,  max: 24500  },
      { desc: "EKEDC Electricity Bill",    cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 5000,  max: 30000  },
      { desc: "Shoprite Purchase",         cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 3000,  max: 25000  },
      { desc: "Jumia Order",               cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 2000,  max: 50000  },
      { desc: "Bolt Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 800,   max: 5000   },
      { desc: "Chicken Republic",          cat: "Food & Drink",  icon: "restaurant",        color: "bg-tertiary-fixed-dim",     min: 1500,  max: 8000   },
      { desc: "Glo Data Subscription",     cat: "Utilities",     icon: "wifi",              color: "bg-secondary-container",    min: 1000,  max: 10000  },
      { desc: "Airtel Subscription",       cat: "Utilities",     icon: "phone",             color: "bg-error-container",        min: 500,   max: 5000   },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 50000, max: 300000 },
      { desc: "Lagos Water Board",         cat: "Bills",         icon: "water_drop",        color: "bg-tertiary-fixed",         min: 2000,  max: 8000   },
      { desc: "Fuel Purchase",             cat: "Transport",     icon: "local_gas_station", color: "bg-surface-container-high", min: 5000,  max: 30000  },
      { desc: "Mr Biggs",                  cat: "Food & Drink",  icon: "fastfood",          color: "bg-tertiary-fixed-dim",     min: 1200,  max: 6000   },
      { desc: "Konga Purchase",            cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 3000,  max: 40000  },
      { desc: "Showmax Subscription",      cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 1200,  max: 2900   },
    ],
    credits: [
      { desc: "Salary — Company Credit",   cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 80000,  max: 500000 },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 20000,  max: 200000 },
      { desc: "Transfer Received",         cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 5000,   max: 100000 },
      { desc: "Business Revenue",          cat: "Income",  icon: "storefront",             color: "bg-primary-fixed",       min: 30000,  max: 300000 },
      { desc: "Refund — Jumia",            cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 2000,   max: 30000  },
    ],
  },

  // ── United States ──────────────────────────────────────────────────────────
  "United States": {
    debits: [
      { desc: "Walmart Grocery",           cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 40,    max: 250    },
      { desc: "Netflix Subscription",      cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 15,    max: 23     },
      { desc: "Amazon Purchase",           cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 20,    max: 400    },
      { desc: "Uber Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 8,     max: 45     },
      { desc: "Starbucks Coffee",          cat: "Food & Drink",  icon: "coffee",            color: "bg-tertiary-fixed-dim",     min: 5,     max: 18     },
      { desc: "AT&T Phone Bill",           cat: "Bills",         icon: "phone",             color: "bg-tertiary-fixed",         min: 60,    max: 120    },
      { desc: "Apple Store",               cat: "Shopping",      icon: "phone_iphone",      color: "bg-secondary-container",    min: 50,    max: 1200   },
      { desc: "Spotify Premium",           cat: "Entertainment", icon: "music_note",        color: "bg-error-container",        min: 10,    max: 16     },
      { desc: "McDonald's",                cat: "Food & Drink",  icon: "fastfood",          color: "bg-tertiary-fixed-dim",     min: 8,     max: 30     },
      { desc: "Con Edison Electric Bill",  cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 80,    max: 200    },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 1200,  max: 4000   },
      { desc: "Chevron Gas Station",       cat: "Transport",     icon: "local_gas_station", color: "bg-surface-container-high", min: 40,    max: 100    },
      { desc: "Whole Foods Market",        cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 60,    max: 300    },
      { desc: "Hulu Subscription",         cat: "Entertainment", icon: "tv",                color: "bg-error-container",        min: 8,     max: 18     },
      { desc: "Planet Fitness",            cat: "Health",        icon: "fitness_center",    color: "bg-secondary-fixed-dim",    min: 10,    max: 30     },
    ],
    credits: [
      { desc: "Direct Deposit — Payroll",  cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 2000,  max: 8000   },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 300,   max: 3000   },
      { desc: "Zelle Transfer Received",   cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,   max: 2000   },
      { desc: "Tax Refund",                cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 500,   max: 4000   },
      { desc: "Refund — Amazon",           cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 10,    max: 300    },
    ],
  },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  "United Kingdom": {
    debits: [
      { desc: "Tesco Grocery",             cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 20,    max: 150    },
      { desc: "BBC TV Licence",            cat: "Bills",         icon: "tv",                color: "bg-tertiary-fixed",         min: 13,    max: 13     },
      { desc: "BT Broadband",              cat: "Bills",         icon: "wifi",              color: "bg-tertiary-fixed",         min: 30,    max: 60     },
      { desc: "Uber Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 8,     max: 40     },
      { desc: "Pret A Manger",             cat: "Food & Drink",  icon: "coffee",            color: "bg-tertiary-fixed-dim",     min: 4,     max: 15     },
      { desc: "Amazon UK Purchase",        cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 15,    max: 200    },
      { desc: "Sainsbury's",               cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 25,    max: 120    },
      { desc: "Sky TV Subscription",       cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 25,    max: 70     },
      { desc: "TfL Oyster Card",           cat: "Transport",     icon: "train",             color: "bg-surface-container-high", min: 5,     max: 50     },
      { desc: "EDF Energy Bill",           cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 60,    max: 200    },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 800,   max: 3000   },
      { desc: "Waitrose",                  cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 30,    max: 150    },
      { desc: "Greggs",                    cat: "Food & Drink",  icon: "fastfood",          color: "bg-tertiary-fixed-dim",     min: 2,     max: 8      },
      { desc: "Netflix UK",                cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 10,    max: 18     },
      { desc: "PureGym Membership",        cat: "Health",        icon: "fitness_center",    color: "bg-secondary-fixed-dim",    min: 20,    max: 40     },
    ],
    credits: [
      { desc: "BACS Salary Payment",       cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 1500,  max: 6000   },
      { desc: "Freelance — HMRC",          cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 200,   max: 3000   },
      { desc: "Bank Transfer Received",    cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 50,    max: 1500   },
      { desc: "HMRC Tax Refund",           cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 100,   max: 2000   },
      { desc: "Refund — Amazon UK",        cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 5,     max: 200    },
    ],
  },

  // ── Ghana ──────────────────────────────────────────────────────────────────
  "Ghana": {
    debits: [
      { desc: "MTN Mobile Money",          cat: "Utilities",     icon: "phone",             color: "bg-secondary-container",    min: 20,    max: 500    },
      { desc: "ECG Electricity Bill",      cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 100,   max: 500    },
      { desc: "Shoprite Ghana",            cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 50,    max: 400    },
      { desc: "Bolt Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 15,    max: 80     },
      { desc: "Melcom Purchase",           cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 50,    max: 600    },
      { desc: "Vodafone Ghana Data",       cat: "Utilities",     icon: "wifi",              color: "bg-secondary-container",    min: 20,    max: 200    },
      { desc: "MultiChoice DStv",          cat: "Entertainment", icon: "tv",                color: "bg-error-container",        min: 50,    max: 250    },
      { desc: "Accra Mall Shopping",       cat: "Shopping",      icon: "storefront",        color: "bg-secondary-container",    min: 100,   max: 800    },
      { desc: "KFC Ghana",                 cat: "Food & Drink",  icon: "fastfood",          color: "bg-tertiary-fixed-dim",     min: 30,    max: 150    },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 500,   max: 3000   },
    ],
    credits: [
      { desc: "Salary Payment",            cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 1000,  max: 8000   },
      { desc: "Business Revenue",          cat: "Income",  icon: "storefront",             color: "bg-primary-fixed",       min: 500,   max: 5000   },
      { desc: "MoMo Transfer Received",    cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,   max: 2000   },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 200,   max: 3000   },
      { desc: "Refund",                    cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 20,    max: 300    },
    ],
  },

  // ── South Africa ───────────────────────────────────────────────────────────
  "South Africa": {
    debits: [
      { desc: "Checkers Grocery",          cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 200,   max: 2000   },
      { desc: "Eskom Electricity",         cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 500,   max: 2000   },
      { desc: "MultiChoice DStv",          cat: "Entertainment", icon: "tv",                color: "bg-error-container",        min: 120,   max: 850    },
      { desc: "Takealot Purchase",         cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 100,   max: 3000   },
      { desc: "Uber Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 50,    max: 300    },
      { desc: "KFC South Africa",          cat: "Food & Drink",  icon: "fastfood",          color: "bg-tertiary-fixed-dim",     min: 80,    max: 250    },
      { desc: "Vodacom Data Bundle",       cat: "Utilities",     icon: "wifi",              color: "bg-secondary-container",    min: 99,    max: 499    },
      { desc: "Pick n Pay",                cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 150,   max: 1500   },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 3000,  max: 15000  },
      { desc: "Shell Fuel Station",        cat: "Transport",     icon: "local_gas_station", color: "bg-surface-container-high", min: 300,   max: 1200   },
    ],
    credits: [
      { desc: "Salary — EFT Payment",      cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 8000,  max: 50000  },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 2000,  max: 20000  },
      { desc: "EFT Transfer Received",     cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 500,   max: 10000  },
      { desc: "SARS Tax Refund",           cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 1000,  max: 15000  },
      { desc: "Refund — Takealot",         cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 100,   max: 2000   },
    ],
  },

  // ── Canada ─────────────────────────────────────────────────────────────────
  "Canada": {
    debits: [
      { desc: "Loblaw Grocery",            cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 50,    max: 300    },
      { desc: "Netflix Canada",            cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 10,    max: 20     },
      { desc: "Tim Hortons",               cat: "Food & Drink",  icon: "coffee",            color: "bg-tertiary-fixed-dim",     min: 3,     max: 15     },
      { desc: "Rogers Phone Bill",         cat: "Bills",         icon: "phone",             color: "bg-tertiary-fixed",         min: 60,    max: 120    },
      { desc: "Hydro One Electric Bill",   cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 80,    max: 200    },
      { desc: "Amazon Canada",             cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 20,    max: 300    },
      { desc: "Uber Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 10,    max: 50     },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 1500,  max: 4000   },
      { desc: "Spotify Canada",            cat: "Entertainment", icon: "music_note",        color: "bg-error-container",        min: 10,    max: 15     },
      { desc: "Petro-Canada Fuel",         cat: "Transport",     icon: "local_gas_station", color: "bg-surface-container-high", min: 60,    max: 150    },
    ],
    credits: [
      { desc: "Direct Deposit — Payroll",  cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 2500,  max: 9000   },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 500,   max: 5000   },
      { desc: "Interac e-Transfer",        cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,   max: 3000   },
      { desc: "CRA Tax Refund",            cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 500,   max: 5000   },
      { desc: "Refund — Amazon",           cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 10,    max: 200    },
    ],
  },

  // ── Australia ──────────────────────────────────────────────────────────────
  "Australia": {
    debits: [
      { desc: "Woolworths Grocery",        cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 50,    max: 300    },
      { desc: "Netflix Australia",         cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 10,    max: 22     },
      { desc: "Optus Phone Bill",          cat: "Bills",         icon: "phone",             color: "bg-tertiary-fixed",         min: 40,    max: 100    },
      { desc: "AGL Energy Bill",           cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 100,   max: 350    },
      { desc: "Uber Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 10,    max: 50     },
      { desc: "JB Hi-Fi Purchase",         cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 50,    max: 800    },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 1500,  max: 5000   },
      { desc: "Coles Grocery",             cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 40,    max: 250    },
      { desc: "Stan Subscription",         cat: "Entertainment", icon: "tv",                color: "bg-error-container",        min: 10,    max: 19     },
      { desc: "BP Fuel Station",           cat: "Transport",     icon: "local_gas_station", color: "bg-surface-container-high", min: 60,    max: 150    },
    ],
    credits: [
      { desc: "Salary — Direct Credit",    cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 3000,  max: 10000  },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 500,   max: 5000   },
      { desc: "PayID Transfer Received",   cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,   max: 3000   },
      { desc: "ATO Tax Refund",            cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 500,   max: 5000   },
      { desc: "Refund",                    cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 20,    max: 300    },
    ],
  },

  // ── Germany / Europe (EUR) ─────────────────────────────────────────────────
  "Germany": {
    debits: [
      { desc: "REWE Grocery",              cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 30,    max: 200    },
      { desc: "Netflix Germany",           cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 10,    max: 18     },
      { desc: "Deutsche Telekom",          cat: "Bills",         icon: "phone",             color: "bg-tertiary-fixed",         min: 30,    max: 80     },
      { desc: "Vattenfall Energy",         cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 60,    max: 200    },
      { desc: "Uber Ride",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 8,     max: 40     },
      { desc: "Zalando Purchase",          cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 30,    max: 300    },
      { desc: "Rent (Miete)",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 800,   max: 3000   },
      { desc: "Amazon.de Purchase",        cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 20,    max: 300    },
      { desc: "DB Bahn Ticket",            cat: "Transport",     icon: "train",             color: "bg-surface-container-high", min: 15,    max: 120    },
      { desc: "Lidl Grocery",              cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 20,    max: 150    },
    ],
    credits: [
      { desc: "Gehalt (Salary)",           cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 2000,  max: 7000   },
      { desc: "Freelance Zahlung",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 500,   max: 4000   },
      { desc: "SEPA Transfer Received",    cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,   max: 3000   },
      { desc: "Steuererstattung (Tax)",    cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 200,   max: 3000   },
      { desc: "Erstattung (Refund)",       cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 10,    max: 200    },
    ],
  },

  // ── India ──────────────────────────────────────────────────────────────────
  "India": {
    debits: [
      { desc: "Jio Recharge",              cat: "Utilities",     icon: "phone",             color: "bg-secondary-container",    min: 149,   max: 999    },
      { desc: "BigBasket Order",           cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 300,   max: 3000   },
      { desc: "Netflix India",             cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 149,   max: 649    },
      { desc: "Amazon India",              cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 200,   max: 5000   },
      { desc: "Ola Ride",                  cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 80,    max: 500    },
      { desc: "Swiggy Food Order",         cat: "Food & Drink",  icon: "fastfood",          color: "bg-tertiary-fixed-dim",     min: 150,   max: 800    },
      { desc: "BSES Electricity Bill",     cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 500,   max: 3000   },
      { desc: "Rent Payment",              cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 10000, max: 60000  },
      { desc: "Hotstar Subscription",      cat: "Entertainment", icon: "tv",                color: "bg-error-container",        min: 299,   max: 1499   },
      { desc: "Zomato Order",              cat: "Food & Drink",  icon: "restaurant",        color: "bg-tertiary-fixed-dim",     min: 200,   max: 1000   },
    ],
    credits: [
      { desc: "Salary Credit",             cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 30000, max: 200000 },
      { desc: "Freelance Payment",         cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 5000,  max: 50000  },
      { desc: "UPI Transfer Received",     cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 1000,  max: 20000  },
      { desc: "IT Refund",                 cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 2000,  max: 30000  },
      { desc: "Refund — Amazon",           cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 200,   max: 5000   },
    ],
  },
};

// Default templates for countries not specifically listed
export const DEFAULT_TEMPLATES = {
  debits: [
    { desc: "Grocery Store",              cat: "Shopping",      icon: "shopping_cart",     color: "bg-secondary-container",    min: 20,    max: 200    },
    { desc: "Streaming Subscription",     cat: "Entertainment", icon: "subscriptions",     color: "bg-error-container",        min: 10,    max: 25     },
    { desc: "Phone Bill",                 cat: "Bills",         icon: "phone",             color: "bg-tertiary-fixed",         min: 30,    max: 100    },
    { desc: "Electricity Bill",           cat: "Bills",         icon: "bolt",              color: "bg-tertiary-fixed",         min: 50,    max: 200    },
    { desc: "Ride Share",                 cat: "Transport",     icon: "directions_car",    color: "bg-surface-container-high", min: 8,     max: 50     },
    { desc: "Online Shopping",            cat: "Shopping",      icon: "shopping_bag",      color: "bg-secondary-container",    min: 20,    max: 300    },
    { desc: "Restaurant",                 cat: "Food & Drink",  icon: "restaurant",        color: "bg-tertiary-fixed-dim",     min: 10,    max: 80     },
    { desc: "Fuel Station",               cat: "Transport",     icon: "local_gas_station", color: "bg-surface-container-high", min: 30,    max: 100    },
    { desc: "Rent Payment",               cat: "Housing",       icon: "home",              color: "bg-primary-fixed",          min: 500,   max: 3000   },
    { desc: "Internet Bill",              cat: "Bills",         icon: "wifi",              color: "bg-tertiary-fixed",         min: 30,    max: 80     },
  ],
  credits: [
    { desc: "Salary Deposit",             cat: "Income",  icon: "account_balance_wallet", color: "bg-primary-fixed",       min: 1000,  max: 8000   },
    { desc: "Freelance Payment",          cat: "Income",  icon: "work",                   color: "bg-primary-fixed",       min: 200,   max: 3000   },
    { desc: "Bank Transfer Received",     cat: "Transfer",icon: "payments",               color: "bg-secondary-container", min: 100,   max: 2000   },
    { desc: "Bonus Payment",              cat: "Income",  icon: "stars",                  color: "bg-primary-fixed",       min: 100,   max: 2000   },
    { desc: "Refund",                     cat: "Refund",  icon: "replay",                 color: "bg-secondary-container", min: 10,    max: 200    },
  ],
};

export function getTemplatesForCountry(country) {
  return COUNTRY_TEMPLATES[country] || DEFAULT_TEMPLATES;
}

export function generateTransactionsForCountry(balance, country, startDate, endDate) {
  const templates  = getTemplatesForCountry(country);
  const start      = new Date(startDate);
  const end        = new Date(endDate);
  const dayRange   = Math.max(1, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  const count      = Math.min(Math.max(10, Math.floor(dayRange / 3)), 30);

  const transactions = [];
  let runningBalance = balance;

  for (let i = 0; i < count; i++) {
    const isCredit  = Math.random() > 0.55;
    const list      = isCredit ? templates.credits : templates.debits;
    const template  = list[Math.floor(Math.random() * list.length)];
    const amount    = Math.round((Math.random() * (template.max - template.min) + template.min) * 100) / 100;

    if (!isCredit && amount > runningBalance * 0.8) continue;
    runningBalance = isCredit ? runningBalance + amount : runningBalance - amount;

    // Random date within range
    const randomDay = Math.floor(Math.random() * dayRange);
    const txDate    = new Date(start.getTime() + randomDay * 24 * 60 * 60 * 1000);

    transactions.push({
      id:          `TXN${Date.now()}${i}${Math.floor(Math.random() * 9999)}`,
      type:        isCredit ? "received" : "sent",
      amount,
      description: template.desc,
      date:        txDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time:        `${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00 ${Math.random() > 0.5 ? "AM" : "PM"}`,
      status:      "Completed",
      category:    template.cat,
      icon:        template.icon,
      color:       template.color,
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}