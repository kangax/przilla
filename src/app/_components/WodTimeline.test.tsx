import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '../../test-utils'; // Use custom render
import '@testing-library/jest-dom';
import WodTimeline from './WodTimeline';
import {
  type Wod,
  type WodResult,
} from './WodViewer'; // Import types

// --- Mock next/link ---
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// --- Mock Data ---
const mockResultTime = (seconds: number | null, rx = true, date = '2024-01-15', notes = ''): WodResult => ({
  score_time_seconds: seconds, score_reps: null, score_load: null, score_rounds_completed: null, score_partial_reps: null,
  rxStatus: rx ? 'Rx' : 'Scaled', date, notes,
});

const mockResultNoScore = (date = '2024-01-19'): WodResult => ({
  score_time_seconds: null, score_reps: null, score_load: null, score_rounds_completed: null, score_partial_reps: null,
  rxStatus: null, date,
});

const mockWod1_MultiResultSorted: Wod = {
  wodUrl: 'test.com/wod1', wodName: 'WOD Alpha', description: 'Desc Alpha\nLine 2', category: 'Benchmark', tags: ['AMRAP'],
  benchmarks: { type: 'time', levels: { elite: {min: null, max: 180}, advanced: {min: null, max: 300}, intermediate: {min: null, max: 420}, beginner: {min: null, max: 600} } },
  results: [
    mockResultTime(310, true, '2024-03-10', 'Tough one'), // Intermediate
    mockResultTime(290, true, '2024-01-05', 'First try'), // Advanced
    mockResultTime(250, false, '2024-05-15', 'Scaled but faster'), // Advanced (if Rx)
  ],
};

const mockWod2_SomeInvalidResults: Wod = {
  wodUrl: '', wodName: 'WOD Bravo', description: 'Desc Bravo', category: 'Girl', tags: ['For Time'],
  results: [
    mockResultTime(400, true, '2024-02-20', 'Good pace'),
    mockResultNoScore('2024-02-21'), // No score, should be filtered by hasScore
    { ...mockResultTime(380, true, '', 'Forgot date'), date: undefined }, // No date, should be filtered
  ],
};

const mockWod3_NoValidResults: Wod = {
  wodUrl: 'test.com/wod3', wodName: 'WOD Charlie', description: 'Desc Charlie',
  results: [
     mockResultNoScore('2024-01-01'),
     { ...mockResultTime(380, true, '', 'No date'), date: undefined },
  ],
};

const mockWod4_SingleValidResult: Wod = {
  wodUrl: 'test.com/wod4', wodName: 'WOD Delta', description: 'Desc Delta',
  results: [mockResultTime(500, true, '2023-12-15', 'Solo effort')],
};


const testWods: Wod[] = [
  mockWod1_MultiResultSorted,
  mockWod2_SomeInvalidResults,
  mockWod3_NoValidResults,
  mockWod4_SingleValidResult,
];

