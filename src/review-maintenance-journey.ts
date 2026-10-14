import type { RepDepth } from './rep-depth.ts'
import type { ReflectionGuide } from './reflection-guides.ts'

export const maintenanceJourneyDepth: Record<string, RepDepth> = {
  'read-shipping-quote': {
    reasoning: 'Predicting unfamiliar code means following what it does, not what its names promise. Each file owns one decision: rates.ts picks the zone, quote.ts decides the billed weight and which price rule fires last, and summary.ts turns a cost into a line. A prediction is only right when every decision is traced in order.',
    trace: 'whole-kg: " SG" is trimmed and uppercased to a region code. billableKg(2) is floor(2) + 1 = 3, so the standard price is 8 + 3 * 3 = 17. Not express, subtotal 40 is below 100, so quote returns 17 and shippingLine prints Shipping: 17. A whole-kilogram weight is billed one kilogram more than a fractional weight just below it.',
    alternative: 'Run the module and copy the output. That gives the answer without the understanding, and it cannot tell you whether a surprising result is a bug. Tracing first lets you notice that 2 kg costs more than the sheet implies.',
    counterexample: 'Predicting that 2 kg bills 2 kg because that is what "billable weight" sounds like. Only reading the floor-plus-one line shows the whole-kilogram case differs from 2.5 kg only by rounding.',
    transfer: 'Pick any function in a project you know, write three predictions with a boundary among them, and then run it. Note which prediction failed and which line explains it. This transfer is self-reviewed.',
  },
  'reproduce-quote-bug': {
    reasoning: 'A reproduction is a specific input with an expected result taken from the contract, not from the faulty code. It must fail on the reported version and pass on the trusted one, or it proves nothing. Choosing the neighbours of the reported input shows how wide the fault is.',
    trace: 'Case { SG, 2 kg, standard, subtotal 40, expected 14 } runs on a copy of the parcel. reference bills ceil(2) = 2 kg and returns 8 + 3 * 2 = 14, so it passes. reported bills floor(2) + 1 = 3 kg and returns 17, which differs, so exposes returns true. A 1.2 kg case also separates rounds-to-nearest, which bills 1 kg and returns 11 instead of 14.',
    alternative: 'Start from the report and write only that one case. It is the fastest reproduction, but a second nearby case, such as a fractional weight, shows whether the fault depends on whole numbers.',
    counterexample: 'A table containing only 2.5 kg parcels agrees with the reported code, because floor(2.5) + 1 equals ceil(2.5). It reproduces nothing and would let a regression pass unnoticed.',
    transfer: 'Take a bug report from a project you know and write the smallest input that makes it fail, with the expected result taken from the specification. Say which version would still pass your case. This transfer is self-reviewed.',
  },
  'fix-quote-bug': {
    reasoning: 'Write the regression case first so you see it fail, then change the one line that causes the report. A minimal fix keeps every price the code already got right. The case guards the repair only on inputs it covers, so the other checks protect the neighbours.',
    trace: 'The regression case { SG, 2 kg, standard, subtotal 40, expected 14 } is run on original.ts: it returns 17, so the case fails there. After you change billableKg to Math.ceil, quote returns 8 + 3 * 2 = 14, so the case passes on the fix. 2.5 kg still bills 3 kg and returns 17, so the fix keeps the price the old code got right.',
    alternative: 'Fix first and write the case afterwards. The fix may pass, but you never saw the case fail, so you do not know it detects the bug. Rewriting the whole function is another route, but it risks changing prices that were right.',
    counterexample: 'Replacing floor + 1 with Math.round fixes the 2 kg report but bills a 0.2 kg parcel as zero kilograms, and a regression table with only the 2 kg case would accept it.',
    transfer: 'Fix a bug in a project you know by adding the failing case first, then the smallest change. List two inputs near the bug that your case does not cover. This transfer is self-reviewed.',
  },
  'adapt-quote-rule': {
    reasoning: 'A changed requirement touches some rules and leaves others alone. List the unchanged behavior first, decide where each new rule enters the calculation, and test both sides of each new boundary. The order of the rules is part of the contract.',
    trace: 'SG, 30 kg, express, subtotal 0: billable weight is 30, so the standard price is 8 + 3 * 30 = 98. Express makes it ceil(98 * 1.5) = 147. The heavy fee is added after the multiplier, so the quote is 147 + 15 = 162 and the line is Shipping: 162. A free heavy parcel, such as ID, 25 kg, subtotal 200, has a shipping price of 0 and still pays the 15 fee.',
    alternative: 'Change the numbers in place without moving anything, or add a wrapper that adds the fee outside quote. A wrapper keeps quote untouched but splits the rule across two places, and the free check can then hide the fee in the wrong order.',
    counterexample: 'Adding the heavy fee before the express multiplier gives ceil((98 + 15) * 1.5) = 170 instead of 162, and returning 0 for a free parcel before the fee loses the 15. A table with no heavy express parcel and no heavy free parcel would accept both.',
    transfer: 'Take a pricing rule you know, change one number and add one surcharge, then write the old results that must not move. Say which order of the rules you chose and why. This transfer is self-reviewed.',
  },
  'maintain-library-fines': {
    reasoning: 'A report names one symptom, but the fault sits on one side of a boundary: here it is the free days, where the chargeable days go below zero. The regression cases must stand on both sides of that boundary or they will not fail on the original. Cap and waiver rules are left untouched by the fix.',
    trace: 'A book returned on time: daysLate is 0, chargeable is 0 - 2 = -2, and the fine is min(-2 * 25, 1000) = -50, which is the report. A book 3 days late: chargeable is 1 and the fine is 25. Clamping chargeable at zero gives 0 for on time and 25 for 3 days late, and a book 2 days late gives chargeable 0 and was already correct.',
    alternative: 'Clamp the final fine with Math.max(0, fine). That also removes the negative number, but it hides the wrong chargeable days; the intermediate value is still wrong and may be reused later.',
    counterexample: 'A regression table that uses only a book 3 days late, or only a 2-day late loan, passes the original code, because chargeable is 1 and 0 there. Only 0 or 1 day late exposes the fault.',
    transfer: 'Find a calculation that subtracts an allowance, list the inputs at and just under the allowance, and write which one a typical test would forget. This transfer is self-reviewed.',
  },
  'maintain-room-booking': {
    reasoning: 'The new rule is invisible to any booking shorter than four hours, so cases that never reach the fourth hour cannot fail on the old code. A good guard has one booking at three hours, which must not change, and one at four or more hours, which must. The member discount comes last.',
    trace: 'Booking 9 to 13, non-member: hours 9, 10, 11 cost 40 each (120). Hour 12 is the fourth hour, so its peak rate of 40 is halved to 20. The total is 140, and the old code returns 160 for the same booking, so a case with expected 140 fails on the old code and passes on the change.',
    alternative: 'Apply the half rate to the total after the loop. That gives wrong answers when a booking mixes peak and off-peak hours, because a different rate halves for each hour.',
    counterexample: 'A guard made only of two- and three-hour bookings passes the old code, and so does a table with only member bookings of three hours. Neither proves the new rule exists.',
    transfer: 'Add a rule that applies only past a threshold to a calculation you know. Write one case on the threshold and one past it, and say what the old code returns for each. This transfer is self-reviewed.',
  },
}

