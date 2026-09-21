export const FIRST_LOGIN_PASSWORD_OFFER_KEY = "offerPasswordChangeOnFirstLogin";

const USER_TYPE_USER = 2;

export function isUserTypeUser(value) {
  if (value == null) return false;
  if (value === USER_TYPE_USER || value === "2") return true;
  return String(value).trim().toUpperCase() === "USER";
}

function resultIsUserTypeUser(result) {
  return isUserTypeUser(result?.userType ?? result?.UserType);
}

export function loginOffersPasswordChange(result) {
  if (!result) return false;
  if (!resultIsUserTypeUser(result)) return false;
  return (
    result.offerPasswordChangeOnFirstLogin === true ||
    result.OfferPasswordChangeOnFirstLogin === true
  );
}

export function markFirstLoginPasswordOffer(result) {
  if (typeof window === "undefined") return;
  if (loginOffersPasswordChange(result)) {
    sessionStorage.setItem(FIRST_LOGIN_PASSWORD_OFFER_KEY, "true");
  }
}

export function hasFirstLoginPasswordOffer() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(FIRST_LOGIN_PASSWORD_OFFER_KEY) === "true";
}

export function clearFirstLoginPasswordOffer() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(FIRST_LOGIN_PASSWORD_OFFER_KEY);
}
