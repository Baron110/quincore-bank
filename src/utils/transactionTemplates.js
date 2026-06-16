// ── Name pools per region ─────────────────────────────────────────────────────
const NAMES = {
  Nigeria: [
    "Chukwuemeka Obi", "Adaeze Nwosu", "Emeka Eze", "Ngozi Okonkwo", "Tunde Bakare",
    "Bisi Adeyemi", "Kemi Oladele", "Seun Afolabi", "Chidi Okeke", "Amaka Nzekwe",
    "Femi Ogunleye", "Ify Anyanwu", "Dele Awosika", "Sola Adesanya", "Yemi Abiodun",
    "Obinna Nwosu", "Chisom Eze", "Rotimi Adegoke", "Funke Ajayi", "Uche Okafor",
  ],
  "United States": [
    "Marcus Johnson", "Sarah Williams", "James Thompson", "Emily Davis", "Michael Brown",
    "Ashley Martinez", "Robert Wilson", "Jennifer Anderson", "David Taylor", "Jessica Moore",
    "Christopher Jackson", "Amanda White", "Matthew Harris", "Stephanie Lewis", "Daniel Clark",
    "Nicole Robinson", "Joshua Walker", "Megan Hall", "Andrew Young", "Brittany King",
  ],
  "United Kingdom": [
    "Oliver Smith", "Emma Jones", "Harry Williams", "Sophie Taylor", "Jack Brown",
    "Isabella Davies", "George Evans", "Mia Wilson", "Charlie Thomas", "Amelia Roberts",
    "James Johnson", "Lily Robinson", "William White", "Ella Lewis", "Thomas Walker",
    "Grace Hall", "Benjamin Green", "Hannah Young", "Samuel King", "Lucy Wright",
  ],
  Ghana: [
    "Kwame Mensah", "Akosua Asante", "Kofi Boateng", "Abena Owusu", "Kweku Amoah",
    "Ama Darko", "Yaw Osei", "Efua Aidoo", "Nana Adjei", "Adwoa Amponsah",
    "Kojo Frimpong", "Adjoa Gyasi", "Fiifi Ansah", "Maame Dankwa", "Kobby Tetteh",
  ],
  "South Africa": [
    "Sipho Dlamini", "Nomsa Khumalo", "Thabo Nkosi", "Zanele Mokoena", "Bongani Zulu",
    "Lerato Molefe", "Themba Ndlovu", "Palesa Sithole", "Lungelo Mthembu", "Ayanda Ntuli",
    "Dylan van der Berg", "Chloé Botha", "Ryan Pretorius", "Megan Venter", "Liam Joubert",
  ],
  Canada: [
    "Liam MacDonald", "Emma Tremblay", "Noah Gagnon", "Olivia Côté", "William Leblanc",
    "Ava Roy", "James Bouchard", "Sophie Lavoie", "Benjamin Gauthier", "Charlotte Fortin",
    "Ethan Morin", "Mia Ouellet", "Alexander Hébert", "Isabelle Girard", "Lucas Lefebvre",
  ],
  Australia: [
    "Liam Smith", "Olivia Jones", "Noah Williams", "Ava Brown", "Jack Wilson",
    "Charlotte Taylor", "Oliver Johnson", "Mia White", "William Martin", "Amelia Thompson",
    "James Anderson", "Grace Moore", "Henry Martin", "Chloe Jackson", "George Harris",
  ],
  Germany: [
    "Lukas Müller", "Anna Schmidt", "Felix Weber", "Laura Fischer", "Jonas Meyer",
    "Julia Wagner", "Maximilian Becker", "Lena Schulz", "David Hofmann", "Sarah Richter",
    "Tim Koch", "Hannah Bauer", "Leon Schäfer", "Sophie Zimmermann", "Moritz Braun",
  ],
  India: [
    "Arjun Sharma", "Priya Patel", "Rahul Singh", "Pooja Gupta", "Vikram Kumar",
    "Anjali Verma", "Rohit Mehta", "Deepa Nair", "Sanjay Reddy", "Sneha Iyer",
    "Amit Joshi", "Kavya Menon", "Nikhil Rao", "Shreya Pillai", "Karthik Nair",
  ],
  default: [
    "Alex Morgan", "Jordan Lee", "Taylor Smith", "Casey Brown", "Riley Davis",
    "Morgan Wilson", "Quinn Johnson", "Blake Anderson", "Avery Martinez", "Drew Thompson",
  ],
};

