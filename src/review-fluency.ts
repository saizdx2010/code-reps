export const fluencyGuides = {
  "sum-matching-prices": {
    "plan": [
      "What does your accumulator mean after each item?",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I add the price of each available entry once. Duplicate entries count separately. One scan is O(n) time with O(1) working space."
  },
  "count-open-tickets": {
    "plan": [
      "State the two conditions and an equality boundary.",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I count only open tickets with priority >= minimum. Equality qualifies. A loop uses O(n) time and O(1) extra space."
  },
  "first-label-ending": {
    "plan": [
      "How will you separate comparison from display?",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I normalize comparison text but return the original first matching label. Work includes the text visited."
  },
  "count-label-prefix": {
    "plan": [
      "What happens when the prefix or label is blank?",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I reject blank labels, then compare normalized prefixes. Duplicates are separate inputs. Cost includes total label text processed."
  },
  "first-duplicate-label": {
    "plan": [
      "Trace the second occurrence, not the first position.",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I scan normalized nonblank labels and return when membership is already true. The first repeated occurrence decides the answer. Storage grows with distinct labels."
  },
  "count-statuses": {
    "plan": [
      "Which fields must exist even for empty input?",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I initialize both counters and increment the matching field for each item. O(n) time and O(1) extra space."
  },
  "remaining-actions": {
    "plan": [
      "Trace saved actions and an undo when none remain.",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I push ordinary actions and pop for UNDO. Each action is visited once. The output stack uses O(n) space."
  },
  "cancel-adjacent-ids": {
    "plan": [
      "Trace the cascade in [1,2,2,1,3].",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "A stack resolves newly adjacent pairs without rescanning. Each ID is pushed or cancels a top once: O(n) time and O(n) output storage."
  },
  "validate-page-query": {
    "plan": [
      "Separate shape, type, and boundary validation.",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I guard shape then check integers and inclusive limits. I return only trusted fields in a new object. O(1) time and extra space."
  },
  "derive-task-summary": {
    "plan": [
      "Distinguish all unfinished tasks from visible unfinished tasks.",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "I derive pending tasks, count them, then derive matching titles. Search does not change the overall remaining count. O(n) visits plus string work; derived arrays use O(n) space."
  },
  "debug-page-offset": {
    "plan": [
      "Write expected and actual positions before repairing the offset.",
      "Name an empty or boundary input before coding."
    ],
    "explanation": [
      "Explain how the contract is preserved.",
      "State time and storage costs for your chosen implementation."
    ],
    "example": "The original start page * size skips the first page. I use (page - 1) * size and slice to start + size. Copying up to size IDs uses proportional output space."
  }
}