describe('WodTimeline Component', () => {
  let handleSortMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    handleSortMock = vi.fn();
  });

  it('should render table headers correctly', () => {
    render(<WodTimeline wods={[]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Progress Timeline/ })).toBeInTheDocument();
     expect(screen.getByRole('columnheader', { name: /Description/ })).toBeInTheDocument();
  });

  it('should display sort indicators correctly', () => {
    const { rerender } = render(<WodTimeline wods={[]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout ▲/ })).toBeInTheDocument();

    rerender(<WodTimeline wods={[]} sortBy="latestLevel" sortDirection="desc" handleSort={handleSortMock} />);
    expect(screen.getByRole('columnheader', { name: /Workout/ })).toBeInTheDocument(); // No indicator
     expect(screen.getByRole('columnheader', { name: /Progress Timeline.*▼/ })).toBeInTheDocument();
  });

  it('should render all passed WODs, including those without valid results', () => {
    render(<WodTimeline wods={testWods} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    expect(screen.getByRole('row', { name: /WOD Alpha/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /WOD Bravo/ })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /WOD Charlie/ })).toBeInTheDocument(); // Should now be rendered
    expect(screen.getByRole('row', { name: /WOD Delta/ })).toBeInTheDocument();
  });

  it('should render "Not Attempted" for WODs with no valid results', () => {
    render(<WodTimeline wods={[mockWod3_NoValidResults]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const row = screen.getByRole('row', { name: /WOD Charlie/ });
    const timelineCell = within(row).getAllByRole('cell')[1]; // Second cell is the timeline
    expect(within(timelineCell).getByText('Not Attempted')).toBeInTheDocument();
    expect(within(timelineCell).getByText('Not Attempted')).toHaveClass('italic'); // Check for styling
  });


  it('should render results chronologically within a WOD row', () => {
    render(<WodTimeline wods={[mockWod1_MultiResultSorted]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const row = screen.getByRole('row', { name: /WOD Alpha/ });
    const resultsContainer = within(row).getAllByRole('cell')[1]; // Second cell contains the timeline Flex
    const resultsText = within(resultsContainer).getAllByText(/^[0-9]+:[0-9]{2}/); // Match MM:SS format

    // Expected order based on dates: 2024-01-05 (290s), 2024-03-10 (310s), 2024-05-15 (250s)
    expect(resultsText[0]).toHaveTextContent('4:50'); // 290s
    expect(resultsText[1]).toHaveTextContent('5:10'); // 310s
    expect(resultsText[2]).toHaveTextContent('4:10'); // 250s

    // Check separators
    expect(within(resultsContainer).getAllByText('→')).toHaveLength(2);
  });

  it('should render score, badge, and color correctly for each result', () => {
     render(<WodTimeline wods={[mockWod1_MultiResultSorted]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
     const row = screen.getByRole('row', { name: /WOD Alpha/ });
     const resultsContainer = within(row).getAllByRole('cell')[1];

     // Result 1: 2024-01-05, 290s, Rx (Advanced)
     const result1Score = within(resultsContainer).getByText('4:50');
     expect(result1Score).toHaveClass('text-green-600'); // Advanced color
     expect(within(result1Score.parentElement).getByText('Rx')).toBeInTheDocument();

     // Result 2: 2024-03-10, 310s, Rx (Intermediate)
     const result2Score = within(resultsContainer).getByText('5:10');
     expect(result2Score).toHaveClass('text-yellow-600'); // Intermediate color
     expect(within(result2Score.parentElement).getByText('Rx')).toBeInTheDocument();

     // Result 3: 2024-05-15, 250s, Scaled
     const result3Score = within(resultsContainer).getByText('4:10');
     expect(result3Score).toHaveClass('text-foreground/70'); // Scaled color (default)
     expect(within(result3Score.parentElement).getByText('Scaled')).toBeInTheDocument();
  });

  it('should render WOD description correctly (including newlines)', () => {
    render(<WodTimeline wods={[mockWod1_MultiResultSorted]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const row = screen.getByRole('row', { name: /WOD Alpha/ });
    const descriptionCell = within(row).getAllByRole('cell')[2];
    // Check for text content, whitespace might be tricky
    expect(descriptionCell).toHaveTextContent('Desc Alpha');
    expect(descriptionCell).toHaveTextContent('Line 2');
    // Check for pre-line whitespace style
    expect(descriptionCell.querySelector('span')).toHaveClass('whitespace-pre-line');
  });

  it('should render external link icon when wodUrl is present', () => {
    render(<WodTimeline wods={[mockWod1_MultiResultSorted]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const link = screen.getByRole('link', { name: /WOD Alpha/ });
    expect(within(link).getByText('↗')).toBeInTheDocument();
  });

  it('should NOT render external link icon when wodUrl is absent', () => {
    render(<WodTimeline wods={[mockWod2_SomeInvalidResults]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
    const nameElement = screen.getByText('WOD Bravo');
    expect(nameElement.tagName).not.toBe('A');
    expect(within(nameElement).queryByText('↗')).not.toBeInTheDocument();
  });

  // Tooltip testing is limited, just check presence of tooltip trigger/content structure if possible
  it('should have tooltips on results', () => {
     render(<WodTimeline wods={[mockWod1_MultiResultSorted]} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);
     const row = screen.getByRole('row', { name: /WOD Alpha/ });
     const resultsContainer = within(row).getAllByRole('cell')[1];
     const resultElements = within(resultsContainer).getAllByText(/^[0-9]+:[0-9]{2}/); // Find scores again

     // Check if the parent element (Text) acts as a tooltip trigger (often has cursor-help)
     expect(resultElements[0].parentElement).toHaveClass('cursor-help');
     expect(resultElements[1].parentElement).toHaveClass('cursor-help');
     expect(resultElements[2].parentElement).toHaveClass('cursor-help');
     // Note: Verifying tooltip *content* on hover is complex in JSDOM and usually skipped or done in E2E tests.
  });


  it('should call handleSort when clicking sortable headers', () => {
    render(<WodTimeline wods={testWods} sortBy="wodName" sortDirection="asc" handleSort={handleSortMock} />);

    fireEvent.click(screen.getByRole('columnheader', { name: /Workout ▲/ }));
    expect(handleSortMock).toHaveBeenCalledWith('wodName');

    fireEvent.click(screen.getByRole('columnheader', { name: /Progress Timeline/ }));
    expect(handleSortMock).toHaveBeenCalledWith('latestLevel'); // Maps to 'latestLevel'

    // Non-sortable header
    fireEvent.click(screen.getByRole('columnheader', { name: /Description/ }));
    expect(handleSortMock).toHaveBeenCalledTimes(2); // Only the 2 sortable ones
  });

});
