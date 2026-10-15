// Types for the plain .mjs fixtures and server the browser specs import, so tsc -b can check the specs.
declare module '*/fixtures/connected-feature-solutions.mjs' {
  export const connectedSolutions: Record<string, string>[]
}
declare module '*/fixtures/dom-solutions.mjs' {
  export const domSolutions: Record<string, string>
}
declare module '*/fixtures/dsa-solutions.mjs' {
  export const dsaSolutions: Record<string, string>
}
declare module '*/fixtures/maintenance-journey-solutions.mjs' {
  export const maintenanceSolutions: Record<string, string>
}
declare module '*/fixtures/react-solution.mjs' {
  export const reactSolution: string
  export const reactSolutions: Record<string, string>
}
declare module '*/fixtures/sqlite-solution.mjs' {
  export const sqliteSolution: string
  export const sqliteCustomerTotalsSolution: string
  export const sqliteRestockSolution: string
}
declare module '*/fixtures/rich-solutions.mjs' {
  export const richSolutions: Record<string, string>
}
declare module '*/fixtures/validation-solutions.mjs' {
  export const validationSolutions: Record<string, string>
}
declare module '*/server/index.mjs' {
  import type { Server } from 'node:http'
  export function startServer(options?: { port?: number; dataDir?: string; assetsDir?: string }): Promise<{
    server: Server
    store: { dbPath: string }
    close(): Promise<void>
    url: string
  }>
}
