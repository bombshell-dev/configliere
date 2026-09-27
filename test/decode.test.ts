import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { boolean, multiple, number, scalar } from "../lib/decode.ts";
import { Just, Nothing } from "../lib/maybe.ts";

describe("decoders", () => {
  it("keeps decoder alternatives in stable slots", () => {
    expect(scalar("0012")).toEqual([Just(12), Just("0012")]);
    expect(scalar("word")).toEqual([Nothing(), Just("word")]);
  });

  it("represents a failed alternative without removing its slot", () => {
    expect(number("12")).toEqual([Just(12)]);
    expect(number("twelve")).toEqual([Nothing()]);
  });

  it("decodes boolean text without treating other text as boolean", () => {
    expect(boolean("true")).toEqual([Just(true)]);
    expect(boolean("false")).toEqual([Just(false)]);
    expect(boolean("yes")).toEqual([Nothing()]);
  });

  it("lifts each alternative across a complete representation collection", () => {
    expect(multiple(scalar)(["001", "002"])).toEqual([
      Just([1, 2]),
      Just(["001", "002"]),
    ]);
  });

  it("rejects an aggregate alternative when any occurrence cannot use it", () => {
    expect(multiple(scalar)(["word", "002"])).toEqual([
      Nothing(),
      Just(["word", "002"]),
    ]);
  });

  it("bounds aggregate candidates by decoder width", () => {
    expect(multiple(scalar)(["1", "2", "3", "4"])).toHaveLength(2);
  });

  // it("rejects decoders whose candidate width changes between values", () => {
  //   let uneven: Decoder = (value) =>
  //     value === "one" ? [Just(1)] : [Just(2), Just("two")];

  //   expect(() => multiple(uneven)(["one", "two"])).toThrow();
  // });
});
