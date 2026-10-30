import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Async, ErrorState } from './States.js';

// The icon font is a binary asset that Jest cannot load; the icons are not what is being tested.
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));

describe('ErrorState', () => {
  it('says "No connection" with the reason and a Try again button when the server cannot be reached', async () => {
    const retry = jest.fn();
    await render(<ErrorState error={{ status: 0, message: 'Cannot reach the server. Check your connection and try again.' }} onRetry={retry} />);

    expect(screen.getByText('No connection')).toBeTruthy();
    expect(screen.getByText('Cannot reach the server. Check your connection and try again.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps the generic title for a server error', async () => {
    await render(<ErrorState error={{ status: 500, message: 'The request failed (500).' }} onRetry={() => {}} />);
    expect(screen.getByText('This did not load')).toBeTruthy();
    expect(screen.queryByText('No connection')).toBeNull();
  });
});

describe('Async', () => {
  const content = () => <Text>Loaded content</Text>;

  it('shows a No connection strip above content that is already loaded, and retries from it', async () => {
    const reload = jest.fn();
    await render(
      <Async state={{ data: { ok: true }, loading: false, error: null, offline: true, reload }} label="Loading">
        {content}
      </Async>
    );

    expect(screen.getByText('Loaded content')).toBeTruthy();
    expect(screen.getByText('No connection. Showing the last update.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows no strip when the connection is fine', async () => {
    await render(
      <Async state={{ data: { ok: true }, loading: false, error: null, offline: false, reload: () => {} }} label="Loading">
        {content}
      </Async>
    );
    expect(screen.getByText('Loaded content')).toBeTruthy();
    expect(screen.queryByText(/No connection/)).toBeNull();
  });

  it('shows the full No connection screen when the first load fails offline', async () => {
    await render(
      <Async state={{ data: null, loading: false, error: { status: 0, message: 'Offline.' }, offline: false, reload: () => {} }} label="Loading">
        {content}
      </Async>
    );
    expect(screen.getByText('No connection')).toBeTruthy();
    expect(screen.queryByText('Loaded content')).toBeNull();
  });
});
