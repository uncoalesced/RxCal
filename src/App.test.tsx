import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { downloadFile } from './export/download';

vi.mock('./export/download', () => ({ downloadFile: vi.fn() }));

async function fillMedication(
  user: ReturnType<typeof userEvent.setup>,
  index: number,
  values: { name: string; dosage: string; days: string },
) {
  const group = screen.getByRole('group', { name: `Medication ${index}` });
  const within = (label: string) =>
    group.querySelector<HTMLInputElement>(`input[id$="-${label}"]`) as HTMLInputElement;
  await user.type(within('name'), values.name);
  await user.type(within('dosage'), values.dosage);
  await user.type(within('days'), values.days);
}

describe('App', () => {
  beforeEach(() => vi.mocked(downloadFile).mockClear());

  it('blocks export until the form is valid and the user confirms it', async () => {
    const user = userEvent.setup();
    render(<App />);

    const calendarButton = screen.getByRole('button', { name: /download calendar/i });
    const confirm = screen.getByRole('checkbox', { name: /i have checked/i });
    expect(calendarButton).toBeDisabled();
    expect(confirm).toBeDisabled();

    await fillMedication(user, 1, { name: 'Paracetamol 500 mg', dosage: '1-0-1', days: '5' });
    expect(screen.getByText('Morning 1 · Night 1')).toBeInTheDocument();
    expect(calendarButton).toBeDisabled();

    await user.click(confirm);
    expect(calendarButton).toBeEnabled();

    await user.click(calendarButton);
    expect(downloadFile).toHaveBeenCalledTimes(1);
    const [filename, content, mime] = vi.mocked(downloadFile).mock.calls[0]!;
    expect(filename).toMatch(/^rxcal-\d{4}-\d{2}-\d{2}\.ics$/);
    expect(mime).toBe('text/calendar;charset=utf-8');
    expect(content.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });

  it('requires re-confirmation after any edit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillMedication(user, 1, { name: 'Cetirizine', dosage: '0-0-1', days: '3' });

    const confirm = screen.getByRole('checkbox', { name: /i have checked/i });
    await user.click(confirm);
    expect(confirm).toBeChecked();

    await user.clear(screen.getByLabelText('Days'));
    await user.type(screen.getByLabelText('Days'), '4');
    expect(confirm).not.toBeChecked();
  });

  it('explains that text dosage codes are not supported yet', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText('Dosage'), 'BD');
    expect(
      screen.getAllByText(/Dosage codes like "BD" aren't supported yet/).length,
    ).toBeGreaterThan(0);
  });

  it('supports several medications and exports a text note', async () => {
    const user = userEvent.setup();
    render(<App />);
    await fillMedication(user, 1, { name: 'Paracetamol', dosage: '1-0-1', days: '5' });
    await user.click(screen.getByRole('button', { name: /add medication/i }));
    await fillMedication(user, 2, { name: 'Pantoprazole', dosage: '1-0-0-0', days: '10' });

    await user.click(screen.getByRole('checkbox', { name: /i have checked/i }));
    await user.click(screen.getByRole('button', { name: /download note/i }));

    const [filename, content] = vi.mocked(downloadFile).mock.calls[0]!;
    expect(filename).toMatch(/\.txt$/);
    expect(content).toContain('1. Paracetamol');
    expect(content).toContain('2. Pantoprazole');
    expect(content).toContain('Dosage: 1-0-0-0 (Morning 1)');
  });
});
