import { describe, expect, test, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoursePredictorScreen } from '../../../src/adapters/driving/ui/components/CoursePredictorScreen';

const VALID_GPX = `<?xml version="1.0"?>
<gpx><trk><trkseg>
  <trkpt lat="51.5007" lon="-0.1246"><ele>10</ele></trkpt>
  <trkpt lat="51.5107" lon="-0.1246"><ele>60</ele></trkpt>
  <trkpt lat="51.5207" lon="-0.1246"><ele>10</ele></trkpt>
</trkseg></trk></gpx>`;

function gpxFile(content: string, name = 'course.gpx') {
  return new File([content], name, { type: 'application/gpx+xml' });
}

describe('CoursePredictorScreen', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('uploading a GPX via the file picker and entering a pace predicts a total time and splits', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const input = screen.getByTestId('gpx-file-input') as HTMLInputElement;
    await userEvent.upload(input, gpxFile(VALID_GPX));
    await user.type(screen.getByLabelText('Target pace'), '5:00');
    await user.click(screen.getByRole('button', { name: 'Predict' }));

    await waitFor(() => expect(screen.getByTestId('course-total-time')).toBeInTheDocument());
    expect(screen.getByTestId('course-splits-table')).toBeInTheDocument();
  });

  test('dropping a GPX file onto the drop zone loads it the same as the file picker', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const dropzone = screen.getByTestId('course-dropzone');
    const file = gpxFile(VALID_GPX);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(screen.getByText('course.gpx')).toBeInTheDocument());

    await user.type(screen.getByLabelText('Target pace'), '5:00');
    await user.click(screen.getByRole('button', { name: 'Predict' }));
    await waitFor(() => expect(screen.getByTestId('course-total-time')).toBeInTheDocument());
  });

  test('an invalid GPX file shows a clear error instead of a prediction', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const input = screen.getByTestId('gpx-file-input') as HTMLInputElement;
    await userEvent.upload(input, gpxFile('not gpx at all', 'bad.gpx'));
    await user.type(screen.getByLabelText('Target pace'), '5:00');
    await user.click(screen.getByRole('button', { name: 'Predict' }));

    await waitFor(() => expect(screen.getByTestId('course-predictor-error')).toBeInTheDocument());
    expect(screen.queryByTestId('course-total-time')).not.toBeInTheDocument();
  });

  test('an empty target pace shows a clear error instead of a prediction', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const input = screen.getByTestId('gpx-file-input') as HTMLInputElement;
    await userEvent.upload(input, gpxFile(VALID_GPX));
    await user.click(screen.getByRole('button', { name: 'Predict' }));

    await waitFor(() => expect(screen.getByTestId('course-predictor-error')).toBeInTheDocument());
    expect(screen.queryByTestId('course-total-time')).not.toBeInTheDocument();
  });

  test('the back button calls onBack', async () => {
    const user = userEvent.setup();
    let wentBack = false;
    render(<CoursePredictorScreen onBack={() => (wentBack = true)} />);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(wentBack).toBe(true);
  });

  test('saving a prediction adds it to the saved predictions list', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const input = screen.getByTestId('gpx-file-input') as HTMLInputElement;
    await userEvent.upload(input, gpxFile(VALID_GPX));
    await user.type(screen.getByLabelText('Target pace'), '5:00');
    await user.click(screen.getByRole('button', { name: 'Predict' }));
    await waitFor(() => expect(screen.getByTestId('course-total-time')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Save prediction' }));

    expect(screen.getByTestId('saved-predictions-list')).toBeInTheDocument();
    expect(screen.getAllByTestId('saved-prediction-item')).toHaveLength(1);
  });

  test('reopening a saved prediction shows its result without re-uploading', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const input = screen.getByTestId('gpx-file-input') as HTMLInputElement;
    await userEvent.upload(input, gpxFile(VALID_GPX));
    await user.type(screen.getByLabelText('Target pace'), '5:00');
    await user.click(screen.getByRole('button', { name: 'Predict' }));
    await waitFor(() => expect(screen.getByTestId('course-total-time')).toBeInTheDocument());
    const totalTime = screen.getByTestId('course-total-time').textContent;
    await user.click(screen.getByRole('button', { name: 'Save prediction' }));

    render(<CoursePredictorScreen onBack={() => {}} />);
    const items = screen.getAllByTestId('saved-prediction-item');
    await user.click(within(items[items.length - 1]).getByTestId('open-saved-prediction'));

    const totalTimes = screen.getAllByTestId('course-total-time');
    expect(totalTimes[totalTimes.length - 1].textContent).toBe(totalTime);
  });

  test('deleting a saved prediction removes it from the list', async () => {
    const user = userEvent.setup();
    render(<CoursePredictorScreen onBack={() => {}} />);

    const input = screen.getByTestId('gpx-file-input') as HTMLInputElement;
    await userEvent.upload(input, gpxFile(VALID_GPX));
    await user.type(screen.getByLabelText('Target pace'), '5:00');
    await user.click(screen.getByRole('button', { name: 'Predict' }));
    await waitFor(() => expect(screen.getByTestId('course-total-time')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Save prediction' }));

    await user.click(screen.getByRole('button', { name: /Delete saved prediction course\.gpx/ }));

    expect(screen.queryByTestId('saved-predictions-list')).not.toBeInTheDocument();
  });
});
