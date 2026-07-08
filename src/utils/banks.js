// Popular banks with SWIFT/BIC codes.
// `international` banks always show. Country-specific banks are appended.

export const INTERNATIONAL_BANKS = [
  { name: "HSBC",                    swift: "MIDLGB22" },
  { name: "Citibank",                swift: "CITIUS33" },
  { name: "JPMorgan Chase",          swift: "CHASUS33" },
  { name: "Bank of America",         swift: "BOFAUS3N" },
  { name: "Barclays",                swift: "BARCGB22" },
  { name: "Standard Chartered",      swift: "SCBLGB2L" },
  { name: "Deutsche Bank",           swift: "DEUTDEFF" },
  { name: "BNP Paribas",             swift: "BNPAFRPP" },
  { name: "Santander",               swift: "BSCHESMM" },
  { name: "UBS",                     swift: "UBSWCHZH80A" },
  { name: "Wells Fargo",             swift: "WFBIUS6S" },
  { name: "Revolut",                 swift: "REVOGB21" },
  { name: "Wise (TransferWise)",     swift: "TRWIGB2L" },
];

export const BANKS_BY_COUNTRY = {
  "Nigeria": [
    { name: "Access Bank",           swift: "ABNGNGLA" },
    { name: "Guaranty Trust Bank",   swift: "GTBINGLA" },
    { name: "Zenith Bank",           swift: "ZEIBNGLA" },
    { name: "First Bank of Nigeria", swift: "FBNINGLA" },
    { name: "United Bank for Africa",swift: "UNAFNGLA" },
    { name: "Stanbic IBTC Bank",     swift: "SBICNGLX" },
    { name: "Fidelity Bank",         swift: "FIDTNGLA" },
    { name: "Union Bank of Nigeria", swift: "UBNINGLA" },
    { name: "Sterling Bank",         swift: "NAMENGLA" },
    { name: "Kuda Bank",             swift: "KUDANGPC" },
    { name: "Opay",                  swift: "OPAYNGLA" },
    { name: "Moniepoint",            swift: "MONINGLA" },
  ],
  "United States": [
    { name: "JPMorgan Chase",        swift: "CHASUS33" },
    { name: "Bank of America",       swift: "BOFAUS3N" },
    { name: "Wells Fargo",           swift: "WFBIUS6S" },
    { name: "Citibank",              swift: "CITIUS33" },
    { name: "U.S. Bank",             swift: "USBKUS44" },
    { name: "PNC Bank",              swift: "PNCCUS33" },
    { name: "Capital One",           swift: "HIBKUS44" },
    { name: "Truist Bank",           swift: "BRBTUS33" },
    { name: "Chime",                 swift: "CHMEUS31" },
    { name: "Ally Bank",             swift: "ALLYUS31" },
  ],
  "United Kingdom": [
    { name: "Barclays",              swift: "BARCGB22" },
    { name: "HSBC UK",               swift: "HBUKGB4B" },
    { name: "Lloyds Bank",           swift: "LOYDGB2L" },
    { name: "NatWest",               swift: "NWBKGB2L" },
    { name: "Santander UK",          swift: "ABBYGB2L" },
    { name: "Halifax",               swift: "HLFXGB22" },
    { name: "Monzo",                 swift: "MONZGB2L" },
    { name: "Starling Bank",         swift: "SRLGGB3L" },
    { name: "Revolut",               swift: "REVOGB21" },
  ],
  "Canada": [
    { name: "Royal Bank of Canada",  swift: "ROYCCAT2" },
    { name: "TD Canada Trust",       swift: "TDOMCATTTOR" },
    { name: "Scotiabank",            swift: "NOSCCATT" },
    { name: "BMO Bank of Montreal",  swift: "BOFMCAM2" },
    { name: "CIBC",                  swift: "CIBCCATT" },
  ],
  "Ghana": [
    { name: "GCB Bank",              swift: "GHCBGHAC" },
    { name: "Ecobank Ghana",         swift: "ECOCGHAC" },
    { name: "Absa Bank Ghana",       swift: "BARCGHAC" },
    { name: "Fidelity Bank Ghana",   swift: "FBLIGHAC" },
    { name: "Stanbic Bank Ghana",    swift: "SBICGHAC" },
  ],
  "South Africa": [
    { name: "Standard Bank",         swift: "SBZAZAJJ" },
    { name: "FNB South Africa",      swift: "FIRNZAJJ" },
    { name: "ABSA Bank",             swift: "ABSAZAJJ" },
    { name: "Nedbank",               swift: "NEDSZAJJ" },
    { name: "Capitec Bank",          swift: "CABLZAJJ" },
  ],
  "Australia": [
    { name: "Commonwealth Bank",     swift: "CTBAAU2S" },
    { name: "ANZ Bank",              swift: "ANZBAU3M" },
    { name: "Westpac",               swift: "WPACAU2S" },
    { name: "NAB",                   swift: "NATAAU33" },
  ],
  "Germany": [
    { name: "Deutsche Bank",         swift: "DEUTDEFF" },
    { name: "Commerzbank",           swift: "COBADEFF" },
    { name: "N26",                   swift: "NTSBDEB1" },
    { name: "Sparkasse",             swift: "HELADEF1" },
  ],
  "India": [
    { name: "State Bank of India",   swift: "SBININBB" },
    { name: "HDFC Bank",             swift: "HDFCINBB" },
    { name: "ICICI Bank",            swift: "ICICINBB" },
    { name: "Axis Bank",             swift: "AXISINBB" },
    { name: "Kotak Mahindra Bank",   swift: "KKBKINBB" },
  ],
  "Kenya": [
    { name: "Equity Bank",           swift: "EQBLKENA" },
    { name: "KCB Bank",              swift: "KCBLKENX" },
    { name: "Co-operative Bank",     swift: "KCOOKENA" },
  ],
};

// Returns a de-duplicated list: user's local banks first, then international.
export function getBanksForCountry(country) {
  const local = BANKS_BY_COUNTRY[country] || [];
  const seen  = new Set(local.map(b => b.name));
  const intl  = INTERNATIONAL_BANKS.filter(b => !seen.has(b.name));
  return [
    ...local.map(b => ({ ...b, group: country })),
    ...intl.map(b => ({ ...b, group: "International" })),
  ];
}