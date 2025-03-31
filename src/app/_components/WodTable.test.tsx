import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test-utils'; // Use custom render
import '@testing-library/jest-dom';
import WodTable from './WodTable';
import {
  type Wod,
  type WodResult,
  // Import helpers needed for data generation/verification if necessary
  // getPerformanceLevel, formatScore etc. are used internally by WodTable
} from './WodViewer';

// --- Mock next/link ---
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// --- Mock Data ---
// Re-use or adapt mocks from WodViewer.test.tsx if suitable
const mockResultTime = (seconds: number | null, rx: boolean = true, date: string = '2024-01-15', notes: string = ''): WodResult => ({
  score_time_seconds: seconds, score_reps: null, score_load: null, score_rounds_completed: null, score_partial_reps: null,
  rxStatus: rx ? 'Rx' : 'Scaled', date, notes,
});

const mockResultRounds = (rounds: number | null, partialReps: number | null = 0, rx: boolean = true, date: string = '2024-01-16', notes: string = ''): WodResult => ({
  score_time_seconds: null, score_reps: null, score_load: null, score_rounds_completed: rounds, score_partial_reps: partialReps,
  rxStatus: rx ? 'Rx' : 'Scaled', date, notes,
});

const mockWod1_NoResults: Wod = {
  wodUrl: 'test.com/wod1', wodName: 'WOD Alpha', description: 'Desc Alpha', category: 'Benchmark', tags: ['AMRAP'],
  results: [],
};

const mockWod2_OneResultRx: Wod = {
  wodUrl: 'test.com/wod2', wodName: 'WOD Bravo', description: 'Desc Bravo', category: 'Girl', tags: ['For Time'],
  benchmarks: { type: 'time', levels: { elite: {min: null, max: 180}, advanced: {min: null, max: 300}, intermediate: {min: null, max: 420}, beginner: {min: null, max: 600} } },
  results: [mockResultTime(290, true, '2024-03-10', 'Felt good')], // Advanced
};

const mockWod3_OneResultScaled: Wod = {
  wodUrl: '', wodName: 'WOD Charlie', description: 'Desc Charlie', category: 'Hero', tags: ['Chipper'],
  benchmarks: { type: 'rounds', levels: { elite: {min: 20, max: null}, advanced: {min: 15, max: null}, intermediate: {min: 10, max: null}, beginner: {min: 5, max: null} } },
  results: [mockResultRounds(12, 5, false, '2024-03-11', 'Used lighter weight')], // Scaled (Intermediate level if Rx)
};

const mockWod4_MultiResult: Wod = {
  wodUrl: 'test.com/wod4', wodName: 'WOD Delta', description: 'Desc Delta', category: 'Open', tags: ['Couplet'],
  benchmarks: { type: 'time', levels: { elite: {min: null, max: 300}, advanced: {min: null, max: 420}, intermediate: {min: null, max: 600}, beginner: {min: null, max: 900} } },
  results: [
    mockResultTime(580, true, '2024-03-12', 'First attempt'), // Intermediate
    mockResultTime(550, true, '2023-11-20', 'PR!'), // Intermediate
  ],
};

const mockWod5_NoBenchmark: Wod = {
 wodUrl: 'test.com/wod5', wodName: 'WOD Echo', description: 'Desc Echo',
 results: [mockResultRounds(10, 0, true, '2024-01-05')],
};


const testWods: Wod[] = [
  mockWod1_NoResults,
  mockWod2_OneResultRx,
  mockWod3_OneResultScaled,
  mockWod4_MultiResult,
  mockWod5_NoBenchmark,
];

