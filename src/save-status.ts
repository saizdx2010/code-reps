import { isServerReady } from './local-store.ts'

/** The confirmation shown once learner work has saved, naming where it now lives. */
export const savedMessage = () => (isServerReady() ? 'Saved on this laptop' : 'Saved in browser')

/** Why a save into this browser failed. A full storage quota needs a different next step from other failures. */
export const deviceSaveFailure = (error: unknown) =>
  error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ? 'Browser storage is full; download a backup to keep this work'
    : 'Could not save on this device'
