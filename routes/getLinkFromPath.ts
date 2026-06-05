type PathTree = {
  [key: string]: string | PathTree;
};

type Join<A extends string, B extends string> = A extends ""
  ? `/${B}`
  : `${A}/${B}`;

type RenderLinks<T extends PathTree, Prefix extends string = ""> = {
  [K in keyof T]: K extends "index"
    ? Prefix extends ""
      ? "/"
      : Prefix
    : T[K] extends string
    ? Join<Prefix, T[K]>
    : T[K] extends PathTree
    ? RenderLinks<
        T[K],
        T[K] extends { index: infer I extends string }
          ? Join<Prefix, I>
          : Prefix
      >
    : never;
};

type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<Rest>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type ParamsOf<T extends string> = [ExtractParams<T>] extends [never]
  ? Record<string, never>
  : Record<ExtractParams<T>, string | number>;

export function resolvePath<T extends string>(
  path: T,
  ...args: [ExtractParams<T>] extends [never] ? [] : [params: ParamsOf<T>]
): string {
  const params = args[0] as Record<string, string | number> | undefined;
  if (!params) return path;
  let result: string = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, String(value));
  }
  return result;
}

export function getLinkFromPath<T extends PathTree>(
  paths: T,
  prefix = "",
): RenderLinks<T> {
  const result = {} as RenderLinks<T>;

  for (const key in paths) {
    const value = paths[key];

    if (key === "index" && typeof value === "string") {
      result[key] = (prefix || "/") as RenderLinks<T>[typeof key];
      continue;
    }

    if (typeof value === "string") {
      result[key] = `${prefix}/${value}` as RenderLinks<T>[typeof key];
    } else {
      const nextPrefix =
        typeof value.index === "string" ? `${prefix}/${value.index}` : prefix;

      result[key] = getLinkFromPath(
        value,
        nextPrefix,
      ) as RenderLinks<T>[typeof key];
    }
  }

  return result;
}
