import { type Decoder, scalar } from "./decode.ts";
import {
  type Check,
  type Fold,
  mark,
  type ModelPatch,
  type Transform,
  type TransformElement,
  type Unary,
} from "./pipeline.ts";
import type { CLIBinding } from "./read.ts";
import type { Definition, OutputOf, Schema } from "./types.ts";

export interface Param<K extends string, T, C extends Cardinality>
  extends Definition<K> {
  schema: Schema<T>;
  cardinality: C;
  cli: CLIBinding;
  decode: Decoder<Representation<C>, Decoded<C>>;
  env?: string;
}

export type Cardinality = "one" | "many";

export type AnyParam =
  | Param<string, unknown, "one">
  | Param<string, unknown, "many">;

export type ParamModel<K extends string, V> = ModelPatch<{ [P in K]: V }>;

export type Representation<C extends Cardinality> = C extends "many" ? string[]
  : string;

export function param<
  const K extends string,
  const E extends readonly Unary[],
>(
  start: Definition<K>,
  ...elements: E & Check<ParamZero<K>, E>
): Fold<ParamZero<K>, E> {
  let zero: ParamZero<K> = {
    ...start,
    schema: unknown,
    cardinality: "one",
    cli: {
      read(tokens) {
        let claim = tokens.claimAll(() => false);
        return {
          result: {
            ok: true,
            value: { exists: false },
            issues: [],
          },
          claim,
        };
      },
    },
    decode: scalar,
  };

  return elements.reduce<unknown>(
    (value, element) => element(value as never),
    zero,
  ) as Fold<ParamZero<K>, E>;
}

export function schema<S extends Schema>(
  schema: S,
): TransformElement<SchemaTransform<OutputOf<S>>> {
  return mark<SchemaTransform<OutputOf<S>>>(
    (param: AnyParam) => ({
      ...param,
      schema,
    }),
  );
}

interface SchemaTransform<Output> extends Transform {
  readonly input: AnyParam;
  readonly output: this["input"] extends Param<infer N, unknown, infer C>
    ? Param<N, Output, C>
    : never;
}

const unknown: Schema<unknown> = {
  "~standard": {
    version: 1,
    vendor: "configliere",
    validate: (value) => ({ value }),
  },
};

type ParamZero<K extends string> = Param<K, unknown, "one">;

type Decoded<C extends Cardinality> = C extends "many" ? unknown[]
  : unknown;
