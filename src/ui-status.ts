export type ChipTone = 'neutral' | 'progress' | 'success' | 'attention'

/** Map existing attempt status copy to a chip tone without changing the copy itself. */
export function statusTone(status: string): ChipTone {
  if (/completed|retained|passed/i.test(status)) return 'success'
  if (/review|due|ready/i.test(status)) return 'attention'
  if (/draft|progress|started|learning|practising|independent/i.test(status) && !/not started/i.test(status)) return 'progress'
  return 'neutral'
}
