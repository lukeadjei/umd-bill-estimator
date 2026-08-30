// Shapes returned by each page-fetching function -- one per staging table's
// columns, minus id/scraped_at/academic_year_id (added when writing to staging,
// not part of what's actually scraped off the page).

export type ScrapedTuitionRate = {
  residency: "resident" | "non_resident";
  fullTimeRate: number;
  perCreditRate: number;
};

export type ScrapedDifferentialTuition = {
  fullTimeRate: number;
  perCreditRate: number;
};

export type ScrapedMandatoryFee = {
  partTimeRate: number;
  fullTimeRate: number;
};

export type ScrapedHealthInsuranceRate = {
  fallPrice: number;
  springPrice: number;
};

export type ScrapedAcademicYearThresholds = {
  undergradTuitionFullTimeCreditThreshold: number;
  fullTimeFeeCreditThreshold: number;
};

// Link group 1: undergrad tuition, differential tuition, mandatory fees,
// health insurance, and the undergrad-side credit thresholds -- all on one page.
export type UndergraduateTuitionPageData = {
  tuitionRates: ScrapedTuitionRate[];
  differentialTuition: ScrapedDifferentialTuition;
  mandatoryFees: ScrapedMandatoryFee;
  healthInsurance: ScrapedHealthInsuranceRate;
  thresholds: ScrapedAcademicYearThresholds;
};

export type ScrapedGraduateTuitionRate = {
  residency: "resident" | "non_resident";
  perCreditRate: number;
};

export type ScrapedGraduateFee = {
  partTimeRate: number;
  fullTimeRate: number;
};

// Link group 2: graduate tuition + graduate mandatory fees.
export type GraduateTuitionPageData = {
  tuitionRates: ScrapedGraduateTuitionRate[];
  fees: ScrapedGraduateFee;
};

export type ScrapedHousingRate = {
  roomType: string;
  buildingCategory: string;
  rate: number;
};

// Link group 3: housing rates.
export type HousingRatesPageData = {
  housingRates: ScrapedHousingRate[];
};

export type ScrapedResidentDiningPlan = {
  planName: string;
  diningDollars: number;
  guestPasses: number;
  fallPrice: number;
  springPrice: number;
};

// Link group 4: resident dining plan tiers.
export type ResidentDiningPlansPageData = {
  plans: ScrapedResidentDiningPlan[];
};

export type ScrapedBlockDiningPlan = {
  planLabel: string;
  mealCount: number;
  diningDollars: number;
  price: number;
};

// Link group 5: block/connector dining plan tiers.
export type BlockDiningPlansPageData = {
  plans: ScrapedBlockDiningPlan[];
};

export type ScrapedParkingPermit = {
  permitType: string;
  term: "annual" | "fall" | "spring" | "summer";
  price: number;
};

// Link group 6: parking permit prices.
export type ParkingPermitsPageData = {
  permits: ScrapedParkingPermit[];
};
