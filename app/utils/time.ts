import { addDays } from "date-fns";

export function get30DaysFromNow() {
  return addDays(new Date(), 30);
}

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
}).format;
