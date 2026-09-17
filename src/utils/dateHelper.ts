import { TimeSlot } from '../types/booking';

export const TIME_SLOTS: TimeSlot[] = [
  '07:30 - 09:30',
  '09:30 - 11:30',
  '13:00 - 15:00',
  '15:00 - 17:00',
];

export interface DayInfo {
  dateString: string; // YYYY-MM-DD
  dayName: string; // 'Mon', 'Tue'
  dayNumber: string; // '17'
  monthName: string; // 'Sep'
  isToday: boolean;
  fullDate: Date;
}

/**
 * Generates an array of the next `count` days starting from today
 */
export const getUpcomingDays = (count = 7): DayInfo[] => {
  const days: DayInfo[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    days.push({
      dateString,
      dayName: i === 0 ? 'Today' : dayNames[d.getDay()],
      dayNumber: String(d.getDate()),
      monthName: monthNames[d.getMonth()],
      isToday: i === 0,
      fullDate: d,
    });
  }

  return days;
};

/**
 * Formats YYYY-MM-DD string into user friendly format
 * e.g. "Thu, Sep 17, 2026"
 */
export const formatDisplayDate = (dateString: string): string => {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const d = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return d.toLocaleDateString('en-US', options);
};

/**
 * Returns whether a slot has already passed for the current local time today.
 */
export const isSlotInPast = (dateString: string, slot: TimeSlot): boolean => {
  const todayStr = getUpcomingDays(1)[0].dateString;
  if (dateString < todayStr) return true;
  if (dateString > todayStr) return false;

  // If today, check current hour/minute
  const [startStr] = slot.split(' - ');
  const [startHour, startMin] = startStr.split(':').map(Number);

  const now = new Date();
  const slotDate = new Date();
  slotDate.setHours(startHour, startMin, 0, 0);

  return now.getTime() > slotDate.getTime();
};

/**
 * Calculates a Date object 15 minutes before slot start for local notification
 */
export const getSlotNotificationTriggerDate = (
  dateString: string,
  slot: TimeSlot
): Date => {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const [startStr] = slot.split(' - ');
  const [startHour, startMin] = startStr.split(':').map(Number);

  const slotStart = new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    startHour,
    startMin,
    0,
    0
  );

  // 15 minutes prior
  const triggerDate = new Date(slotStart.getTime() - 15 * 60 * 1000);
  return triggerDate;
};
