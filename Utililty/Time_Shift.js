// ===============================================================
//  Time_Shift.js
//  Utility to calculate time-shifting expiration limits.
//  Enforces standard operating hours (e.g., 9:00 AM to 5:00 PM, Mon-Fri).
//  Pauses authorization countdowns overnight and over weekends.
// ===============================================================

// ==============================================================
// CALCULATE EXPIRATION WITH OPERATING HOURS SHIFT
// currentDate     : Date object representing start time (typically new Date())
// durationSeconds : Total active countdown duration in seconds
// ==============================================================
exports.calculateShiftedExpiry = (startDate, durationSeconds) => {
  let currentDate = new Date(startDate);
  let remainingSeconds = durationSeconds;

  // Standard Operating Hours Configurations
  const START_HOUR = 9;  // 9:00 AM
  const END_HOUR = 17;  // 5:00 PM
  const WORK_HOURS_PER_DAY = END_HOUR - START_HOUR; // 8 hours
  const SECONDS_PER_WORK_DAY = WORK_HOURS_PER_DAY * 3600; // 28,800 seconds

  // Helper function to shift a Date to the start of the next working day
  const rollToNextWorkingDayStart = (date) => {
    let nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(START_HOUR, 0, 0, 0);

    // If next day is Saturday, jump to Monday
    if (nextDate.getDay() === 6) {
      nextDate.setDate(nextDate.getDate() + 2);
    }
    // If next day is Sunday, jump to Monday
    else if (nextDate.getDay() === 0) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate;
  };

  // 1. If start date is outside work hours or on a weekend, push it to the next work window start
  const day = currentDate.getDay();
  const currentHour = currentDate.getHours();

  if (day === 0 || day === 6 || currentHour >= END_HOUR) {
    // Weekend or after-hours: Roll to next Monday/working morning at 9:00 AM
    currentDate.setHours(START_HOUR, 0, 0, 0);
    if (day === 6) { // Saturday
      currentDate.setDate(currentDate.getDate() + 2);
    } else if (day === 0) { // Sunday
      currentDate.setDate(currentDate.getDate() + 1);
    } else { // Weekday evening
      currentDate = rollToNextWorkingDayStart(currentDate);
    }
  } else if (currentHour < START_HOUR) {
    // Before-hours on a weekday: Snap to today's 9:00 AM start
    currentDate.setHours(START_HOUR, 0, 0, 0);
  }

  // 2. Loop and consume remaining active seconds within operating windows
  while (remainingSeconds > 0) {
    // Establish the end boundary for today's working window (5:00 PM)
    const endOfTodayWorkWindow = new Date(currentDate);
    endOfTodayWorkWindow.setHours(END_HOUR, 0, 0, 0);

    // Calculate how many seconds are left in today's active work window
    const secondsLeftInTodayWindow = (endOfTodayWorkWindow.getTime() - currentDate.getTime()) / 1000;

    if (remainingSeconds <= secondsLeftInTodayWindow) {
      // If remaining seconds fit within today's window, apply and finish!
      currentDate = new Date(currentDate.getTime() + remainingSeconds * 1000);
      remainingSeconds = 0;
    } else {
      // Otherwise, consume today's remaining window and roll over to tomorrow morning
      remainingSeconds -= secondsLeftInTodayWindow;
      currentDate = rollToNextWorkingDayStart(currentDate);
    }
  }

  return currentDate;
};
