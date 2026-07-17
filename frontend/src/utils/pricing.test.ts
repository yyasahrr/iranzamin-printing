import { describe, it, expect } from "vitest";
import { calculateEstimatedPrice } from "./pricing";

describe("calculateEstimatedPrice", () => {
  const finishesConfig = [
    { id: "matte", factor: 0.12 },
    { id: "uv", factor: 0.2 },
    { id: "foil", factor: 0.28 },
    { id: "emboss", factor: 0.24 },
  ];

  it("calculates pricing correctly for standard single sided print with 10% quantity discount", () => {
    // 4200 * 500 * (1 + 0) * 1 * 0.90 = 1890000 -> round to 10000 is 1890000
    const price = calculateEstimatedPrice(4200, 500, "یک رو رنگی", [], finishesConfig);
    expect(price).toBe(1890000);
  });

  it("calculates pricing correctly with print side factor and 10% quantity discount", () => {
    // 4200 * 500 * 1 * 1.16 * 0.90 = 2192400 -> round to 10000 is 2190000
    const price = calculateEstimatedPrice(4200, 500, "دو رو رنگی", [], finishesConfig);
    expect(price).toBe(2190000);
  });

  it("calculates pricing correctly with finishes factor and 10% quantity discount", () => {
    // 4200 * 500 * (1 + 0.12 + 0.28) * 1 * 0.90 = 2100000 * 1.4 * 0.90 = 2646000 -> round to 10000 is 2650000
    const price = calculateEstimatedPrice(4200, 500, "یک رو رنگی", ["matte", "foil"], finishesConfig);
    expect(price).toBe(2650000);
  });

  it("calculates pricing correctly with both side factor, finishes and 10% quantity discount", () => {
    // 4200 * 500 * (1 + 0.12) * 1.16 * 0.90 = 2100000 * 1.12 * 1.16 * 0.9 = 2455488 -> round to 10000 is 2460000
    const price = calculateEstimatedPrice(4200, 500, "دو رو رنگی", ["matte"], finishesConfig);
    expect(price).toBe(2460000);
  });
});
