/**
 * Pickup Time Validation & Persistence Utility
 * Implements Option 2: Auto-Reset Expired Pickup Time with EX Guards
 */

/**
 * Validates whether the stored pickup time is still valid in the future.
 * Returns the formatted label (e.g. "Hari ini, 12 : 30") if valid, or null if expired/missing.
 */
export function getValidPickupTime() {
  try {
    const raw = localStorage.getItem('dimsum_time');
    if (!raw || raw === 'Pilih Waktu Pickup') return null;

    // 1. If stored as structured JSON
    if (raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const now = Date.now();
        // Check timestamp expiration
        if (parsed.timestamp && Number(parsed.timestamp) <= now) {
          localStorage.removeItem('dimsum_time');
          return null;
        }

        // Check if saved on a previous calendar date for "Hari ini"
        if (parsed.isToday && parsed.savedDate) {
          const todayIso = new Date().toISOString().split('T')[0];
          if (parsed.savedDate !== todayIso) {
            localStorage.removeItem('dimsum_time');
            return null;
          }
        }

        return parsed.label || null;
      }
    }

    // 2. If stored as legacy plain string e.g. "Hari ini, 10 : 30"
    const parts = raw.split(',').map((s) => s.trim());
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1]; // e.g. "10 : 30"
      const [hourStr, minStr] = timePart.split(':').map((s) => s.trim());
      const hour = parseInt(hourStr, 10);
      const min = parseInt(minStr, 10);

      if (isNaN(hour) || isNaN(min)) {
        localStorage.removeItem('dimsum_time');
        return null;
      }

      const now = new Date();
      if (datePart.toLowerCase() === 'hari ini') {
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, 0);
        // If target pickup time is past or right now, it is expired!
        if (target.getTime() <= now.getTime()) {
          localStorage.removeItem('dimsum_time');
          return null;
        }
        return raw;
      } else {
        // Multi-day date format check (e.g. "Jum 18 Sep 2026")
        const parsedDate = new Date(`${datePart} ${hour}:${min}`);
        if (!isNaN(parsedDate.getTime()) && parsedDate.getTime() <= now.getTime()) {
          localStorage.removeItem('dimsum_time');
          return null;
        }
        return raw;
      }
    }

    return null;
  } catch (err) {
    console.error('Error validating pickup time:', err);
    try {
      localStorage.removeItem('dimsum_time');
    } catch {}
    return null;
  }
}

/**
 * Saves a chosen pickup time to localStorage with exact timestamp and calendar metadata
 * so future sessions can validate expiration reliably.
 */
export function savePickupTime(selectedDate, selectedTime, availableDates = []) {
  if (!selectedDate || !selectedTime) return null;

  const isToday = selectedDate === 'Hari ini';
  const now = new Date();
  const [hourStr, minStr] = selectedTime.split(':').map((s) => s.trim());
  const hour = parseInt(hourStr, 10) || 9;
  const min = parseInt(minStr, 10) || 0;

  let targetDate;
  if (isToday) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, 0);
    // Explicit Guard: Reject times that have already passed today
    if (targetDate.getTime() <= now.getTime()) {
      return null;
    }
  } else {
    // Find index in availableDates if possible
    const dayIndex = availableDates.indexOf(selectedDate);
    const offsetDays = dayIndex > 0 ? dayIndex : 1;
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays, hour, min, 0);
    if (targetDate.getTime() <= now.getTime()) {
      return null;
    }
  }

  const label = `${selectedDate}, ${selectedTime}`;
  const data = {
    label,
    selectedDate,
    selectedTime,
    isToday,
    savedDate: now.toISOString().split('T')[0],
    timestamp: targetDate.getTime(),
  };

  try {
    localStorage.setItem('dimsum_time', JSON.stringify(data));
  } catch (err) {
    console.error('Error saving pickup time:', err);
  }

  return label;
}

/**
 * Clears stored pickup time from localStorage
 */
export function clearPickupTime() {
  try {
    localStorage.removeItem('dimsum_time');
  } catch {}
}
