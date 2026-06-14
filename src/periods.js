// Index 1..7 maps to the Chinese weekday label (1 = Monday).
export const WEEK_LABEL = ['', '一', '二', '三', '四', '五', '六', '日'];

// Default number of weekly occurrences for one semester.
export const DEFAULT_WEEKS = 18;

// Two same-course periods merge into one event when the gap between them is at
// most this many minutes. Real between-class breaks are <= 20 min; a non-adjacent
// jump (e.g. across the lunch period) is much larger, so 30 separates them cleanly.
export const MAX_GAP_MIN = 30;
