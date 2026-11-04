import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme.js';

const LAVENDER = '#9d8cf0';

/** A soft glow that fades to nothing at its edge (a flat circle would show a hard rim). */
function Wash({ color, opacity, size, style }) {
  const id = `wash${color.slice(1)}`;
  return (
    <Svg width={size} height={size} style={[styles.wash, style]}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

/** A line-drawing pylon, `width` wide (the drawing is 220 by 360). */
function Pylon({ width, opacity = 0.3, style }) {
  return (
    <Svg
      width={width}
      height={(width * 360) / 220}
      viewBox="0 0 220 360"
      style={[styles.pylon, style]}
    >
      <Path
        d="M110 10v30M70 40h80M100 40 70 130M120 40l30 90M70 130h80M70 130 40 260M150 130l30 130M40 260h140M40 260l-20 100M180 260l20 100M70 130l80 130M150 130l-80 130M20 110h50M150 110h50"
        stroke={colors.steel}
        strokeOpacity={opacity}
        strokeWidth={3}
        fill="none"
      />
    </Svg>
  );
}

/**
 * Faint circuit lines, a pylon and soft red and lavender glows behind a screen, like the web's `Backdrop`.
 * Put it first inside a relatively positioned frame; it sits behind the content and ignores touches.
 * `pylons` adds a big one in the middle and a small one on the left, for the roomy sign-in screen.
 */
export default function Backdrop({ pylons = false }) {
  return (
    <View pointerEvents="none" style={styles.fill} accessibilityElementsHidden>
      <Wash color={colors.accent} opacity={0.13} size={420} style={{ top: -170, right: -170 }} />
      <Wash color={LAVENDER} opacity={0.3} size={460} style={{ bottom: -150, left: -170 }} />
      <Svg width={300} height={206} viewBox="0 0 760 520" style={styles.circuit}>
        <Path
          d="M0 80h180l40 40h160l30-30h170M0 190h120l50 50h210l40-40h180M60 0v110l40 40v120l40 40h140M420 0v70l30 30v90M0 330h200l40 40h120"
          stroke={colors.accent}
          strokeOpacity={0.12}
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
            fillOpacity={0.16}
          />
        ))}
      </Svg>
      {pylons ? (
        <>
          <Pylon width={170} opacity={0.22} style={styles.pylonMiddle} />
          <Pylon width={100} style={styles.pylonLeft} />
        </>
      ) : null}
      <Pylon width={120} style={styles.pylonCorner} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  wash: { position: 'absolute' },
  circuit: { position: 'absolute', top: 0, left: 0 },
  pylon: { position: 'absolute' },
  // Inside the frame, not on its edge, so no line of the drawing is cut off.
  pylonCorner: { right: 12, bottom: 12 },
  pylonLeft: { left: 12, bottom: 12 },
  pylonMiddle: { left: '50%', marginLeft: -85, bottom: 130 },
});