const COMPANIES = {
  Nigeria: [
    "Dangote Industries", "GTBank Nigeria", "Access Bank", "First Bank Nigeria",
    "Zenith Bank", "MTN Nigeria", "Airtel Nigeria", "UBA Nigeria", "Stanbic IBTC",
  ],
  "United States": [
    "Goldman Sachs", "JP Morgan Chase", "Google LLC", "Apple Inc", "Amazon Corp",
    "Microsoft Corp", "Deloitte & Touche", "PricewaterhouseCoopers", "McKinsey & Co",
  ],
  "United Kingdom": [
    "Barclays Bank", "HSBC UK", "Lloyds Banking Group", "NatWest Group",
    "Deloitte UK", "PwC UK", "British Airways", "BT Group", "Unilever UK",
  ],
  Ghana: [
    "Ghana Commercial Bank", "Ecobank Ghana", "Standard Chartered Ghana",
    "MTN Ghana", "Vodafone Ghana", "Ghana Revenue Authority",
  ],
  "South Africa": [
    "Standard Bank SA", "FNB South Africa", "Nedbank", "ABSA Bank",
    "Capitec Bank", "Vodacom SA", "MTN South Africa", "Telkom SA",
  ],
  Canada: [
    "Royal Bank of Canada", "TD Canada Trust", "Scotiabank", "CIBC",
    "BMO Financial Group", "Government of Canada", "Air Canada",
  ],
  Australia: [
    "Commonwealth Bank", "ANZ Bank", "Westpac Banking", "NAB Australia",
    "Qantas Airways", "BHP Group", "Telstra Corp",
  ],
  Germany: [
    "Deutsche Bank", "Commerzbank", "Volkswagen AG", "BMW Group",
    "Siemens AG", "SAP SE", "Allianz Group",
  ],
  India: [
    "State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank",
    "Infosys Ltd", "Tata Consultancy", "Wipro Technologies", "Reliance Industries",
  ],
  default: [
    "Global Finance Corp", "Metro Bank", "City Employers Ltd",
    "Digital Solutions Inc", "Premier Services Group",
  ],
};

