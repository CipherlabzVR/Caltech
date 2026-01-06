import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext({
  currency: "USD",
  setCurrency: () => {},
  formatCurrency: (value) => value,
  getCurrencySymbol: () => "$",
});

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState("USD");

  // Load currency from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("hrCurrency");
      if (savedCurrency === "USD" || savedCurrency === "LKR") {
        setCurrencyState(savedCurrency);
      }
    }
  }, []);

  // Save currency to localStorage when it changes
  const setCurrency = (newCurrency) => {
    if (newCurrency === "USD" || newCurrency === "LKR") {
      setCurrencyState(newCurrency);
      if (typeof window !== "undefined") {
        localStorage.setItem("hrCurrency", newCurrency);
      }
    }
  };

  // Format currency value with symbol
  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return "0.00";
    }
    
    if (currency === "LKR") {
      return new Intl.NumberFormat("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    } else {
      // USD
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numValue);
    }
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currency === "LKR" ? "Rs." : "$";
  };

  // Format currency with symbol
  const formatCurrencyWithSymbol = (value) => {
    return `${getCurrencySymbol()}${formatCurrency(value)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        getCurrencySymbol,
        formatCurrencyWithSymbol,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;

