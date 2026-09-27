import { type AnyParam, type Param, param, type ParamModel } from "./param.ts";
import {
  brand,
  type Check,
  type Fold,
  type ModelElement,
  type Unary,
} from "./pipeline.ts";
import type { CLIRead, ReadCLI } from "./read.ts";
import type { Word } from "./tokenize.ts";
import type { AnyRoute, Definition } from "./types.ts";

export function argument<
  const N extends string,
  const E extends readonly Unary[],
>(
  named: Definition<N>,
  ...elements: E & Check<Zero<N>, E>
): ElementOf<N, Fold<Zero<N>, E>> {
  const added = elements.reduce<unknown>(
    (value, element) => element(value as never),
    param(named, positional),
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

function positional<P extends AnyParam>(param: P): P {
  return {
    ...param,
    cli: {
      read,
      syntax: {
        type: "argument",
        label: `<${param.name.toUpperCase()}>`,
      },
    },
  };
}

const read: ReadCLI = (tokens): CLIRead => {
  let claim = tokens.claimOne((token): token is Word => token.type === "word");
  let [word] = claim.tokens;

  return word
    ? {
      claim,
      result: {
        ok: true,
        value: { exists: true, value: word.text },
        issues: [],
      },
    }
    : nothing(tokens);
};

function nothing(tokens: Parameters<ReadCLI>[0]): CLIRead {
  let claim = tokens.claimAll(() => false);

  return {
    claim,
    result: {
      ok: true,
      value: { exists: false },
      issues: [],
    },
  };
}
