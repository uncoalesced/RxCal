import ICAL from 'ical.js';
import { describe, expect, it } from 'vitest';
import { escapeText, foldLine, generateICS } from './ics';
import { sampleOptions, samplePrescription } from './fixtures';

function parse(ics: string) {
  return new ICAL.Component(ICAL.parse(ics));
}

describe('generateICS', () => {
  const ics = generateICS(samplePrescription, sampleOptions);
  const calendar = parse(ics);
  const events = calendar.getAllSubcomponents('vevent');

  it('produces a calendar with the required RFC 5545 properties', () => {
    expect(calendar.getFirstPropertyValue('version')).toBe('2.0');
    expect(calendar.getFirstPropertyValue('prodid')).toBe('-//RxCal//Prescription Reminders//EN');
    for (const event of events) {
      expect(event.getFirstPropertyValue('uid')).toMatch(/@rxcal$/);
      expect(event.getFirstPropertyValue('dtstamp')?.toString()).toBe('2026-09-24T06:30:00Z');
    }
  });

  it('creates one recurring event per medication per non-zero slot', () => {
    // 1-0-1 → morning + night; ½-0-0-1 → morning + night.
    expect(events).toHaveLength(4);
    const uids = events.map((e) => e.getFirstPropertyValue('uid'));
    expect(new Set(uids).size).toBe(4);
    expect(uids).toEqual([
      'med-a-morning@rxcal',
      'med-a-night@rxcal',
      'med-b-morning@rxcal',
      'med-b-night@rxcal',
    ]);
  });

  it('uses floating local start times from the reminder settings', () => {
    const starts = events.map((e) => {
      const start = e.getFirstPropertyValue('dtstart') as ICAL.Time;
      return [start.toString(), start.zone === ICAL.Timezone.localTimezone];
    });
    expect(starts).toEqual([
      ['2026-09-24T08:00:00', true],
      ['2026-09-24T21:00:00', true],
      ['2026-09-24T08:00:00', true],
      ['2026-09-24T21:00:00', true],
    ]);
  });

  it('repeats daily for the prescribed number of days', () => {
    const counts = events.map((e) => {
      const rule = e.getFirstPropertyValue('rrule') as ICAL.Recur;
      expect(rule.freq).toBe('DAILY');
      return rule.count;
    });
    expect(counts).toEqual([5, 5, 3, 3]);

    const first = new ICAL.Event(events[0]!);
    const iterator = first.iterator();
    const occurrences: string[] = [];
    for (let next = iterator.next(); next; next = iterator.next())
      occurrences.push(next.toString());
    expect(occurrences).toEqual([
      '2026-09-24T08:00:00',
      '2026-09-25T08:00:00',
      '2026-09-26T08:00:00',
      '2026-09-27T08:00:00',
      '2026-09-28T08:00:00',
    ]);
  });

  it('includes the dose in the summary and a display alarm', () => {
    const summaries = events.map((e) => e.getFirstPropertyValue('summary'));
    expect(summaries).toEqual([
      'Take Paracetamol 500 mg (1)',
      'Take Paracetamol 500 mg (1)',
      'Take Amoxicillin, 250 mg; syrup (½)',
      'Take Amoxicillin, 250 mg; syrup (1)',
    ]);
    for (const event of events) {
      const alarm = event.getFirstSubcomponent('valarm');
      expect(alarm?.getFirstPropertyValue('action')).toBe('DISPLAY');
      expect(alarm?.getFirstPropertyValue('trigger')?.toString()).toBe('-PT10M');
      expect(alarm?.getFirstPropertyValue('description')).toBeTruthy();
    }
  });

  it('round-trips special characters in the description', () => {
    const description = events[2]!.getFirstPropertyValue('description') as string;
    expect(description).toContain('Dosage: ½-0-0-1 (Morning ½ · Night 1)');
    expect(description).toContain('Notes: Shake well\\before use');
    expect(description).toContain('Prescribed: 23 Sep 2026');
    expect(description.split('\n').length).toBeGreaterThan(3);
  });

  it('uses CRLF line endings and folds every line to 75 octets', () => {
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
    const encoder = new TextEncoder();
    for (const line of ics.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});

describe('escapeText', () => {
  it('escapes backslashes, separators and newlines', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\;c\\,d\\ne');
  });
});

describe('foldLine', () => {
  it('leaves short lines alone', () => {
    expect(foldLine('SUMMARY:short')).toBe('SUMMARY:short');
  });

  it('never splits a multi-byte character and unfolds to the original', () => {
    const line = 'SUMMARY:' + '½'.repeat(60);
    const folded = foldLine(line);
    const encoder = new TextEncoder();
    for (const part of folded.split('\r\n')) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
      expect(part).not.toContain('�');
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });
});
