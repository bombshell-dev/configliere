import { Just, type Maybe, Nothing } from "./maybe.ts";

export type Decoder<A, B> = (value: A) => Maybe<B>[];

export const number: Decoder<string, number> = (value) => {
  if (!numeric.test(value)) {
    return [Nothing()];
  }

  let decoded = Number(value);
  return Number.isFinite(decoded) ? [Just(decoded)] : [Nothing()];
};

export const scalar: Decoder<string, string | number> = (value) => {
  return [...number(value), Just(value)];
};

export const boolean: Decoder<string, boolean> = (value) => {
  if (value === "true") {
    return [Just(true)];
  }
  if (value === "false") {
    return [Just(false)];
  }
  return [Nothing()];
};

export function multiple<A, B>(decoder: Decoder<A, B>): Decoder<A[], B[]> {
  return (input: A[]): Maybe<B[]>[] => {
    let decodings = input.map(decoder);

    let result: Maybe<B[]>[] = [];

    for (let i = 0; i < decodings.length; i++) {
      let decoding = decodings[i];
      for (let j = 0; j < decoding.length; j++) {
        let row: Maybe<B[]> | undefined = result[j];
        if (!row) {
          row = result[j] = Just([]);
        }
        if (row.exists) {
          let candidate = decoding[j];
          if (candidate.exists) {
            row.value[i] = candidate.value;
          } else {
            result[j] = Nothing();
          }
        }
      }
    }
    return result;
  };
}

const numeric = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