export const maintenanceJourneyGuides: Record<string, ReflectionGuide> = {
  'read-shipping-quote': {
    plan: ['Trace each case through rates.ts, quote.ts, and summary.ts in order.', 'Write the zone, billable weight, standard price, and last rule that fires.', 'Predict all six cases before you run the checks.'],
    explanation: ['Walk through one prediction line by line and name the file that decides each step.', 'Say which case surprised you and which line explains it.', 'The checks verify the predictions; your trace is self-reviewed.'],
    example: 'For whole-kg, the country is trimmed to SG so the zone is region. billableKg(2) is floor(2) + 1 = 3, so the price is 8 + 3 * 3 = 17. It is not express and 40 is under 100, so the line is Shipping: 17. The surprise is that 2 kg bills three kilograms.',
  },
  'reproduce-quote-bug': {
    plan: ['Write the reported parcel with its price from the sheet.', 'Add a nearby parcel that tells the reported code apart from a rounding variant.', 'Decide how exposes copies each parcel and compares the result.'],
    explanation: ['Say which input reproduces the report and why the reported code fails it.', 'Explain why a case that every version passes reproduces nothing.', 'Name a version your table would still accept. The checks cannot show the table is complete.'],
    example: 'My cases are SG 2 kg subtotal 40 expecting 14, which separates the reported code, and ID 1.2 kg subtotal 0 expecting 6, which separates rounding to the nearest kilogram. exposes copies each parcel, runs the named version, and returns true when a price differs.',
  },
  'fix-quote-bug': {
    plan: ['Write the regression case and predict that it fails on original.ts.', 'Find the one line that decides the billed weight.', 'List the prices that must stay the same after the change.'],
    explanation: ['Explain what the case shows on the original and on your fix.', 'Say which line caused the report and why the others were left alone.', 'Name an input near the bug that your cases do not cover. The checks cannot show the suite is complete.'],
    example: 'My case is SG 2 kg subtotal 40 expecting 14; the original returns 17 and fails it. I changed billableKg from floor + 1 to Math.ceil, so 2 kg bills 2 kg and 2.5 kg still bills 3. Prices for express, free shipping, and invalid parcels did not move.',
  },
  'adapt-quote-rule': {
    plan: ['List the behavior the change must not touch.', 'Decide where the threshold and the heavy fee enter the calculation.', 'Choose a case on each side of 120 and of 20 kg.'],
    explanation: ['Explain the order: weight, price or express price, free check, then the heavy fee.', 'Say which old checks guard the unchanged behavior.', 'Passing the checks does not prove you made the smallest change; review that yourself.'],
    example: 'I moved the free threshold to 120 in rates.ts and added HEAVY_KG and HEAVY_FEE there. In quote.ts I compute the shipping price first, with express and free rules unchanged, then add the fee when the billable weight is over 20. SG 30 kg express gives 147 + 15 = 162.',
  },
  'maintain-library-fines': {
    plan: ['Run the reported loans through the code by hand.', 'Pick late-day counts on both sides of the free days.', 'Write the cases before changing fines.ts.'],
    explanation: ['Say which line produced the negative fine and for which late-day counts.', 'Explain why your cases fail on the original and pass on the fix.', 'Name a loan your cases would not catch. The checks cannot show the suite is complete.'],
    example: 'My cases are a book returned on time (0), a book 1 day late (0), a book 2 days late (0), and a book 3 days late (25). The original returns -50 and -25 for the first two, so they fail there. I clamped the chargeable days at zero, which leaves the cap and the waiver as they were.',
  },
  'maintain-room-booking': {
    plan: ['Compute by hand a 3-hour and a 4-hour booking under the old and new rules.', 'Decide the order of the half rate and the member discount.', 'Write cases that reach the fourth hour before changing pricing.ts.'],
    explanation: ['Say which of your cases differ between the old code and your change, and why.', 'Explain why the half rate applies per hour and not to the total.', 'Name a booking your cases would not catch. The checks cannot show the suite is complete.'],
    example: 'My cases are 9 to 12 expecting 120, which both versions price the same, and 9 to 13 expecting 140, where the old code returns 160. In pricing.ts each hour past the third uses half of its own rate, and the member discount applies to the total after that.',
  },
}
