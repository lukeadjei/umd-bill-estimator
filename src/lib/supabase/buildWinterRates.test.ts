import { describe, expect, it } from "vitest";
import { buildWinterRates } from "./buildWinterRates";
import type { AcademicYearRow, WinterFeeRow, WinterGraduateTuitionRateRow, WinterTuitionRateRow } from "@/lib/calculator/types";

const year: AcademicYearRow = {
  id: "year-1",
  label: "2026-2027",
  is_current: true,
  undergrad_tuition_full_time_credit_threshold: 12,
  full_time_fee_credit_threshold: 9,
  winter_max_credit_hours: 4,
};

const undergrad: WinterTuitionRateRow[] = [
  { id: "u1", academic_year_id: "year-1", residency: "resident", credit_hours: 1, price: 459 },
];
const graduate: WinterGraduateTuitionRateRow[] = [
  { id: "g1", academic_year_id: "year-1", residency: "resident", credit_hours: 1, price: 913 },
];
const fees: WinterFeeRow[] = [
  { id: "f1", academic_year_id: "year-1", campus_services_rate: 116, distance_learning_rate: 55 },
];

describe("buildWinterRates", () => {
  it("returns the winter section when the cap is set and every table has data", () => {
    expect(buildWinterRates(year, undergrad, graduate, fees)).toEqual({
      undergraduateTuition: undergrad,
      graduateTuition: graduate,
      fees: fees[0],
    });
  });

  it("returns null when the year has no winter cap configured, even if rows exist", () => {
    expect(buildWinterRates({ ...year, winter_max_credit_hours: null }, undergrad, graduate, fees)).toBeNull();
  });

  it("returns null when any winter table is empty", () => {
    expect(buildWinterRates(year, [], graduate, fees)).toBeNull();
    expect(buildWinterRates(year, undergrad, [], fees)).toBeNull();
    expect(buildWinterRates(year, undergrad, graduate, [])).toBeNull();
  });
});
