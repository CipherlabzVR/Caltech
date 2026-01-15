import { createContext } from "react";

export const TopbarContext = createContext({
  activeButton: "quick-access",
  setActiveButton: () => {},
  hoverMode: false,
  setHoverMode: () => {},
});

