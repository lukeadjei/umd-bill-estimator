import { describe, expect, it } from "vitest";
import { extractDollarAmounts, replyDollarAmountsAreVerified, stripLinksAndImages } from "./verifyReplyText";

describe("stripLinksAndImages", () => {
  it("removes markdown image syntax entirely, collapsing the whitespace left behind", () => {
    expect(stripLinksAndImages("Here's a photo: ![Dorm room](https://example.com/photo.jpg) enjoy!")).toBe(
      "Here's a photo: enjoy!"
    );
  });

  it("keeps a markdown link's text but drops the URL", () => {
    expect(stripLinksAndImages("Check out [Traditional dorm](https://example.com/x)")).toBe(
      "Check out Traditional dorm"
    );
  });

  it("removes bare URLs", () => {
    expect(stripLinksAndImages("See https://example.com/photo.jpg for more")).toBe("See for more");
  });

  it("leaves ordinary text with no links untouched", () => {
    expect(stripLinksAndImages("Got it -- I've set your housing.")).toBe("Got it -- I've set your housing.");
  });

  it("collapses extra whitespace left behind after stripping", () => {
    expect(stripLinksAndImages("Photo: ![x](https://example.com/a.jpg)  right there.")).toBe("Photo: right there.");
  });
});

describe("extractDollarAmounts", () => {
  it("pulls dollar amounts out of plain text", () => {
    expect(extractDollarAmounts("I don't have more than $8,000 to spend per semester.")).toEqual([8000]);
  });

  it("returns an empty array when there are none", () => {
    expect(extractDollarAmounts("I'm an out-of-state sophomore.")).toEqual([]);
  });

  it("finds multiple amounts", () => {
    expect(extractDollarAmounts("Somewhere between $5,000 and $8,000.")).toEqual([5000, 8000]);
  });
});

describe("replyDollarAmountsAreVerified", () => {
  it("passes when the reply has no dollar amounts at all", () => {
    expect(replyDollarAmountsAreVerified("I've set your housing to a Double.", [])).toBe(true);
  });

  it("passes when every dollar amount matches a verified number", () => {
    expect(
      replyDollarAmountsAreVerified("Your estimated total is $7,850.00, under your $8,000 budget.", [7850, 8000])
    ).toBe(true);
  });

  it("fails when a dollar amount doesn't match any verified number", () => {
    expect(replyDollarAmountsAreVerified("That should run you about $7,000.", [7850])).toBe(false);
  });

  it("fails on any dollar amount at all when nothing was verified", () => {
    expect(replyDollarAmountsAreVerified("Housing typically costs around $5,000.", [])).toBe(false);
  });

  it("tolerates formatting differences (commas, decimals) for the same real number", () => {
    expect(replyDollarAmountsAreVerified("Total: $7850", [7850.0])).toBe(true);
    expect(replyDollarAmountsAreVerified("Total: $7,850.00", [7850])).toBe(true);
  });
});
