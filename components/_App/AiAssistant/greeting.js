/**
 * Builds a time-of-day greeting using the signed-in user's first name
 * (stored in localStorage as "name" by SignInForm).
 */
export const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

export const getUserFirstName = () => {
  if (typeof window === "undefined") return "";
  const name = (localStorage.getItem("name") || "").trim();
  return name;
};

export const getWelcomeMessage = () => {
  const greeting = getTimeGreeting();
  const firstName = getUserFirstName();
  if (firstName) {
    return `${greeting} ${firstName}! How can I help you today?`;
  }
  return `${greeting}! How can I help you today?`;
};