const BILLS = {
  Nigeria: [
    { desc: "EKEDC Electricity Token",   cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 5000,  max: 30000  },
    { desc: "MTN Airtime & Data",        cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 1000,  max: 10000  },
    { desc: "DSTV Subscription",         cat: "Bills", icon: "tv",         color: "bg-error-container",        min: 2900,  max: 24500  },
    { desc: "Lagos Water Corporation",   cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 2000,  max: 8000   },
    { desc: "Airtel Data Bundle",        cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 1000,  max: 8000   },
    { desc: "Glo Monthly Plan",          cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 500,   max: 5000   },
    { desc: "Showmax Subscription",      cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 1200,  max: 2900   },
  ],
  "United States": [
    { desc: "Con Edison Electric Bill",  cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 80,    max: 220    },
    { desc: "Verizon Wireless",          cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 60,    max: 150    },
    { desc: "Netflix Subscription",      cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 15,    max: 23     },
    { desc: "AT&T Internet",             cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 50,    max: 100    },
    { desc: "National Gas & Water",      cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 40,    max: 120    },
    { desc: "Spotify Premium",           cat: "Bills", icon: "music_note", color: "bg-error-container",        min: 10,    max: 16     },
    { desc: "Hulu + Live TV",            cat: "Bills", icon: "tv",         color: "bg-error-container",        min: 8,     max: 76     },
  ],
  "United Kingdom": [
    { desc: "EDF Energy Bill",           cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 60,    max: 200    },
    { desc: "BT Broadband",              cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 30,    max: 60     },
    { desc: "Sky TV & Broadband",        cat: "Bills", icon: "tv",         color: "bg-error-container",        min: 25,    max: 80     },
    { desc: "Thames Water",              cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 30,    max: 80     },
    { desc: "BBC TV Licence",            cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 13,    max: 13     },
    { desc: "O2 Monthly Plan",           cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 20,    max: 60     },
    { desc: "Netflix UK",                cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 10,    max: 18     },
  ],
  Ghana: [
    { desc: "ECG Electricity Bill",      cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 80,    max: 500    },
    { desc: "MTN Mobile Money",          cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 20,    max: 300    },
    { desc: "Vodafone Data Bundle",      cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 20,    max: 200    },
    { desc: "MultiChoice DStv",          cat: "Bills", icon: "tv",         color: "bg-error-container",        min: 50,    max: 250    },
    { desc: "Ghana Water Company",       cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 30,    max: 150    },
  ],
  "South Africa": [
    { desc: "Eskom Electricity",         cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 500,   max: 2000   },
    { desc: "Vodacom Monthly Plan",      cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 200,   max: 600    },
    { desc: "MultiChoice DStv",          cat: "Bills", icon: "tv",         color: "bg-error-container",        min: 120,   max: 850    },
    { desc: "City of Cape Town Water",   cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 200,   max: 800    },
    { desc: "Telkom Fibre",              cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 400,   max: 1000   },
  ],
  Canada: [
    { desc: "Hydro One Electric",        cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 80,    max: 250    },
    { desc: "Rogers Wireless",           cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 60,    max: 120    },
    { desc: "Netflix Canada",            cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 10,    max: 20     },
    { desc: "Bell Internet",             cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 50,    max: 100    },
    { desc: "City Water & Sewage",       cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 40,    max: 120    },
  ],
  Australia: [
    { desc: "AGL Energy Bill",           cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 100,   max: 400    },
    { desc: "Optus Mobile Plan",         cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 40,    max: 100    },
    { desc: "Netflix Australia",         cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 10,    max: 22     },
    { desc: "Sydney Water",              cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 60,    max: 200    },
    { desc: "Telstra Internet",          cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 50,    max: 110    },
  ],
  Germany: [
    { desc: "Vattenfall Strom",          cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 60,    max: 200    },
    { desc: "Deutsche Telekom",          cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 30,    max: 80     },
    { desc: "Netflix Deutschland",       cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 10,    max: 18     },
    { desc: "Berliner Wasserbetriebe",   cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 40,    max: 120    },
    { desc: "O2 Mobilfunk",             cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 20,    max: 60     },
  ],
  India: [
    { desc: "BSES Electricity Bill",     cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 500,   max: 5000   },
    { desc: "Jio Recharge",              cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 149,   max: 999    },
    { desc: "Netflix India",             cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 149,   max: 649    },
    { desc: "Airtel Broadband",          cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 499,   max: 1499   },
    { desc: "Municipal Water Bill",      cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 200,   max: 1000   },
  ],
  default: [
    { desc: "Electricity Bill",          cat: "Bills", icon: "bolt",       color: "bg-tertiary-fixed",         min: 50,    max: 200    },
    { desc: "Phone Bill",                cat: "Bills", icon: "phone",      color: "bg-secondary-container",    min: 30,    max: 100    },
    { desc: "Streaming Subscription",    cat: "Bills", icon: "subscriptions", color: "bg-error-container",    min: 10,    max: 25     },
    { desc: "Water Bill",                cat: "Bills", icon: "water_drop", color: "bg-tertiary-fixed",         min: 30,    max: 100    },
    { desc: "Internet Bill",             cat: "Bills", icon: "wifi",       color: "bg-secondary-container",    min: 30,    max: 80     },
  ],
};

