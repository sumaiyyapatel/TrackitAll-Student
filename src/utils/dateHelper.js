/**
 * Standardized date handling for the app
 * All dates stored as ISO strings in Firestore
 */

/**
 * Format ISO date string to readable format
 * @param {string|Date} dateInput - ISO string or Date object
 * @returns {string} Formatted date
 */
export const formatDate = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' 
      ? new Date(dateInput) 
      : dateInput instanceof Date 
      ? dateInput 
      : dateInput.toDate?.(); // Firestore Timestamp
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Format date with time
 */
export const formatDateTime = (dateInput) => {
  if (!dateInput) return '';
  
  try {
    const date = typeof dateInput === 'string' 
      ? new Date(dateInput) 
      : dateInput instanceof Date 
      ? dateInput 
      : dateInput.toDate?.();
    
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

/**
 * Get current date as ISO string
 */
export const getCurrentDateISO = () => {
  return new Date().toISOString();
};

/**
 * Calculate days remaining until date
 */
export const calculateDaysRemaining = (deadline) => {
  try {
    if (!deadline) return null;
    
    const deadlineDate = typeof deadline === 'string' 
      ? new Date(deadline) 
      : deadline instanceof Date 
      ? deadline 
      : deadline.toDate?.();
    
    if (isNaN(deadlineDate.getTime())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Days calculation error:', error);
    return null;
  }
};

/**
 * Format time duration (minutes to hours:minutes)
 */
export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};