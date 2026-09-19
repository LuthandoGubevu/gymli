import { format } from 'date-fns';
import type { ClassInfo, ClassOccurrence, Day } from './types';

// Day.getDay() indices (0 = Sunday); the Day type only covers weekdays.
const DAY_INDEX: Record<Day, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

export function slotId(classId: string, date: string): string {
  return `${classId}_${date}`;
}

/**
 * Returns the dated occurrences of a recurring weekly class within the next
 * `daysAhead` days (inclusive of today), matching Virgin Active's "book up
 * to 8 days ahead" model.
 */
export function getUpcomingOccurrences(cls: ClassInfo, daysAhead = 8): ClassOccurrence[] {
  const targetDayIndex = DAY_INDEX[cls.day];
  const occurrences: ClassOccurrence[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    if (date.getDay() === targetDayIndex) {
      const dateStr = format(date, 'yyyy-MM-dd');
      occurrences.push({ slotId: slotId(cls.id, dateStr), classId: cls.id, date: dateStr });
    }
  }

  return occurrences;
}

export function getAllUpcomingOccurrences(classes: ClassInfo[], daysAhead = 8): ClassOccurrence[] {
  return classes
    .flatMap((cls) => getUpcomingOccurrences(cls, daysAhead))
    .sort((a, b) => a.date.localeCompare(b.date));
}
