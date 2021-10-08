// deno-lint-ignore-file camelcase
//ORIGINAL PROJECT AND LICENSE IN: https://github.com/chiefbiiko/saslprep
//ORIGINAL PROJECT AND LICENSE IN: https://github.com/chiefbiiko/sparse-bitfield
//ORIGINAL PROJECT AND LICENSE IN: https://github.com/chiefbiiko/memory-pager
import { Bitfield } from "./deps.ts";
import { loadCodePoints } from "./load_code_points.ts";

const {
  unassigned_code_points,
  commonly_mapped_to_nothing,
  non_ASCII_space_characters,
  prohibited_characters,
  bidirectional_r_al,
  bidirectional_l,
} = loadCodePoints();

// 2.1.  Mapping

/**
 * non-ASCII space characters [StringPrep, C.1.2] that can be
 * mapped to SPACE (U+0020).
 */
const mapping2space: Bitfield = non_ASCII_space_characters;

/**
 * The "commonly mapped to nothing" characters [StringPrep, B.1]
 * that can be mapped to nothing.
 */
const mapping2nothing: Bitfield = commonly_mapped_to_nothing;

// utils
function getCodePoint(chr: string): number {
  const codePoint: undefined | number = chr.codePointAt(0);

  if (!codePoint) {
    throw new Error(`unable to encode character ${chr}`);
  }

  return codePoint;
}

function first(x: any): any {
  return x[0];
}

function last(x: any): any {
  return x[x.length - 1];
} /**
 * Convert provided string into an array of Unicode Code Points.
 * Based on https://stackoverflow.com/a/21409165/1556249
 * and https://www.npmjs.com/package/code-point-at.
 */

function toCodePoints(input: string): number[] {
  const codepoints = [];
  const size = input.length;

  for (let i = 0; i < size; i += 1) {
    const before: number = input.charCodeAt(i);

    if (before >= 0xd800 && before <= 0xdbff && size > i + 1) {
      const next: number = input.charCodeAt(i + 1);

      if (next >= 0xdc00 && next <= 0xdfff) {
        codepoints.push((before - 0xd800) * 0x400 + next - 0xdc00 + 0x10000);
        i += 1;
        continue;
      }
    }

    codepoints.push(before);
  }

  return codepoints;
}

export interface SASLprepOptions {
  allowUnassigned?: boolean;
}

/** SASLprep routine. */
export function saslprep(input: string, opts: SASLprepOptions = {}): string {
  if (input === null) {
    throw new TypeError("Input must not be null.");
  }

  if (input.length === 0) {
    return "";
  }

  // 1. Map
  const mapped_input: number[] = toCodePoints(input)
    // 1.1 mapping to space
    .map((character) => (mapping2space.get(character) ? 0x20 : character))
    // 1.2 mapping to nothing
    .filter((character) => !mapping2nothing.get(character));

  // 2. Normalize
  const normalized_input: string = String.fromCodePoint
    .apply(null, mapped_input)
    .normalize("NFKC");

  const normalized_map: number[] = toCodePoints(normalized_input);

  // 3. Prohibit
  const hasProhibited: boolean = normalized_map.some((character) =>
    prohibited_characters.get(character)
  );

  if (hasProhibited) {
    throw new Error(
      "Prohibited character, see https://tools.ietf.org/html/rfc4013#section-2.3",
    );
  }

  // Unassigned Code Points
  if (!opts.allowUnassigned) {
    const hasUnassigned: boolean = normalized_map.some((character) =>
      unassigned_code_points.get(character)
    );

    if (hasUnassigned) {
      throw new Error(
        "Unassigned code point, see https://tools.ietf.org/html/rfc4013#section-2.5",
      );
    }
  }

  // 4. check bidi

  const hasBidiRAL: boolean = normalized_map.some((character) =>
    bidirectional_r_al.get(character)
  );

  const hasBidiL: boolean = normalized_map.some((character) =>
    bidirectional_l.get(character)
  );

  // 4.1 If a string contains any RandALCat character, the string MUST NOT
  // contain any LCat character.
  if (hasBidiRAL && hasBidiL) {
    throw new Error(
      "String must not contain RandALCat and LCat at the same time," +
        " see https://tools.ietf.org/html/rfc3454#section-6",
    );
  }

  /**
   * 4.2 If a string contains any RandALCat character, a RandALCat
   * character MUST be the first character of the string, and a
   * RandALCat character MUST be the last character of the string.
   */

  const isFirstBidiRAL: boolean = bidirectional_r_al.get(
    getCodePoint(first(normalized_input)),
  );
  const isLastBidiRAL: boolean = bidirectional_r_al.get(
    getCodePoint(last(normalized_input)),
  );

  if (hasBidiRAL && !(isFirstBidiRAL && isLastBidiRAL)) {
    throw new Error(
      "Bidirectional RandALCat character must be the first and the last" +
        " character of the string, see https://tools.ietf.org/html/rfc3454#section-6",
    );
  }

  return normalized_input;
}
