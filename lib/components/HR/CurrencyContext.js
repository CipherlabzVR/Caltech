import React, { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext({
  currency: "USD",
  setCurrency: () => {},
  formatCurrency: (value) => value,
  getCurrencySymbol: () => "$",
  formatCurrencyWithSymbol: (value) => value,
  formatAmountForCurrency: (value, _code) => value,
});

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
};

export function normalizeHrCurrencyCode(code) {
  const raw = (code ?? "USD").toString().trim().toUpperCase();
  if (raw === "LKR") return "LKR";
  return "USD";
}

function formatNumberForCode(numValue, code) {
  if (code === "LKR") {
    return new Intl.NumberFormat("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numValue);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

function symbolForCode(code) {
  return code === "LKR" ? "Rs." : "$";
}

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState("USD");


  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("hrCurrency");
      if (savedCurrency === "USD" || savedCurrency === "LKR") {
        setCurrencyState(savedCurrency);
      }
    }
  }, []);


  const setCurrency = (newCurrency) => {
    if (newCurrency === "USD" || newCurrency === "LKR") {
      setCurrencyState(newCurrency);
      if (typeof window !== "undefined") {
        localStorage.setItem("hrCurrency", newCurrency);
      }
    }
  };


  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) {
      return "0.00";
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return "0.00";
    }

    return formatNumberForCode(numValue, currency);
  };


  const getCurrencySymbol = () => {
    return symbolForCode(currency);
  };


  const formatCurrencyWithSymbol = (value) => {
    return `${getCurrencySymbol()}${formatCurrency(value)}`;
  };

  const formatAmountForCurrency = (value, currencyCode) => {
    if (value === null || value === undefined || value === "") {
      return `${symbolForCode(normalizeHrCurrencyCode(currencyCode))}0.00`;
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return `${symbolForCode(normalizeHrCurrencyCode(currencyCode))}0.00`;
    }
    const code = normalizeHrCurrencyCode(currencyCode);
    return `${symbolForCode(code)}${formatNumberForCode(numValue, code)}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatCurrency,
        getCurrencySymbol,
        formatCurrencyWithSymbol,
        formatAmountForCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export default CurrencyContext;

