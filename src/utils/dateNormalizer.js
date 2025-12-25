export const normalizeDate = (dateValue) => {
  if (!dateValue) return null;

  // Firestore Timestamp
  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }

  // Date object
  if (dateValue instanceof Date) return dateValue;

  // ISO string or number
  return new Date(dateValue);
};

export default normalizeDate;
