const importJose = new Function("return import('jose')") as () => Promise<
  typeof import("jose")
>;
let josePromise: ReturnType<typeof importJose> | undefined;

export function getJose(): ReturnType<typeof importJose> {
  return (josePromise ??= importJose());
}
