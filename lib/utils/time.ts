/**
 * All scenario / streak / daily logic happens on Turkey time (Europe/Istanbul, UTC+3).
 * UTC midnight = 03:00 Turkey time → a UTC date string represents 21:00 prev day → 20:59 today.
 *
 * This helper returns YYYY-MM-DD as Turkey would see it, so cron firing at
 * any point during the Turkey day generates for the correct local date.
 */
export function turkeyDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(d)
}

/**
 * Add N days to a Turkey-day string (YYYY-MM-DD), preserving Turkey timezone.
 */
export function turkeyDateOffset(days: number, base: Date = new Date()): string {
  const offset = new Date(base.getTime() + days * 86_400_000)
  return turkeyDate(offset)
}

/**
 * Returns last N days of Turkey-date strings ending with today.
 * Useful for "avoid these dates" / "last N scenarios" queries.
 */
export function lastNTurkeyDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => turkeyDateOffset(-(n - 1 - i)))
}
