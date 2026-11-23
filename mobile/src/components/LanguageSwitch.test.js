import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { LanguageProvider, useT } from '../context/LanguageContext.js';
import LanguageSwitch from './LanguageSwitch.js';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
}));

function Sample() {
  const t = useT();
  return <Text>{t('Report a fault')}</Text>;
}

describe('LanguageSwitch', () => {
  it('shows English first and switches the screen text to Kinyarwanda and back', async () => {
    await render(
      <LanguageProvider>
        <LanguageSwitch />
        <Sample />
      </LanguageProvider>
    );
    expect(screen.getByText('Report a fault')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Kinyarwanda'));
    expect(screen.getByText('Tanga ikibazo')).toBeTruthy();
    expect(screen.queryByText('Report a fault')).toBeNull();

    await fireEvent.press(screen.getByLabelText('English'));
    expect(screen.getByText('Report a fault')).toBeTruthy();
  });

  it('saves the choice so the next launch starts in it', async () => {
    const SecureStore = require('expo-secure-store');
    await render(
      <LanguageProvider>
        <LanguageSwitch />
      </LanguageProvider>
    );
    await fireEvent.press(screen.getByLabelText('Kinyarwanda'));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('umuriro.language', 'rw');
  });
});