const RENT = {
  Nigeria:          { min: 50000,  max: 300000 },
  "United States":  { min: 1200,   max: 4500   },
  "United Kingdom": { min: 800,    max: 3500   },
  Ghana:            { min: 500,    max: 4000   },
  "South Africa":   { min: 3000,   max: 18000  },
  Canada:           { min: 1500,   max: 4000   },
  Australia:        { min: 1500,   max: 5000   },
  Germany:          { min: 700,    max: 3000   },
  India:            { min: 8000,   max: 80000  },
  default:          { min: 500,    max: 3000   },
};

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randAmount(min, max) { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }
function randTime() {
  const h = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
  const m = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${h}:${m}:00 ${Math.random() > 0.5 ? "AM" : "PM"}`;
}
function randDateInRange(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s));
}
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function generateTransactionsForCountry(balance, country, startDate, endDate) {
  const names     = NAMES[country]     || NAMES.default;
  const companies = COMPANIES[country] || COMPANIES.default;
  const bills     = BILLS[country]     || BILLS.default;
  const rent      = RENT[country]      || RENT.default;

  const dayRange  = Math.max(1, Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  const count     = Math.min(Math.max(12, Math.floor(dayRange / 2.5)), 35);

  const transactions = [];
  let runningBalance = balance;

  // Always start with salary
  const salaryAmount = randAmount(
    (rent.min * 3),
    Math.max(rent.min * 6, balance * 0.4)
  );
  const salaryCompany = getRandom(companies);
  transactions.push({
    id:          `TXN${Date.now()}SAL`,
    type:        "received",
    amount:      salaryAmount,
    description: `Salary — ${salaryCompany}`,
    date:        formatDate(randDateInRange(startDate, endDate)),
    time:        "09:00:00 AM",
    status:      "Completed",
    category:    "Income",
    icon:        "account_balance_wallet",
    color:       "bg-primary-fixed",
  });
  runningBalance += salaryAmount;

  // Always add rent
  const rentAmount = randAmount(rent.min, rent.max);
  if (rentAmount < runningBalance * 0.6) {
    transactions.push({
      id:          `TXN${Date.now()}RENT`,
      type:        "sent",
      amount:      rentAmount,
      description: "Rent Payment",
      date:        formatDate(randDateInRange(startDate, endDate)),
      time:        "10:00:00 AM",
      status:      "Completed",
      category:    "Housing",
      icon:        "home",
      color:       "bg-primary-fixed",
    });
    runningBalance -= rentAmount;
  }

  // Fill remaining transactions
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let txn;

    if (roll < 0.25) {
      // Money received from a person
      const name   = getRandom(names);
      const amount = randAmount(runningBalance * 0.02, runningBalance * 0.15);
      runningBalance += amount;
      txn = {
        type:        "received",
        amount,
        description: `Transfer from ${name}`,
        category:    "Transfer",
        icon:        "payments",
        color:       "bg-secondary-container",
      };
    } else if (roll < 0.50) {
      // Money sent to a person
      const name   = getRandom(names);
      const amount = randAmount(runningBalance * 0.01, runningBalance * 0.12);
      if (amount > runningBalance * 0.5) continue;
      runningBalance -= amount;
      txn = {
        type:        "sent",
        amount,
        description: `Transfer to ${name}`,
        category:    "Transfer",
        icon:        "send",
        color:       "bg-error-container",
      };
    } else if (roll < 0.75) {
      // Bill payment
      const bill   = getRandom(bills);
      const amount = randAmount(bill.min, bill.max);
      if (amount > runningBalance * 0.5) continue;
      runningBalance -= amount;
      txn = {
        type:        "bill",
        amount,
        description: bill.desc,
        category:    bill.cat,
        icon:        bill.icon,
        color:       bill.color,
      };
    } else {
      // Freelance / extra income
      const amount = randAmount(runningBalance * 0.03, runningBalance * 0.2);
      runningBalance += amount;
      txn = {
        type:        "received",
        amount,
        description: `Freelance Payment — ${getRandom(companies)}`,
        category:    "Income",
        icon:        "work",
        color:       "bg-primary-fixed",
      };
    }

    const txDate = randDateInRange(startDate, endDate);
    transactions.push({
      id:     `TXN${Date.now()}${i}${Math.floor(Math.random() * 9999)}`,
      status: "Completed",
      date:   formatDate(txDate),
      time:   randTime(),
      ...txn,
    });
  }

  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}