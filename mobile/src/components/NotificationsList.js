import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Eyebrow, PageHeading } from './Bits.js';
import { Screen } from './Shell.js';
import { Async, EmptyState } from './States.js';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationsContext.js';
import { useToast } from '../context/ToastContext.js';
import { api } from '../lib/api.js';
import { timeAgo } from '../lib/format.js';
import { routeForNotification } from '../lib/routes.js';
import { colors, fonts } from '../theme.js';

/** The Alerts tab, shared by the customer and the technician. */
export default function NotificationsList({ intro }) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const state = useNotifications();
  const [busy, setBusy] = useState(false);

  async function markAllRead() {
    setBusy(true);
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      await state.reload();
      toast('All notifications marked as read.');
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function open(notification) {
    try {
      if (!notification.read) {
        await api(`/notifications/${notification.id}/read`, { method: 'PATCH' });
        state.reload();
      }
    } catch {
      // Opening the fault matters more than the read flag.
    }
    const route = notification.faultId
      ? routeForNotification(user.role, { faultId: notification.faultId })
      : null;
    if (route) router.push(route);
  }

  return (
    <Screen>
      <PageHeading eyebrow={state.data ? `${state.unread} unread` : 'Alerts'} title="Notifications">
        {intro ? <Text style={styles.intro}>{intro}</Text> : null}
      </PageHeading>

      <Async state={state} label="Loading notifications">
        {(data) =>
          data.notifications.length === 0 ? (
            <EmptyState title="No notifications yet">
              Updates about your faults will appear here.
            </EmptyState>
          ) : (
            <>
              <Button
                label="Mark all as read"
                tone="outline"
                disabled={busy || state.unread === 0}
                onPress={markAllRead}
                style={{ alignSelf: 'flex-start' }}
              />
              <View style={{ gap: 12 }}>
                {data.notifications.map((notification) => (
                  <Pressable
                    key={notification.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${notification.read ? '' : 'Unread. '}${notification.title}. ${notification.message}`}
                    onPress={() => open(notification)}
                    style={[styles.item, notification.read ? styles.read : styles.unread]}
                  >
                    <View style={styles.top}>
                      <Text style={styles.title}>{notification.title}</Text>
                      <Eyebrow style={{ color: colors.muted }}>
                        {timeAgo(notification.createdAt)}
                      </Eyebrow>
                    </View>
                    <Text style={styles.message}>{notification.message}</Text>
                    {!notification.read ? (
                      <View style={styles.pill}>
                        <Text style={styles.pillText}>New</Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </>
          )
        }
      </Async>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: 12, fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  item: { borderWidth: 1, padding: 16 },
  read: { borderColor: colors.line, backgroundColor: colors.white },
  unread: { borderColor: colors.ink, backgroundColor: colors.voltSoft },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: {
    flex: 1,
    fontFamily: fonts.black,
    fontSize: 16,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  message: { marginTop: 8, fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  pill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.ink,
    backgroundColor: colors.volt,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillText: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: colors.ink,
  },
});
