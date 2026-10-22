// The plan prompt of every rep in the DSA modules. Each rep asks it before coding, and its self-review guide in
// src/review-dsa.ts opens with the same question, so both read it from here.
export const dsaPlanPrompts = {
  'grid-fewest-steps': 'What must the result minimize? Name two routes of different lengths and a map with no possible route.',
  'grid-count-rooms': 'What makes two floor cells belong to the same room? Name a small map that challenges your counting rule.',
  'grid-open-neighbours': 'Which row and column inequalities make a candidate safe to read? How will you preserve the requested order?',
  'life-count-neighbours':
    'Which eight positions surround a cell, and which of them can fall outside the board? How will you skip the cell itself?',
  'life-next-cell':
    'Which neighbour counts keep a live cell alive, and which one brings a dead cell to life? Which counts sit on the boundaries?',
  'life-next-generation':
    'Why must every cell read the current board rather than cells you have already updated? How will you build the new board without changing grid?',
  'quiet-sensor-span': 'Which spans qualify? What boundary would expose treating equality incorrectly?',
  'shared-seat-occurrences': 'How will you account for repeated seats and an exhausted list?',
  'dispatch-priority-order': 'What decides between two requests? Which ties must preserve order?',
  'first-affordable-edition': 'What distinguishes the first qualifying edition from any qualifying edition?',
  'nested-parcel-load': 'How is depth defined at the root, and what do empty arrays contribute?',
  'terminal-folder-paths': 'When does a path end, and how will sibling paths stay separate?',
  'broadcast-unreached-stations': 'What counts as received, and what should happen when a broadcast returns to a station?',
  'ticket-service-times': 'What determines a start when the desk is busy? What changes when no ticket is waiting?',
  'parcel-loading-turns': 'How will you distinguish carts with equal counts? Which event ends the counting?',
  'ds-array-operations': 'Which array can you change safely? What is the last index after appending?',
  'ds-set-operations': 'What happens when extra equals removed? What does deleting an absent value do?',
  'ds-map-operations': 'Which write wins for a repeated key? How will you keep a stored zero?',
  'ds-stack-operations': 'Which value leaves first? How do you distinguish an empty stack from a top value of zero?',
  'ds-queue-operations': 'Trace empty and one-item queues. Which end is used for adding and removing?',
  'algo-sorted-pair': 'Why does sorted order justify each move? Why must the two positions stay different?',
  'algo-window-sum': 'What does your running sum represent? How will initialization handle all-negative inputs?',
  'algo-binary-search': 'How does every iteration shrink the interval? What represents an exhausted interval?',
  'algo-insertion-sort': 'What stays ordered after each insertion? How will you keep duplicates and avoid changing the caller array?',
  'algo-merge-sorted': 'Why is the next unused value enough to compare? What happens when one list runs out?',
  'algo-recursive-sum': 'What ends a call? How do a number and a nested array contribute differently?',
  'algo-tree-depth': 'What does an empty tree return? How do child depths determine the parent depth?',
  'algo-graph-reachable': 'What makes a node valid? How will you avoid repeating work around a cycle and handle start equal to target?',
  'sort-score-records': 'Which rule wins when scores differ? What should happen when both keys match?',
  'kth-smallest-copy': 'How do duplicates affect rank? What should happen when the requested position is absent?',
  'count-unique-windows':
    'What do you need to remember about the labels currently inside a window? What must change when the window moves one position?',
  'shortest-run-reaching-target':
    'When should a run grow, and when may it give up its oldest item? Why does positivity make giving up safe?',
  'first-insertion-point':
    'Which yes/no question about one value tells you which side of the answer it is on? What index is returned when the answer is "no" everywhere?',
  'smallest-daily-capacity':
    'What are the smallest and largest capacities worth considering? If one capacity works, what does that tell you about larger ones?',
  'flatten-nested-numbers': 'What is the output order across nested boundaries? What contribution does an empty list make?',
  'count-object-leaves': 'Which supplied values count even when falsy? What does an empty nested object contribute?',
  'tree-depth-sum': 'Which nodes qualify at depth zero? How do absent branches affect the total?',
  'tree-value-path': 'What should the route contain when root is target? How will absent targets differ from an empty route?',
  'graph-shortest-hops': 'What is being minimized? Which endpoint rules apply before considering a zero-hop route?',
  'graph-connected-groups': 'How are isolated nodes counted? When do two apparently separate routes belong to the same group?',
  'simplify-file-path': 'Which segments are special? What happens when a parent segment appears with no remaining name?',
  'sorted-offset-squares': 'How do negative offsets affect output order? Which boundary will you check before coding?',
  'reading-run-summary': 'What information must each record retain? What should happen for one reading or for all equal readings?',
  'puzzle-parse-part-one':
    'What does part 1 compute, what data shape would make part 2 cheap? Name a boundary that could disprove your plan.',
  'puzzle-adapt-part-two':
    'What does part 1 compute, what data shape would make part 2 cheap? Name a boundary that could disprove your plan.',
  'next-warmer-day': 'Which later day qualifies first? Explain how equal readings and a final day affect your answer.',
  'top-k-frequent-tags': 'How will you rank equal counts and choose exactly k distinct results without changing the input?',
  'course-order': 'When is a course eligible, how do you choose among eligible courses, and how will you detect an impossible schedule?',
  'longest-shared-sequence': 'What makes a shared sequence valid? Give an example where counting shared letters ignores their order.',
  'closest-value-gap': 'Which two positions could produce the answer? What should a single value or an empty list return?',
  'tree-value-depth': 'Which depth should the root report? How will a branch that finds nothing differ from a depth of 0?',
  'graph-reachable-count': 'Which node is always counted when start is valid? How will two routes to one node count?',
  'tree-leaf-count': 'Which nodes count directly? What does a node with children contribute itself?',
  'graph-incoming-counts': 'Which list entry tells you about an incoming connection? What starts each node at?',
} satisfies Record<string, string>