describe('WodTable Component', () => {
  let handleSortMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleSortMock = vi.fn();
  });

  it('should render table headers correctly', () => {
    render(<WodTable wods={[]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Type/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Date/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Score/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Level/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Notes/ })).toBeInTheDocument();
  });

  it('should display sort indicators correctly', () => {
    const { rerender } = render(<WodTable wods={[]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout ▲/ })).toBeInTheDocument();

    rerender(<WodTable wods={[]} sortBy="wodName" sortDirection="desc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout ▼/ })).toBeInTheDocument();

    rerender(<WodTable wods={[]} sortBy="date" sortDirection="asc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout/ })).toBeInTheDocument(); // No indicator
    expect(screen.getByRole('columnheader', { name: /Date ▲/ })).toBeInTheDocument();
  });

  it('should render a "Not attempted" row for WODs with no results', () => {
    render(<WodTable wods={[mockWod1_NoResults]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const row = screen.getByRole('row', { name: /WOD Alpha/ }); // Find row by WOD name
    expect(within(row).getByText('WOD Alpha')).toBeInTheDocument();
    expect(within(row).getByText('Benchmark')).toBeInTheDocument(); // Category Badge
    expect(within(row).getByText('AMRAP')).toBeInTheDocument(); // Tag Badge
    expect(within(row).getAllByText('-')).toHaveLength(3); // Use getAllByText for multiple placeholders
    expect(within(row).getByText('Not attempted')).toBeInTheDocument(); // Score placeholder
  });

  it('should render WOD with one Rx result correctly', () => {
    render(<WodTable wods={[mockWod2_OneResultRx]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const row = screen.getByRole('row', { name: /WOD Bravo/ });
    expect(within(row).getByText('WOD Bravo')).toBeInTheDocument();
    expect(within(row).getByText('Girl')).toBeInTheDocument(); // Category
    expect(within(row).getByText('For Time')).toBeInTheDocument(); // Tag
    expect(within(row).getByText('2024-03-10')).toBeInTheDocument(); // Date
    expect(within(row).getByText(/4:50/)).toBeInTheDocument(); // Score (290s)
    expect(within(row).getByText('Rx')).toBeInTheDocument(); // Rx Status
    expect(within(row).getByText('Advanced')).toBeInTheDocument(); // Level
    // Check color class (might be brittle, depends on exact class names)
    expect(within(row).getByText('Advanced')).toHaveClass('text-green-600');
    expect(within(row).getByText('Felt good')).toBeInTheDocument(); // Notes (truncated potentially)
  });

   it('should render WOD with one Scaled result correctly', () => {
    render(<WodTable wods={[mockWod3_OneResultScaled]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const row = screen.getByRole('row', { name: /WOD Charlie/ });
    expect(within(row).getByText('WOD Charlie')).toBeInTheDocument();
    expect(within(row).getByText('Hero')).toBeInTheDocument(); // Category
    expect(within(row).getByText('Chipper')).toBeInTheDocument(); // Tag
    expect(within(row).getByText('2024-03-11')).toBeInTheDocument(); // Date
    const scoreCell = within(row).getByText(/12\+5/).closest('td');
    expect(within(scoreCell!).getByText('Scaled')).toBeInTheDocument(); // Rx Status within Score cell
    const levelCell = within(row).getByText('Scaled', { selector: 'span.rt-Text' }).closest('td'); // Find Scaled text specifically in Level cell span
    expect(levelCell).toHaveClass('rt-TableCell'); // Ensure it's the level cell
    expect(within(levelCell!).getByText('Scaled')).toHaveClass('text-foreground/70'); // Check class on the specific span
    expect(within(row).getByText('Used lighter weight')).toBeInTheDocument(); // Notes
  });

  it('should render WOD with multiple results correctly', () => {
    render(<WodTable wods={[mockWod4_MultiResult]} sortBy="date" sortDirection="desc" handleSort={handleSortMock} />); // Sort by date desc

    const rows = screen.getAllByRole('row'); // Includes header row
    expect(rows).toHaveLength(3); // Header + 2 result rows

    // First result row (latest date: 2024-03-12)
    const row1 = rows[1];
    expect(within(row1).getByText('WOD Delta')).toBeInTheDocument(); // Name on first row
    expect(within(row1).getByText('Open')).toBeInTheDocument(); // Category on first row
    expect(within(row1).getByText('Couplet')).toBeInTheDocument(); // Tag on first row
    expect(within(row1).getByText('2024-03-12')).toBeInTheDocument();
    expect(within(row1).getByText(/9:40/)).toBeInTheDocument(); // Score (580s)
    expect(within(row1).getByText('Intermediate')).toBeInTheDocument(); // Level
    expect(within(row1).getByText('First attempt')).toBeInTheDocument(); // Notes

    // Second result row (older date: 2023-11-20)
    const row2 = rows[2];
    // Check that name/category/tags are NOT repeated (cells should be empty or contain only structure)
    // This is hard to assert directly without specific data-testid or structure.
    // We'll rely on visual inspection or more complex selectors if needed.
    // Let's check the unique data for the second row:
    expect(within(row2).queryByText('WOD Delta')).not.toBeInTheDocument();
    expect(within(row2).queryByText('Open')).not.toBeInTheDocument();
    expect(within(row2).queryByText('Couplet')).not.toBeInTheDocument();
    expect(within(row2).getByText('2023-11-20')).toBeInTheDocument();
    expect(within(row2).getByText(/9:10/)).toBeInTheDocument(); // Score (550s)
    expect(within(row2).getByText('Intermediate')).toBeInTheDocument(); // Level
    expect(within(row2).getByText('PR!')).toBeInTheDocument(); // Notes
  });

   it('should render external link icon when wodUrl is present', () => {
    render(<WodTable wods={[mockWod2_OneResultRx]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const link = screen.getByRole('link', { name: /WOD Bravo/ });
    // Check for the arrow character or a specific class/element if used
    expect(within(link).getByText('↗')).toBeInTheDocument();
  });

   it('should NOT render external link icon when wodUrl is absent', () => {
    render(<WodTable wods={[mockWod3_OneResultScaled]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const nameElement = screen.getByText('WOD Charlie');
    // Ensure it's not a link and doesn't contain the icon
    expect(nameElement.tagName).not.toBe('A');
    expect(within(nameElement).queryByText('↗')).not.toBeInTheDocument();
  });

   it('should render N/A for level if no benchmarks', () => {
     render(<WodTable wods={[mockWod5_NoBenchmark]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
     const row = screen.getByRole('row', { name: /WOD Echo/ });
     const cells = within(row).getAllByRole('cell');
     // Level column (index 4) should be empty based on current output
     expect(cells[4]).toBeEmptyDOMElement();
   });


  it('should call handleSort when clicking sortable headers', () => {
    render(<WodTable wods={testWods} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);

    fireEvent.click(screen.getByRole('columnheader', { name: /Workout ▲/ }));
    expect(handleSortMock).toHaveBeenCalledWith('wodName');

    fireEvent.click(screen.getByRole('columnheader', { name: /Date/ }));
    expect(handleSortMock).toHaveBeenCalledWith('date');

    fireEvent.click(screen.getByRole('columnheader', { name: /Level/ }));
    expect(handleSortMock).toHaveBeenCalledWith('level');

    // Non-sortable headers should not trigger handleSort
    fireEvent.click(screen.getByRole('columnheader', { name: /Type/ }));
    fireEvent.click(screen.getByRole('columnheader', { name: /Score/ }));
    fireEvent.click(screen.getByRole('columnheader', { name: /Notes/ }));
    expect(handleSortMock).toHaveBeenCalledTimes(3); // Only the 3 sortable ones
  });

});
