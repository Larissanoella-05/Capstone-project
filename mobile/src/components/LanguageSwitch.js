import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '../context/LanguageContext.js';
import { LANGUAGES } from '../lib/i18n.js';
import { colors, fonts, radius } from '../theme.js';

/** EN | RW toggle. `onDark` is for the landing page's dark header. */
export default function LanguageSwitch({ onDark = false }) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={t('Language')}
      style={[styles.group, { borderColor: onDark ? colors.white : colors.line }]}
    >
      {LANGUAGES.map((item) => {
        const active = item.code === language;
        return (
          <Pressable
            key={item.code}
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active }}
            onPress={() => setLanguage(item.code)}
            style={[styles.option, active && { backgroundColor: colors.accent }]}
          >
            <Text
              style={[
                styles.text,
                { color: active ? colors.onAccent : onDark ? colors.white : colors.ink },
              ]}
            >
              {item.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', borderWidth: 1, borderRadius: radius, overflow: 'hidden' },
  option: { minWidth: 40, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.bold, fontSize: 12 },
});
