import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme.js';

/**
 * Faint circuit lines, a pylon and a soft glow behind a screen, like the web's `Backdrop`.
 * Put it first inside a relatively positioned frame; it ignores touches.
 */
export default function Backdrop() {
  return (
    <View pointerEvents="none" style={styles.fill} accessibilityElementsHidden>
      <View style={styles.glow} />
      <Svg width={300} height={206} viewBox="0 0 760 520" style={styles.circuit}>
        <Path
          d="M0 80h180l40 40h160l30-30h170M0 190h120l50 50h210l40-40h180M60 0v110l40 40v120l40 40h140M420 0v70l30 30v90M0 330h200l40 40h120"
          stroke={colors.accent}
          strokeOpacity={0.1}
          strokeWidth={2}
          fill="none"
        />
        {[
          [180, 80],
          [380, 120],
          [170, 190],
          [440, 200],
          [140, 310],
          [420, 100],
        ].map(([cx, cy]) => (
          <Circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={5}
            fill={colors.accent}
            fillOpacity={0.14}
          />
        ))}
      </Svg>
      <Svg width={120} height={196} viewBox="0 0 220 360" style={styles.pylon}>
        <Path
          d="M110 10v30M70 40h80M100 40 70 130M120 40l30 90M70 130h80M70 130 40 260M150 130l30 130M40 260h140M40 260l-20 100M180 260l20 100M70 130l80 130M150 130l-80 130M20 110h50M150 110h50"
          stroke={colors.ink}
          strokeOpacity={0.07}
          strokeWidth={3}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glow: {
    position: 'absolute',
    top: -140,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  circuit: { position: 'absolute', top: 0, left: 0 },
  pylon: { position: 'absolute', right: 8, bottom: 0 },
});
