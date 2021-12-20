import { addDays } from "date-fns";

export function get30DaysFromNow() {
  return addDays(new Date(), 30);
}
