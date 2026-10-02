// Owner: Jammy. Plain-text note export of a ConfirmedPlan.
import { formatDose } from '../contract/plan.js';

/** @param {import('../contract/plan.js').ConfirmedPlan} plan */
export function buildText(plan) {
  const lines = ['RxCal medication plan', `Start: ${plan.startDate}`, ''];
  for (const m of plan.meds) {
    lines.push(`- ${m.name}: ${m.slots.map(formatDose).join('-')} for ${m.durationDays} day${m.durationDays === 1 ? '' : 's'}${m.note ? `. ${m.note}` : ''}`);
  }
  lines.push('', 'Generated on-device by RxCal. Check against your prescription.');
  return lines.join('\n');
}
