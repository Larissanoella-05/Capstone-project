import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme.js';

const ToastContext = createContext(() => {});

/** One short confirmation or error message at the bottom of the screen. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message, kind = 'success') => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <View pointerEvents="none" style={[styles.host, { bottom: 80 + insets.bottom }]}>
        {toast && (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            style={[styles.toast, toast.kind === 'error' && styles.error]}
          >
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  toast: { maxWidth: 440, borderWidth: 1, borderColor: colors.ink, backgroundColor: colors.ink, paddingHorizontal: 16, paddingVertical: 12 },
  error: { backgroundColor: colors.danger },
  text: { color: colors.white, fontFamily: fonts.bold, fontSize: 14 },
});
