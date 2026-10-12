// Small builders shared by rep modules. Keep this free of content so each rep module stays its own chunk.

/** Joins source lines into a file ending with a newline. */
export const lines = (...parts: string[]) => parts.join('\n') + '\n'

/** One expected observation in a sandboxed DOM check. Targets are data-testid values. */
export const see = (target: string, read: string, value: unknown) => ({ target, read, value })
