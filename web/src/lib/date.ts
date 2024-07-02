
import {
  differenceInCalendarDays,
  formatDate
} from "date-fns";

export function parseDateToRelativeString(dateString: string): string | null {
  const date = formatDate(dateString, "yyyy-MM-dd");
  if (!isValidDate(date)) {
    return null;
  }
  // Parse the date string into a Date object
  const dateObject = new Date(date);

  // Get the current date
  const currentDate = new Date();

  // Calculate the difference in days
  const differenceInDays = Math.abs(
    differenceInCalendarDays(dateObject, currentDate),
  );

  if (differenceInDays === 0) {
    return "Today";
  } else if (differenceInDays === 1) {
    return "Yesterday";
  } else if (differenceInDays <= 7) {
    return `Previous ${differenceInDays} days`;
  } else if (differenceInDays <= 30) {
    const weeks = Math.floor(differenceInDays / 7);
    return `Previous ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
  } else if (differenceInDays <= 365) {
    const months = Math.floor(differenceInDays / 30);
    return `Previous ${months} ${months === 1 ? "month" : "months"}`;
  } else {
    const years = Math.floor(differenceInDays / 365);
    return `${years} ${years === 1 ? "year" : "years"}`;
  }
}


export function isValidDate(dateString: string) {
  // Check if the input is in the format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // Attempt to create a Date object from the input
  const dateParts = dateString.split("-");
  if (!dateParts.length) {
    return false
  }

  const [y = "", m = "", d = ""] = dateParts || [];

  const year = parseInt(y, 10);
  const month = parseInt(m, 10) - 1; // Months are 0-based
  const day = parseInt(d, 10);
  const dateObject = new Date(year, month, day);

  // Check if the Date object represents a valid date
  return (
    dateObject.getFullYear() === year &&
    dateObject.getMonth() === month &&
    dateObject.getDate() === day
  );
}
