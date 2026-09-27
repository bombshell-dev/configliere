import { type AnyParam, type Param, param, type ParamModel } from "./param.ts";
import { dasherize } from "./dasherize.ts";
import {
  brand,
  type Check,
  type Fold,
  type ModelElement,
  type Unary,
} from "./pipeline.ts";
import { cli } from "./read.ts";
import type { AnyRoute, Definition } from "./types.ts";

export function option<
  const N extends string,
  const E extends readonly Unary[],
>(
  named: Definition<N>,
  ...elements: E & Check<Zero<N>, E>
): ElementOf<N, Fold<Zero<N>, E>> {
  const added = elements.reduce<unknown>(
    (value, element) => element(value as never),
    param(named, cli([`--${dasherize(named.name)}`])),
  ) as AnyParam;

  return brand<ElementOf<N, Fold<Zero<N>, E>>>(
    (route: AnyRoute) => {
      let phases = [...route.phases];
      let phase = phases.pop()!;
      phases.push({
        ...phase,
        model: {
          params: {
            ...phase.model.params,
            [added.name]: added,
          },
          steps: phase.model.steps.concat((current, bindings) => ({
            ok: true,
            value: {
              ...current,
              [added.name]: bindings[added.name],
            },
          })),
        },
      });
      return {
        ...route,
        phases,
      };
    },
  );
}

type Zero<N extends string> = Param<N, unknown, "one">;

type ElementOf<N extends string, P> = P extends
  Param<N, infer Model, infer _Cardinality> ? ModelElement<ParamModel<N, Model>>
  : never;
