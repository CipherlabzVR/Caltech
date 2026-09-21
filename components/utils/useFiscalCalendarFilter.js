import { useEffect, useState } from "react";
import BASE_URL from "Base/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json",
});

export default function useFiscalCalendarFilter() {
  const [fiscalYears, setFiscalYears] = useState([]);
  const [fiscalYearId, setFiscalYearId] = useState("");
  const [periods, setPeriods] = useState([]);
  const [fiscalPeriodId, setFiscalPeriodId] = useState("");

  useEffect(() => {
    const loadYears = async () => {
      try {
        const response = await fetch(`${BASE_URL}/FiscalYear/GetAllFiscalYears`, {
          method: "GET",
          headers: authHeaders(),
        });
        if (!response.ok) return;
        const data = await response.json();
        setFiscalYears(Array.isArray(data.result) ? data.result : []);
      } catch (error) {
        console.error(error);
      }
    };
    loadYears();
  }, []);

  useEffect(() => {
    if (!fiscalYearId) {
      setPeriods([]);
      return;
    }
    const loadPeriods = async () => {
      try {
        const response = await fetch(`${BASE_URL}/FiscalYear/GetPeriodsByYear/${fiscalYearId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        if (!response.ok) return;
        const data = await response.json();
        setPeriods(Array.isArray(data.result) ? data.result : []);
      } catch (error) {
        console.error(error);
      }
    };
    loadPeriods();
  }, [fiscalYearId]);

  return {
    fiscalYears,
    fiscalYearId,
    setFiscalYearId,
    periods,
    fiscalPeriodId,
    setFiscalPeriodId,
  };
}
