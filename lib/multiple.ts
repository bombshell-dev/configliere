import { multiple as decode } from "./decode.ts";
import type { Param } from "./param.ts";
import { mark, type Transform, type TransformElement } from "./pipeline.ts";

export function multiple(): TransformElement<MultipleTransform> {
  return mark<MultipleTransform>(
    (param: Param<string, unknown, "one">) => ({
      ...param,
      cardinality: "many",
      decode: decode(param.decode),
    }),
  );
}

interface MultipleTransform extends Transform {
  readonly input: Param<string, unknown, "one">;
  readonly output: this["input"] extends Param<
    infer K,
    infer Model,
    "one"
  > ? Param<K, Model, "many">
    : never;
}
