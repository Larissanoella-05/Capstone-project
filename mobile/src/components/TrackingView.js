import { Image, StyleSheet, Text, View } from 'react-native';
import { useT } from '../context/LanguageContext.js';
import { useToast } from '../context/ToastContext.js';
import {
  CATEGORY_LABEL,
  CUSTOMER_HEADLINE,
  OUTCOME_LABEL,
  STATUS_LABEL,
  firstNames,
  fmtDateTime,
  fmtKm,
  locationLine,
  timeAgo,
} from '../lib/format.js';
import { openLink } from '../lib/links.js';
import { faultMapParts } from '../lib/mapParts.js';
import { colors, fonts, radius } from '../theme.js';
import { Button, Cell, Eyebrow, Panel, PanelHead, Timeline } from './Bits.js';
import MapView from './MapView.js';

/** One fault as its reporter sees it. A guest's payload has no phone numbers, so the Call button hides itself. */
export default function TrackingView({ fault }) {
  const toast = useToast();
  const t = useT();
  const { markers, lines } = faultMapParts(fault);
  const technician = fault.technician;
  const approaching = fault.status === 'ON_THE_WAY' || fault.status === 'ASSIGNED';
  const onSite = fault.status === 'ARRIVED' || fault.status === 'WORKING';
  const canCall = technician?.phone && fault.status !== 'RESOLVED' && fault.status !== 'CANCELLED';
  return (
    <>
      <View
        style={[
          styles.hero,
          fault.status === 'RESOLVED' && { backgroundColor: colors.ok },
          fault.status === 'CANCELLED' && { backgroundColor: colors.danger },
        ]}
      >
        <Eyebrow style={{ color: colors.onAccent, opacity: 0.85 }}>
          {t('Fault #{reference}', { reference: fault.reference })} ·{' '}
          {t(CATEGORY_LABEL[fault.category])}
        </Eyebrow>
        <Text accessibilityRole="header" style={styles.title}>
          {t(CUSTOMER_HEADLINE[fault.status])}
        </Text>
      </View>

      <Panel>
        <MapView markers={markers} lines={lines} height={260} />
        <View style={styles.cells}>
          <Cell label={t('Technician')} style={styles.half}>
            {technician?.name ?? t('Not assigned yet')}
          </Cell>
          <Cell label={t('Status')} style={[styles.half, styles.leftRule]}>
            {t(STATUS_LABEL[fault.status])}
          </Cell>
          <Cell label={t('Distance')} style={[styles.half, styles.topRule]}>
            {approaching ? fmtKm(technician?.distanceKm) : onSite ? t('On site') : '—'}
          </Cell>
          <Cell label={t('Last updated')} style={[styles.half, styles.leftRule, styles.topRule]}>
            {timeAgo(fault.updatedAt, t)}
          </Cell>
        </View>
        {canCall ? (
          <View style={styles.callRow}>
            <Button
              label={t('Call {name}', { name: firstNames(technician.name) })}
              tone="volt"
              icon="phone"
              onPress={async () => {
                if (!(await openLink(`tel:${technician.phone.replace(/\s/g, '')}`)))
                  toast(t('This phone cannot make calls.'), 'error');
              }}
            />
          </View>
        ) : null}
      </Panel>

      <Panel>
        <PanelHead>{t('Response timeline')}</PanelHead>
        <Timeline fault={fault} audience="customer" />
      </Panel>

      {fault.status === 'RESOLVED' ? (
        <Panel>
          <PanelHead style={{ backgroundColor: colors.ok }}>{t('Resolution')}</PanelHead>
          <View style={styles.body}>
            <Text style={styles.outcome}>{t(OUTCOME_LABEL[fault.outcome] ?? 'Resolved')}</Text>
            <Text style={styles.text}>{fault.resolutionNote}</Text>
            <Text style={styles.completed}>
              {t('Completed {when}', { when: fmtDateTime(fault.resolvedAt, t) })}
            </Text>
          </View>
        </Panel>
      ) : null}

      <Panel>
        <PanelHead>{t('Your report')}</PanelHead>
        <View style={styles.body}>
          <View>
            <Eyebrow>{t('Service location')}</Eyebrow>
            <Text style={styles.value}>
              {locationLine(fault.serviceLocation)}
              {fault.serviceLocation.meterNumber
                ? ` · ${t('Meter {number}', { number: fault.serviceLocation.meterNumber })}`
                : ''}
            </Text>
            {fault.isGuest && fault.serviceLocation.landmark ? (
              <Text style={styles.text}>{fault.serviceLocation.landmark}</Text>
            ) : null}
          </View>
          <View>
            <Eyebrow>{t('Reported')}</Eyebrow>
            <Text style={styles.value}>{fmtDateTime(fault.reportedAt, t)}</Text>
          </View>
          <View>
            <Eyebrow>{t('Description')}</Eyebrow>
            <Text style={styles.text}>{fault.description || t('No description given.')}</Text>
          </View>
          {fault.photo ? (
            <Image
              source={{ uri: fault.photo }}
              accessibilityLabel={t('Photo attached to the report')}
              resizeMode="cover"
              style={styles.photo}
            />
          ) : null}
        </View>
      </Panel>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 6,
    borderRadius: radius,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  title: { fontFamily: fonts.black, fontSize: 24, lineHeight: 28, color: colors.onAccent },
  cells: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: colors.line },
  half: { width: '50%' },
  leftRule: { borderLeftWidth: 1, borderLeftColor: colors.line },
  topRule: { borderTopWidth: 1, borderTopColor: colors.line },
  callRow: { borderTopWidth: 1, borderTopColor: colors.line, padding: 12 },
  body: { padding: 16, gap: 12 },
  outcome: { fontFamily: fonts.black, fontSize: 16, color: colors.ink },
  text: { marginTop: 4, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  completed: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  value: { marginTop: 4, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  photo: { width: '100%', height: 240, borderRadius: radius },
});
