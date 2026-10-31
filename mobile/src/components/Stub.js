import { Text } from 'react-native';
import { colors, fonts } from '../theme.js';
import { PageHeading } from './Bits.js';
import { Screen } from './Shell.js';

/** Placeholder body for a screen that a later phase fills in. */
export function Stub({ eyebrow, title }) {
  return (
    <Screen>
      <PageHeading eyebrow={eyebrow} title={title} />
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: colors.muted }}>
        This screen is coming soon.
      </Text>
    </Screen>
  );
}
