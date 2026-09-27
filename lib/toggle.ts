import { boolean as decode } from "./decode.ts";
import { dasherize } from "./dasherize.ts";
import {
  type AnyParam,
  type Param,
  param,
  type ParamModel,
  schema,
} from "./param.ts";
import {
  brand,
  type Check,
  type Fold,
  type ModelElement,
  type Unary,
} from "./pipeline.ts";
import type { CLIRead, ReadCLI } from "./read.ts";
import type { Flag } from "./tokenize.ts";
import type { AnyRoute, Definition, Schema } from "./types.ts";

export function toggle<
  const N extends string,
  const E extends readonly Unary[],
>(
  named: Definition<N>,
  ...elements: E & Check<Zero<N>, E>
): ElementOf<N, Fold<Zero<N>, E>> {
  const added = elements.reduce<unknown>(
    (value, element) => element(value as never),
    {
      ...param(named, binding(named.name), schema(bool)),
      decode,
    },
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

type Zero<N extends string> = Param<N, boolean, "one">;

type ElementOf<N extends string, P> = P extends
  Param<N, infer Model, infer _Cardinality> ? ModelElement<ParamModel<N, Model>>
  : never;

function binding(name: string): <P extends AnyParam>(param: P) => P {
  const stem = dasherize(name);
  const yes = `--${stem}`;
  const no = `--no-${stem}`;

  return (param) => ({
    ...param,
    cli: {
      read: reader(name),
      syntax: {
        type: "option",
        label: `${yes}, ${no}`,
      },
    },
  });
}

function reader(name: string): ReadCLI {
  const stem = dasherize(name);
  const yes = `--${stem}`;
  const no = `--no-${stem}`;

  return (tokens): CLIRead => {
    let claim = tokens.claimOne((token): token is Flag => {
      return token.type === "flag" &&
        (token.text === yes || token.text === no);
    });
    let [flag] = claim.tokens;

    return flag
      ? {
        claim,
        result: {
          ok: true,
          value: { exists: true, value: flag.text === yes },
          issues: [],
        },
      }
      : {
        claim,
        result: {
          ok: true,
          value: { exists: false },
          issues: [],
        },
      };
  };
}

const bool: Schema<boolean> = {
  "~standard": {
    version: 1,
    vendor: "configliere",
    validate(value) {
      return typeof value === "undefined"
        ? { value: false }
        : typeof value === "boolean"
        ? { value }
        : { issues: [{ message: "expected boolean" }] };
    },
  },
};
