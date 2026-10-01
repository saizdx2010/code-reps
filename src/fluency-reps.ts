import type { Rep } from './rep'
export const fluencySolutions: Record<string, string> = {
  "sum-matching-prices": "function availableTotal(items: {price:number;available:boolean}[]) { let total=0; for(const item of items) if(item.available) total+=item.price; return total }",
  "count-open-tickets": "function countPriority(tickets:{open:boolean;priority:number}[], minimum:number) { return tickets.filter(t=>t.open && t.priority>=minimum).length }",
  "first-label-ending": "function firstEnding(labels:string[], ending:string) { return labels.find(label=>label.trim().toLowerCase().endsWith(ending.toLowerCase())) ?? null }",
  "count-label-prefix": "function countPrefix(labels:string[], prefix:string) { const query=prefix.trim().toLowerCase(); return labels.filter(label=>label.trim() && label.trim().toLowerCase().startsWith(query)).length }",
  "first-duplicate-label": "function duplicateLabel(labels:string[]) { const seen=new Set<string>(); for(const raw of labels) { const label=raw.trim(); if(!label) continue; if(seen.has(label)) return label; seen.add(label) } return null }",
  "count-statuses": "function countStatuses(statuses: (\"open\"|\"closed\")[]) { const counts={open:0,closed:0}; for(const status of statuses) counts[status]++; return counts }",
  "remaining-actions": "function remainingActions(actions:string[]) { const stack:string[]=[]; for(const action of actions) { if(action===\"UNDO\") stack.pop(); else stack.push(action) } return stack }",
  "cancel-adjacent-ids": "function cancelIds(ids:number[]) { const stack:number[]=[]; for(const id of ids) { if(stack.length && stack.at(-1)===id) stack.pop(); else stack.push(id) } return stack }",
  "validate-page-query": "function validatePaging(input:unknown) { if(!input || typeof input!==\"object\" || Array.isArray(input)) return null; const x=input as Record<string,unknown>; if(typeof x.page!==\"number\" || !Number.isInteger(x.page) || x.page<1 || typeof x.size!==\"number\" || !Number.isInteger(x.size) || x.size<1 || x.size>50) return null; return {page:x.page,size:x.size} }",
  "derive-task-summary": "function taskSummary(tasks:{title:string;done:boolean}[], query:string) { const pending=tasks.filter(t=>!t.done); const q=query.trim().toLowerCase(); return {titles:pending.filter(t=>t.title.toLowerCase().includes(q)).map(t=>t.title),remaining:pending.length} }",
  "debug-page-offset": "function pageWindow(ids:string[],page:number,size:number) { const start=(page-1)*size; return ids.slice(start,start+size) }"
}
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
export const fluencyReps: Rep[] = [
  {
    "id": "sum-matching-prices",
    "title": "Total available prices",
    "category": "Arrays & maps",
    "prompt": "Return the sum of prices for available items. Count duplicate entries separately. Preserve the input.",
    "note": "Prices are nonnegative integers. Empty input returns zero.",
    "example": {
      "input": "availableTotal([{price: 4, available: true}, {price: 7, available: false}])",
      "output": "4"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "What does your accumulator mean after each item?",
    "starter": "function availableTotal(items: { price: number; available: boolean }[]): number {\n  // Implement the contract.\n}\n",
    "functionName": "availableTotal",
    "preserveInput": true,
    "hints": [
      "Choose a sum accumulator, not a count.",
      "Only available items contribute their price.",
      "Empty input should leave the starting total unchanged."
    ],
    "checks": [
      {
        "name": "Includes available prices",
        "input": [
          [
            {
              "price": 4,
              "available": true
            },
            {
              "price": 7,
              "available": false
            }
          ]
        ],
        "expected": 4
      },
      {
        "name": "Handles empty input",
        "input": [
          []
        ],
        "expected": 0
      },
      {
        "name": "Counts duplicate entries",
        "input": [
          [
            {
              "price": 3,
              "available": true
            },
            {
              "price": 3,
              "available": true
            }
          ]
        ],
        "expected": 6
      },
      {
        "name": "Includes a free available item",
        "input": [
          [
            {
              "price": 0,
              "available": true
            }
          ]
        ],
        "expected": 0
      }
    ]
  },
  {
    "id": "count-open-tickets",
    "title": "Count open tickets above a priority",
    "category": "Arrays & maps",
    "prompt": "Count tickets that are open and have priority at least minimum.",
    "note": "Priorities and minimum are integers, including negative values. Empty input returns zero.",
    "example": {
      "input": "countPriority([{open:true, priority:2}], 2)",
      "output": "1"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "State the two conditions and an equality boundary.",
    "starter": "function countPriority(tickets: { open: boolean; priority: number }[], minimum: number): number {\n  // Implement the contract.\n}\n",
    "functionName": "countPriority",
    "preserveInput": true,
    "hints": [
      "Both conditions must hold.",
      "At least includes equality.",
      "Keep a count of qualifying tickets."
    ],
    "checks": [
      {
        "name": "Includes equality",
        "input": [
          [
            {
              "open": true,
              "priority": 2
            }
          ],
          2
        ],
        "expected": 1
      },
      {
        "name": "Excludes closed tickets",
        "input": [
          [
            {
              "open": false,
              "priority": 5
            }
          ],
          2
        ],
        "expected": 0
      },
      {
        "name": "Handles empty input",
        "input": [
          [],
          0
        ],
        "expected": 0
      },
      {
        "name": "Combines both conditions",
        "input": [
          [
            {
              "open": true,
              "priority": -1
            },
            {
              "open": true,
              "priority": 0
            },
            {
              "open": false,
              "priority": 2
            }
          ],
          0
        ],
        "expected": 1
      }
    ]
  },
  {
    "id": "first-label-ending",
    "title": "Find the first matching ending",
    "category": "Text",
    "prompt": "Return the first original label whose trimmed, lowercased form ends with the lowercased ending.",
    "note": "ending is a nonempty string with no surrounding whitespace. Labels can be blank. Return null if no match; preserve the original label including spaces.",
    "example": {
      "input": "firstEnding([\" report.TXT \", \"photo.png\"], \".txt\")",
      "output": "\" report.TXT \""
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "How will you separate comparison from display?",
    "starter": "function firstEnding(labels: string[], ending: string): string | null {\n  // Implement the contract.\n}\n",
    "functionName": "firstEnding",
    "preserveInput": true,
    "hints": [
      "Compare a normalized copy.",
      "endsWith checks the ending rather than any substring.",
      "Return the original label, not its normalized copy."
    ],
    "checks": [
      {
        "name": "Normalizes comparison but keeps display",
        "input": [
          [
            " report.TXT ",
            "photo.png"
          ],
          ".txt"
        ],
        "expected": " report.TXT "
      },
      {
        "name": "Returns first matching original",
        "input": [
          [
            "A.txt",
            "B.txt"
          ],
          ".txt"
        ],
        "expected": "A.txt"
      },
      {
        "name": "Handles empty input",
        "input": [
          [],
          ".txt"
        ],
        "expected": null
      },
      {
        "name": "Rejects a substring not at the end",
        "input": [
          [
            "a.txt.bak"
          ],
          ".txt"
        ],
        "expected": null
      }
    ]
  },
  {
    "id": "count-label-prefix",
    "title": "Count useful labels with a prefix",
    "category": "Text",
    "prompt": "Count nonblank labels whose trimmed, lowercased text starts with the trimmed, lowercased prefix.",
    "note": "A blank normalized prefix matches every nonblank label. Duplicate labels count separately.",
    "example": {
      "input": "countPrefix([\" Ada \", \"Adam\", \"Bo\", \" \"], \" ad \")",
      "output": "2"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "What happens when the prefix or label is blank?",
    "starter": "function countPrefix(labels: string[], prefix: string): number {\n  // Implement the contract.\n}\n",
    "functionName": "countPrefix",
    "preserveInput": true,
    "hints": [
      "Normalize the prefix once.",
      "Reject blank normalized labels before matching.",
      "A blank prefix still must not include blank labels."
    ],
    "checks": [
      {
        "name": "Normalizes label and prefix",
        "input": [
          [
            " Ada ",
            "Adam",
            "Bo",
            " "
          ],
          " ad "
        ],
        "expected": 2
      },
      {
        "name": "Blank prefix keeps only useful labels",
        "input": [
          [
            "",
            " ",
            "Bo"
          ],
          " "
        ],
        "expected": 1
      },
      {
        "name": "Handles empty input",
        "input": [
          [],
          "a"
        ],
        "expected": 0
      },
      {
        "name": "Counts duplicate entries",
        "input": [
          [
            "Ada",
            "Ada"
          ],
          "A"
        ],
        "expected": 2
      }
    ]
  },
  {
    "id": "first-duplicate-label",
    "title": "Find the first repeated useful label",
    "category": "Arrays & maps",
    "prompt": "Trim each label, ignore blank results, and return the trimmed label at the first repeated occurrence. Comparison is case-sensitive.",
    "note": "Return null when no useful label repeats. Return the trimmed form, not the original spaced label.",
    "example": {
      "input": "duplicateLabel([\" Ada \", \"Bo\", \"Ada\"])",
      "output": "\"Ada\""
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Trace the second occurrence, not the first position.",
    "starter": "function duplicateLabel(labels: string[]): string | null {\n  // Implement the contract.\n}\n",
    "functionName": "duplicateLabel",
    "preserveInput": true,
    "hints": [
      "Trim before lookup.",
      "Skip empty normalized labels.",
      "Check membership before adding the label."
    ],
    "checks": [
      {
        "name": "Trims before comparing",
        "input": [
          [
            " Ada ",
            "Bo",
            "Ada"
          ]
        ],
        "expected": "Ada"
      },
      {
        "name": "Ignores blanks",
        "input": [
          [
            " ",
            "",
            "Bo"
          ]
        ],
        "expected": null
      },
      {
        "name": "Preserves case distinction",
        "input": [
          [
            "Ada",
            "ada"
          ]
        ],
        "expected": null
      },
      {
        "name": "Uses first second occurrence",
        "input": [
          [
            "A",
            "B",
            "B",
            "A"
          ]
        ],
        "expected": "B"
      },
      {
        "name": "Handles empty input",
        "input": [
          []
        ],
        "expected": null
      }
    ]
  },
  {
    "id": "count-statuses",
    "title": "Count ticket statuses",
    "category": "Arrays & maps",
    "prompt": "Return counts for open and closed statuses. Always include both fields.",
    "note": "Inputs contain only open or closed. Empty input returns both counts as zero.",
    "example": {
      "input": "countStatuses([\"open\", \"closed\", \"open\"])",
      "output": "{open:2, closed:1}"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Which fields must exist even for empty input?",
    "starter": "function countStatuses(statuses: (\"open\" | \"closed\")[]): { open: number; closed: number } {\n  // Implement the contract.\n}\n",
    "functionName": "countStatuses",
    "preserveInput": true,
    "hints": [
      "Initialize both required keys.",
      "Use each status to choose the counter.",
      "Return zero for a status not present."
    ],
    "checks": [
      {
        "name": "Counts both statuses",
        "input": [
          [
            "open",
            "closed",
            "open"
          ]
        ],
        "expected": {
          "open": 2,
          "closed": 1
        }
      },
      {
        "name": "Always includes empty counts",
        "input": [
          []
        ],
        "expected": {
          "open": 0,
          "closed": 0
        }
      },
      {
        "name": "Keeps missing status zero",
        "input": [
          [
            "closed",
            "closed"
          ]
        ],
        "expected": {
          "open": 0,
          "closed": 2
        }
      },
      {
        "name": "Counts a single open",
        "input": [
          [
            "open"
          ]
        ],
        "expected": {
          "open": 1,
          "closed": 0
        }
      }
    ]
  },
  {
    "id": "remaining-actions",
    "title": "Resolve undo actions",
    "category": "Stacks",
    "prompt": "Treat the exact string UNDO as an instruction to remove the most recent saved action. Save every other string, including blanks. Return remaining actions in original order.",
    "note": "UNDO with no saved actions does nothing. Do not modify the input.",
    "example": {
      "input": "remainingActions([\"write\", \"save\", \"UNDO\"])",
      "output": "[\"write\"]"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Trace saved actions and an undo when none remain.",
    "starter": "function remainingActions(actions: string[]): string[] {\n  // Implement the contract.\n}\n",
    "functionName": "remainingActions",
    "preserveInput": true,
    "hints": [
      "Saved actions form a stack.",
      "UNDO removes the most recent saved item.",
      "Only the exact uppercase instruction is special."
    ],
    "checks": [
      {
        "name": "Undoes most recent action",
        "input": [
          [
            "write",
            "save",
            "UNDO"
          ]
        ],
        "expected": [
          "write"
        ]
      },
      {
        "name": "Ignores undo on empty stack",
        "input": [
          [
            "UNDO",
            "UNDO"
          ]
        ],
        "expected": []
      },
      {
        "name": "Preserves blank actions",
        "input": [
          [
            "",
            "write",
            "UNDO"
          ]
        ],
        "expected": [
          ""
        ]
      },
      {
        "name": "Handles successive undos",
        "input": [
          [
            "a",
            "b",
            "UNDO",
            "UNDO",
            "c"
          ]
        ],
        "expected": [
          "c"
        ]
      },
      {
        "name": "Handles empty input",
        "input": [
          []
        ],
        "expected": []
      }
    ]
  },
  {
    "id": "cancel-adjacent-ids",
    "title": "Cancel adjacent matching IDs",
    "category": "Stacks",
    "prompt": "Remove adjacent equal pairs as you scan. Removing a pair may expose a new pair. Return the remaining IDs.",
    "note": "IDs are integers, including zero and negatives. Preserve input.",
    "example": {
      "input": "cancelIds([1, 2, 2, 1, 3])",
      "output": "[3]"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Trace the cascade in [1,2,2,1,3].",
    "starter": "function cancelIds(ids: number[]): number[] {\n  // Implement the contract.\n}\n",
    "functionName": "cancelIds",
    "preserveInput": true,
    "hints": [
      "Compare the next ID with the current top.",
      "Remove the top on equality; otherwise save the ID.",
      "A removal exposes an earlier saved ID."
    ],
    "checks": [
      {
        "name": "Exposes a new pair",
        "input": [
          [
            1,
            2,
            2,
            1,
            3
          ]
        ],
        "expected": [
          3
        ]
      },
      {
        "name": "Handles empty input",
        "input": [
          []
        ],
        "expected": []
      },
      {
        "name": "Cancels zero and negatives",
        "input": [
          [
            0,
            0,
            -1,
            -1
          ]
        ],
        "expected": []
      },
      {
        "name": "Keeps unmatched values",
        "input": [
          [
            1,
            2,
            3
          ]
        ],
        "expected": [
          1,
          2,
          3
        ]
      },
      {
        "name": "Odd repeated count leaves one",
        "input": [
          [
            4,
            4,
            4
          ]
        ],
        "expected": [
          4
        ]
      }
    ]
  },
  {
    "id": "validate-page-query",
    "title": "Validate paging input",
    "category": "Backend validation",
    "format": "backend",
    "prompt": "Accept a non-null, non-array object with integer page >= 1 and integer size from 1 through 50. Return a new object containing only page and size. Otherwise return null.",
    "note": "Extra fields are ignored. Do not coerce strings or clamp invalid numbers.",
    "example": {
      "input": "validatePaging({page:2,size:10,other:true})",
      "output": "{page:2,size:10}"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Separate shape, type, and boundary validation.",
    "starter": "function validatePaging(input: unknown): { page: number; size: number } | null {\n  // Implement the contract.\n}\n",
    "functionName": "validatePaging",
    "preserveInput": true,
    "hints": [
      "Guard object shape before reading fields.",
      "Check number type, integer status, and both bounds.",
      "Return a new object without extra fields."
    ],
    "checks": [
      {
        "name": "Returns only trusted fields",
        "input": [
          {
            "page": 2,
            "size": 10,
            "other": true
          }
        ],
        "expected": {
          "page": 2,
          "size": 10
        }
      },
      {
        "name": "Accepts inclusive bounds",
        "input": [
          {
            "page": 1,
            "size": 50
          }
        ],
        "expected": {
          "page": 1,
          "size": 50
        }
      },
      {
        "name": "Rejects zero page",
        "input": [
          {
            "page": 0,
            "size": 1
          }
        ],
        "expected": null
      },
      {
        "name": "Rejects excessive size",
        "input": [
          {
            "page": 1,
            "size": 51
          }
        ],
        "expected": null
      },
      {
        "name": "Rejects fraction",
        "input": [
          {
            "page": 1.5,
            "size": 2
          }
        ],
        "expected": null
      },
      {
        "name": "Rejects numeric string",
        "input": [
          {
            "page": "1",
            "size": 2
          }
        ],
        "expected": null
      },
      {
        "name": "Rejects null",
        "input": [
          null
        ],
        "expected": null
      },
      {
        "name": "Rejects array",
        "input": [
          []
        ],
        "expected": null
      }
    ]
  },
  {
    "id": "derive-task-summary",
    "title": "Derive a task panel summary",
    "category": "Frontend state",
    "format": "transform",
    "prompt": "Return titles of unfinished tasks matching the trimmed, case-insensitive substring query, preserving labels and order. remaining counts all unfinished tasks, including those hidden by the query.",
    "note": "A blank query matches all unfinished tasks. Preserve the source objects.",
    "example": {
      "input": "taskSummary([{title:\"Write\",done:false},{title:\"Read\",done:false}], \"wr\")",
      "output": "{titles:[\"Write\"],remaining:2}"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Distinguish all unfinished tasks from visible unfinished tasks.",
    "starter": "function taskSummary(tasks: { title: string; done: boolean }[], query: string): { titles: string[]; remaining: number } {\n  // Implement the contract.\n}\n",
    "functionName": "taskSummary",
    "preserveInput": true,
    "hints": [
      "Count unfinished tasks before search filtering.",
      "Normalize only comparison text.",
      "Return original titles and preserve order."
    ],
    "checks": [
      {
        "name": "Separates total from visible count",
        "input": [
          [
            {
              "title": "Write",
              "done": false
            },
            {
              "title": "Read",
              "done": false
            }
          ],
          "wr"
        ],
        "expected": {
          "titles": [
            "Write"
          ],
          "remaining": 2
        }
      },
      {
        "name": "Excludes completed tasks",
        "input": [
          [
            {
              "title": "Write",
              "done": true
            }
          ],
          ""
        ],
        "expected": {
          "titles": [],
          "remaining": 0
        }
      },
      {
        "name": "Normalizes comparison only",
        "input": [
          [
            {
              "title": " Ada ",
              "done": false
            }
          ],
          " AD "
        ],
        "expected": {
          "titles": [
            " Ada "
          ],
          "remaining": 1
        }
      },
      {
        "name": "Handles empty input",
        "input": [
          [],
          "x"
        ],
        "expected": {
          "titles": [],
          "remaining": 0
        }
      }
    ]
  },
  {
    "id": "debug-page-offset",
    "title": "Repair a page offset",
    "category": "Real-world debugging",
    "format": "debug",
    "prompt": "Repair the starter so page is one-based: page 1 starts at index 0, page 2 at size. Return up to size IDs without changing input.",
    "note": "page and size are positive integers. A page beyond the end returns an empty array.",
    "example": {
      "input": "pageWindow([\"a\",\"b\",\"c\",\"d\",\"e\"], 2, 2)",
      "output": "[\"c\",\"d\"]"
    },
    "vocabulary": [
      {
        "term": "Contract",
        "meaning": "the input rules and observable result this function promises"
      },
      {
        "term": "Boundary",
        "meaning": "a value at the edge of an allowed range or condition"
      }
    ],
    "planPrompt": "Write expected and actual positions before repairing the offset.",
    "starter": "function pageWindow(ids: string[], page: number, size: number): string[] {\n  const start = page * size\n  return ids.slice(start, size)\n}\n",
    "functionName": "pageWindow",
    "preserveInput": true,
    "hints": [
      "Trace page 1 through the original calculation.",
      "Convert one-based page numbering to a zero-based offset.",
      "The slice end is start plus size."
    ],
    "checks": [
      {
        "name": "First page begins at zero",
        "input": [
          [
            "a",
            "b",
            "c"
          ],
          1,
          2
        ],
        "expected": [
          "a",
          "b"
        ]
      },
      {
        "name": "Second page has no gap",
        "input": [
          [
            "a",
            "b",
            "c",
            "d",
            "e"
          ],
          2,
          2
        ],
        "expected": [
          "c",
          "d"
        ]
      },
      {
        "name": "Includes a partial last page",
        "input": [
          [
            "a",
            "b",
            "c"
          ],
          2,
          2
        ],
        "expected": [
          "c"
        ]
      },
      {
        "name": "Handles past end",
        "input": [
          [
            "a"
          ],
          3,
          2
        ],
        "expected": []
      },
      {
        "name": "Handles empty input",
        "input": [
          [],
          1,
          2
        ],
        "expected": []
      }
    ]
  }
]
