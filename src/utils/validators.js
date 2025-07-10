// Email validation
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export function validatePassword(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

// Phone number validation
export function validatePhone(phone) {
  const phoneRegex = /^\+?[\d\s-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// Username validation (alphanumeric, underscore, 3-20 chars)
export function validateUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// Golf score validation
export function validateScore(score, par) {
  return Number.isInteger(score) && score >= 1 && score <= (par + 5);
}

// Handicap validation
export function validateHandicap(handicap) {
  return !isNaN(handicap) && handicap >= -10 && handicap <= 54;
}

// GPS coordinate validation
export function validateCoordinates(lat, lon) {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

// Pride points validation
export function validatePridePoints(amount) {
  return Number.isInteger(amount) && amount > 0 && amount <= 10000;
}