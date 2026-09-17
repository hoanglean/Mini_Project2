import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Reservation } from '../types/booking';
import { getSlotNotificationTriggerDate } from './dateHelper';

// Configure notification presentation when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Request user permission for local notifications
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('campus-bookings', {
        name: 'Campus Room Bookings',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
      });
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Notification permission error:', error);
    return false;
  }
};

/**
 * Schedule a reminder notification 15 minutes before the booked time slot
 */
export const schedulePreSlotReminder = async (
  reservation: Reservation
): Promise<string | undefined> => {
  try {
    const triggerDate = getSlotNotificationTriggerDate(
      reservation.date,
      reservation.timeSlot
    );

    const now = new Date();
    // Only schedule if the 15-min warning is in the future
    if (triggerDate.getTime() > now.getTime()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Booking: ${reservation.roomName}`,
          body: `Your session begins in 15 minutes (${reservation.timeSlot}) at ${reservation.building}, Floor ${reservation.floor}. Have your QR pass ready!`,
          data: { reservationId: reservation.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });

      return notificationId;
    }
  } catch (error) {
    console.warn('Failed to schedule pre-slot notification:', error);
  }
  return undefined;
};

/**
 * Trigger an instant confirmation notification when booking succeeds
 */
export const triggerInstantBookingConfirmation = async (
  reservation: Reservation
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Reservation Confirmed!',
        body: `Reserved ${reservation.roomName} (${reservation.roomCode}) for ${reservation.date} at ${reservation.timeSlot}.`,
        data: { reservationId: reservation.id },
        sound: true,
      },
      trigger: null, // deliver immediately
    });
  } catch (error) {
    console.warn('Failed to send immediate confirmation notification:', error);
  }
};

/**
 * Cancel a scheduled reminder when a reservation is cancelled
 */
export const cancelScheduledReminder = async (
  notificationId?: string
): Promise<void> => {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn('Failed to cancel scheduled notification:', error);
  }
};
