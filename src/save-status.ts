import { isServerReady } from './local-store.ts'

/** The confirmation shown once learner work has saved, naming where it now lives. */
export const savedMessage = () => isServerReady() ? 'Saved on this laptop' : 'Saved in browser'
