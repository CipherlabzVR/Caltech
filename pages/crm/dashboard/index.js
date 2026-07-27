import React, { useState, useEffect, useCallback } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PercentIcon from "@mui/icons-material/Percent";
import PersonIcon from "@mui/icons-material/Person";
import TargetIcon from "@mui/icons-material/GpsFixed";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BASE_URL from "Base/api";
import getUserByEmail from "@/components/utils/getUserByEmail";
import { formatCurrency } from "@/components/utils/formatHelper";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const timePeriods = [
  { value: 6, label: "Daily" },
  { value: 7, label: "Monthly" },
  { value: 8, label: "Yearly" },
  { value: 9, label: "Weekly" },
];

/** HTML date inputs use YYYY-MM-DD; parsing with new Date(str) is UTC and can shift the local calendar day. */
function parseDashboardDateInput(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const local = new Date(y, mo, d);
      if (
        local.getFullYear() !== y ||
        local.getMonth() !== mo ||
        local.getDate() !== d
      ) {
        return null;
      }
      return local;
    }
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

export default function CRMDashboard() {
  const userEmail = localStorage.getItem("user");
  const userType = parseInt(localStorage.getItem("type")) || null;
  const userId = parseInt(localStorage.getItem("userid")) || null;
  const { data: userData, loading: userLoading } = getUserByEmail(userEmail);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [salesPersons, setSalesPersons] = useState([]);
  const [selectedSalesPersonId, setSelectedSalesPersonId] = useState("All");
  const [isAllSelected, setIsAllSelected] = useState(false);

  const isSalesPerson = userType === 24;

  useEffect(() => {
    const styleId = "apexcharts-vertical-labels";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .apexcharts-datalabels-group text,
        .apexcharts-datalabel text {
          transform: rotate(90deg) !important;
          transform-origin: center !important;
          white-space: nowrap !important;
        }
        .apexcharts-datalabel {
          transform: rotate(90deg) !important;
        }
      `;
      document.head.appendChild(style);
    }
    
    const applyRotation = () => {
      const labels = document.querySelectorAll('.apexcharts-datalabel text, .apexcharts-datalabels-group text');
      labels.forEach(label => {
        if (!label.style.transform || !label.style.transform.includes('rotate')) {
          label.style.transform = 'rotate(90deg)';
          label.style.transformOrigin = 'center';
        }
      });
    };
    
    const observer = new MutationObserver(() => {
      setTimeout(applyRotation, 100);
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(applyRotation, 500);
    
    return () => observer.disconnect();
  }, [dashboardData]);

  const calculateDateRange = (timePeriod) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let fromDate, toDate;

    switch (timePeriod) {
      case 6:
        fromDate = new Date(today);
        toDate = new Date(today);
        break;
      case 7:
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        break;
      case 8:
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = new Date(today.getFullYear(), 11, 31);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        break;
      case 9:
        const dayOfWeek = today.getDay();
        let mondayOffset;
        if (dayOfWeek === 0) {
          mondayOffset = -6;
        } else {
          mondayOffset = 1 - dayOfWeek;
        }
        fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + 6);
        toDate.setHours(0, 0, 0, 0);
        break;
      default:
        fromDate = new Date(today);
        toDate = new Date(today);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
    }

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      from: formatDate(fromDate),
      to: formatDate(toDate),
    };
  };

  const fetchSalesPersons = useCallback(async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/SalesPerson/GetAllSalesPersonCRM`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch sales persons");
      }

      const data = await response.json();
      if (data.statusCode === 200 && data.result) {
        setSalesPersons(data.result);
      }
    } catch (error) {
    }
  }, []);

  const fetchDashboardData = useCallback(async (fromDate, toDate) => {
    const currentUserId = parseInt(localStorage.getItem("userid")) || null;
    if (!currentUserId) {
      return;
    }

    setLoading(true);
    try {
      const formatDate = (date) => {
        if (typeof date === 'string') {
          return date;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}-${month}-${year}`;
      };

      let fromDateStr, toDateStr;
      
      if (fromDate && toDate) {
        fromDateStr = formatDate(fromDate);
        toDateStr = formatDate(toDate);
      } else {
        const today = new Date();
        fromDateStr = formatDate(today);
        toDateStr = formatDate(today);
      }

      const response = await fetch(
        `${BASE_URL}/CRMDashboard/GetDashboardDetails?userId=${currentUserId}&fromDate=${fromDateStr}&toDate=${toDateStr}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.statusCode === 200 && data.result) {
        setDashboardData(data.result);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDashboardDataBySalesPerson = useCallback(
    async (fromDate, toDate, salesPersonIdOverride = null) => {
      const spId =
        salesPersonIdOverride != null
          ? String(salesPersonIdOverride)
          : selectedSalesPersonId;
      if (!spId || spId === "All") return;

      setLoading(true);
      try {
        const formatDate = (date) => {
          if (typeof date === "string") {
            return date;
          }
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        let fromDateStr, toDateStr;

        if (fromDate && toDate) {
          fromDateStr = formatDate(fromDate);
          toDateStr = formatDate(toDate);
        } else {
          const today = new Date();
          fromDateStr = formatDate(today);
          toDateStr = formatDate(today);
        }

        const response = await fetch(
          `${BASE_URL}/CRMDashboard/GetDashboardDetailsBySalesPersonId?salesPersonId=${encodeURIComponent(
            spId
          )}&fromDate=${fromDateStr}&toDate=${toDateStr}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        if (data.statusCode === 200 && data.result) {
          const result = data.result;
          const personMeta = salesPersons.find(
            (p) => String(p.id) === String(spId)
          );
          setDashboardData((prev) => ({
            ...result,
            selectedSalesPersonId: String(spId),
            isFilteredView: true,
            salesPersonName: personMeta?.name || prev?.salesPersonName || "",
            allData: prev?.allData,
          }));
          setIsAllSelected(false);
          if (fromDate && toDate) {
            setDateRange({ from: fromDateStr, to: toDateStr });
          }
        } else {
          toast.error(data.message || "Failed to load sales person dashboard");
        }
      } catch (error) {
        toast.error("Failed to load sales person dashboard");
      } finally {
        setLoading(false);
      }
    },
    [selectedSalesPersonId, salesPersons]
  );

  const fetchAllSalesPersonsDashboard = useCallback(async (fromDate, toDate) => {
    setLoading(true);
    try {
      const formatDate = (date) => {
        if (typeof date === 'string') {
          return date;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const today = new Date();
      let defaultFromDate, defaultToDate;
      
      if (fromDate) {
        defaultFromDate = parseDashboardDateInput(fromDate);
      } else {
        defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      
      if (toDate) {
        defaultToDate = parseDashboardDateInput(toDate);
      } else {
        defaultToDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }

      if (!defaultFromDate) {
        defaultFromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      if (!defaultToDate) {
        defaultToDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      
      const fromDateStr = formatDate(defaultFromDate);
      const toDateStr = formatDate(defaultToDate);

      const response = await fetch(
        `${BASE_URL}/CRMDashboard/GetAllCRMSalesPersonsDashboard?fromDate=${fromDateStr}&toDate=${toDateStr}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      if (data.statusCode === 200 && data.result) {
        const allData = data.result;
        const salesPersonsList =
          allData.salesPersons ?? allData.SalesPersons ?? [];
        const totalTarget =
          salesPersonsList.reduce(
            (sum, person) =>
              sum + (person.salesTarget ?? person.SalesTarget ?? 0),
            0
          ) || 0;
        const totalAchieved = allData.totalSales ?? allData.TotalSales ?? 0;

        setDashboardData({
          salesTarget: totalTarget,
          achievedTarget: totalAchieved,
          range: null,
          totalLeadsCount:
            allData.totalLeadsCount ?? allData.TotalLeadsCount ?? 0,
          wonLeadsCount: allData.totalWonLeads ?? allData.TotalWonLeads ?? 0,
          lostLeadsCount: allData.totalLostLeads ?? allData.TotalLostLeads ?? 0,
          newLeadsCount: allData.newLeadsCount ?? allData.NewLeadsCount ?? 0,
          contactedLeadsCount:
            allData.contactedLeadsCount ?? allData.ContactedLeadsCount ?? 0,
          qualifiedLeadsCount:
            allData.qualifiedLeadsCount ?? allData.QualifiedLeadsCount ?? 0,
          proposalLeadsCount:
            allData.proposalLeadsCount ?? allData.ProposalLeadsCount ?? 0,
          negotiationLeadsCount:
            allData.negotiationLeadsCount ?? allData.NegotiationLeadsCount ?? 0,
          isAllData: true,
          allData: { ...allData, salesPersons: salesPersonsList },
        });
        setIsAllSelected(true);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const formatLocalYmd = useCallback((date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const handleSalesPersonSelect = useCallback(
    (event) => {
      const raw = event.target.value;
      const value = raw === "All" ? "All" : String(raw);

      setSelectedSalesPersonId(value);

      if (value === "All") {
        const from = parseDashboardDateInput(dateRange.from);
        const to = parseDashboardDateInput(dateRange.to);
        if (from && to) {
          setLastFetchedDates({ from: dateRange.from, to: dateRange.to });
          fetchAllSalesPersonsDashboard(from, to);
        } else {
          const today = new Date();
          const fd = new Date(today.getFullYear(), today.getMonth(), 1);
          const tdm = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          const fs = formatLocalYmd(fd);
          const ts = formatLocalYmd(tdm);
          setDateRange({ from: fs, to: ts });
          setLastFetchedDates({ from: fs, to: ts });
          fetchAllSalesPersonsDashboard(fd, tdm);
        }
        return;
      }

      const person = salesPersons.find((p) => String(p.id) === value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let fromDate;
      let toDate;

      if (person?.range === 9) {
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        fromDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + mondayOffset
        );
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(
          fromDate.getFullYear(),
          fromDate.getMonth(),
          fromDate.getDate() + 6
        );
        toDate.setHours(0, 0, 0, 0);
      } else if (person?.range === 7) {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
      } else if (person?.range === 8) {
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = new Date(today.getFullYear(), 11, 31);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
      } else {
        fromDate = new Date(today);
        toDate = new Date(today);
      }

      const fromStr = formatLocalYmd(fromDate);
      const toStr = formatLocalYmd(toDate);
      setDateRange({ from: fromStr, to: toStr });
      setLastFetchedDates({ from: fromStr, to: toStr });

      const cachedPerson = dashboardData?.allData?.salesPersons?.find(
        (p) => String(p.salesPersonId) === value
      );
      if (cachedPerson) {
        setDashboardData((prev) => ({
          ...(prev || {}),
          salesTarget: cachedPerson.salesTarget,
          achievedTarget: cachedPerson.achievedAmount,
          range: cachedPerson.range,
          isAllData: false,
          isFilteredView: true,
          selectedSalesPersonId: value,
          salesPersonName: cachedPerson.name,
          allData: prev?.allData,
        }));
        setIsAllSelected(false);
      }

      fetchDashboardDataBySalesPerson(fromDate, toDate, value);
    },
    [
      dateRange.from,
      dateRange.to,
      salesPersons,
      dashboardData,
      fetchAllSalesPersonsDashboard,
      fetchDashboardDataBySalesPerson,
      formatLocalYmd,
    ]
  );

  useEffect(() => {
    if (!isSalesPerson) {
      fetchSalesPersons();
    }
  }, [isSalesPerson, fetchSalesPersons]);

  const getDateRangeByTimePeriod = (timePeriod) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let fromDate, toDate;

    switch (timePeriod) {
      case 6:
        fromDate = new Date(today);
        toDate = new Date(today);
        break;
      case 7:
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        break;
      case 8:
        fromDate = new Date(today.getFullYear(), 0, 1);
        toDate = new Date(today.getFullYear(), 11, 31);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        break;
      case 9:
        const dayOfWeek = today.getDay();
        let mondayOffset;
        if (dayOfWeek === 0) {
          mondayOffset = -6;
        } else {
          mondayOffset = 1 - dayOfWeek;
        }
        fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);
        fromDate.setHours(0, 0, 0, 0);
        toDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + 6);
        toDate.setHours(0, 0, 0, 0);
        break;
      default:
        fromDate = new Date(today);
        toDate = new Date(today);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
    }

    return { fromDate, toDate };
  };

  const [salesPersonTimePeriod, setSalesPersonTimePeriod] = useState(null);
  
  const currentTimePeriod = userData?.timePeriod ?? salesPersonTimePeriod ?? null;
  
  useEffect(() => {
    if (isSalesPerson && currentTimePeriod !== null && currentTimePeriod !== undefined) {
      const timePeriodLabel = timePeriods.find(p => p.value === currentTimePeriod)?.label || "N/A";
    }
  }, [isSalesPerson, currentTimePeriod]);
  
  useEffect(() => {
    
    if (userData?.salesPersonId && !userData?.timePeriod) {
      const fetchSalesPersonTimePeriod = async () => {
        try {
          const response = await fetch(
            `${BASE_URL}/SalesPerson/GetSalesPersonById?id=${userData.salesPersonId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const timePeriodValue = data.result?.timePeriod ?? data.result?.range ?? null;
            if (timePeriodValue !== undefined && timePeriodValue !== null) {
              setSalesPersonTimePeriod(parseInt(timePeriodValue));
            }
          }
        } catch (error) {
        }
      };
      
      fetchSalesPersonTimePeriod();
    }
  }, [userData?.salesPersonId, userData?.timePeriod]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastFetchedDates, setLastFetchedDates] = useState({ from: "", to: "" });
  const [datesInitialized, setDatesInitialized] = useState(false);
  const [lastTimePeriod, setLastTimePeriod] = useState(null);

  useEffect(() => {
    if (isSalesPerson && userId && !userLoading && userData && currentTimePeriod !== null && currentTimePeriod !== undefined) {
      const userRange = parseInt(currentTimePeriod);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        let fromDate, toDate, fromDateStr, toDateStr;

        if (userRange === 9) {
          const dayOfWeek = today.getDay();
          let mondayOffset;
          if (dayOfWeek === 0) {
            mondayOffset = -6;
          } else {
            mondayOffset = 1 - dayOfWeek;
          }
          fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + 6);
          toDate.setHours(0, 0, 0, 0);
          fromDateStr = formatDate(fromDate);
          toDateStr = formatDate(toDate);
        } else if (userRange === 6) {
          fromDate = new Date(today);
          toDate = new Date(today);
          fromDateStr = formatDate(today);
          toDateStr = formatDate(today);
        } else if (userRange === 7) {
          fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          toDate.setHours(0, 0, 0, 0);
          fromDateStr = formatDate(fromDate);
          toDateStr = formatDate(toDate);
        } else if (userRange === 8) {
          fromDate = new Date(today.getFullYear(), 0, 1);
          fromDate.setHours(0, 0, 0, 0);
          toDate = new Date(today.getFullYear(), 11, 31);
          toDate.setHours(0, 0, 0, 0);
          fromDateStr = formatDate(fromDate);
          toDateStr = formatDate(toDate);
        } else {
          fromDate = new Date(today);
          toDate = new Date(today);
          fromDateStr = formatDate(today);
          toDateStr = formatDate(today);
        }

        setDateRange({ from: fromDateStr, to: toDateStr });
        setLastFetchedDates({ from: fromDateStr, to: toDateStr });
        setDatesInitialized(true);
        setLastTimePeriod(userRange);
        
        fetchDashboardData(fromDate, toDate);
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
    } else if (isSalesPerson && !currentTimePeriod && !userLoading && userData) {
      if (!datesInitialized || (dateRange.from === "" && dateRange.to === "")) {
        const today = new Date();
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const todayStr = formatDate(today);
        setDateRange({ from: todayStr, to: todayStr });
        setDatesInitialized(true);
        fetchDashboardData();
      }
    } else if (!isSalesPerson && selectedSalesPersonId === "All" && isInitialLoad) {
        const today = new Date();
        const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const formatDate = (date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        const fromDateStr = formatDate(fromDate);
        const toDateStr = formatDate(toDate);
        setDateRange({ from: fromDateStr, to: toDateStr });
        setLastFetchedDates({ from: fromDateStr, to: toDateStr });
        fetchAllSalesPersonsDashboard(fromDate, toDate);
        setIsInitialLoad(false);
    }
  }, [userId, isSalesPerson, userData, userLoading, datesInitialized, isInitialLoad, currentTimePeriod, lastTimePeriod, dateRange.from, dateRange.to, fetchDashboardData, fetchAllSalesPersonsDashboard, selectedSalesPersonId]);

  useEffect(() => {
    if (
      selectedSalesPersonId === "All" &&
      dateRange.from &&
      dateRange.to &&
      !isInitialLoad
    ) {
      const datesChanged =
        dateRange.from !== lastFetchedDates.from ||
        dateRange.to !== lastFetchedDates.to;
      if (datesChanged) {
        const fromDate = parseDashboardDateInput(dateRange.from);
        const toDate = parseDashboardDateInput(dateRange.to);
        if (fromDate && toDate && fromDate <= toDate) {
          setLastFetchedDates({ from: dateRange.from, to: dateRange.to });
          fetchAllSalesPersonsDashboard(fromDate, toDate);
        }
      }
    }
  }, [
    dateRange.from,
    dateRange.to,
    selectedSalesPersonId,
    isInitialLoad,
    lastFetchedDates.from,
    lastFetchedDates.to,
    fetchAllSalesPersonsDashboard,
  ]);

  useEffect(() => {
    if (isSalesPerson && userId && dateRange.from && dateRange.to && !isInitialLoad) {
      const datesChanged = dateRange.from !== lastFetchedDates.from || dateRange.to !== lastFetchedDates.to;
      if (datesChanged) {
        const fromDate = parseDashboardDateInput(dateRange.from);
        const toDate = parseDashboardDateInput(dateRange.to);
        if (fromDate && toDate && fromDate <= toDate) {
          setLastFetchedDates({ from: dateRange.from, to: dateRange.to });
          fetchDashboardData(fromDate, toDate);
        }
      }
    }
  }, [
    dateRange.from,
    dateRange.to,
    isSalesPerson,
    userId,
    isInitialLoad,
    lastFetchedDates.from,
    lastFetchedDates.to,
    fetchDashboardData,
  ]);

  useEffect(() => {
    if (
      selectedSalesPersonId &&
      selectedSalesPersonId !== "All" &&
      dateRange.from &&
      dateRange.to &&
      !isInitialLoad
    ) {
      const datesChanged =
        dateRange.from !== lastFetchedDates.from ||
        dateRange.to !== lastFetchedDates.to;
      if (datesChanged) {
        const fromDate = parseDashboardDateInput(dateRange.from);
        const toDate = parseDashboardDateInput(dateRange.to);
        if (fromDate && toDate && fromDate <= toDate) {
          setLastFetchedDates({ from: dateRange.from, to: dateRange.to });
          fetchDashboardDataBySalesPerson(
            fromDate,
            toDate,
            selectedSalesPersonId
          );
        }
      }
    }
  }, [
    dateRange.from,
    dateRange.to,
    selectedSalesPersonId,
    isInitialLoad,
    lastFetchedDates.from,
    lastFetchedDates.to,
    fetchDashboardDataBySalesPerson,
  ]);

  const calculatePercentage = (achieved, target) => {
    if (!target || target === 0) return 0;
    return Math.round((achieved / target) * 100);
  };

  const getSalesPersonPerformanceRows = () => {
    if (isSalesPerson) {
      return [];
    }

    if (selectedSalesPersonId === "All") {
      return dashboardData?.allData?.salesPersons || [];
    }

    if (dashboardData?.allData?.salesPersons?.length) {
      const fromAll = dashboardData.allData.salesPersons.filter(
        (p) => String(p.salesPersonId) === String(selectedSalesPersonId)
      );
      if (fromAll.length > 0) {
        return fromAll;
      }
    }

    if (!dashboardData || selectedSalesPersonId === "All") {
      return [];
    }

    const personMeta = salesPersons.find(
      (p) => String(p.id) === String(selectedSalesPersonId)
    );
    const target = Number(dashboardData.salesTarget) || 0;
    const achieved = Number(dashboardData.achievedTarget) || 0;
    const remaining = Math.max(0, target - achieved);
    let performancePercentage = 0;
    if (target > 0) {
      performancePercentage = (achieved / target) * 100;
      if (performancePercentage > 100) {
        performancePercentage = 100;
      }
    }

    return [
      {
        salesPersonId: Number(selectedSalesPersonId),
        name:
          dashboardData.salesPersonName ||
          personMeta?.name ||
          "—",
        salesTarget: target,
        achievedAmount: achieved,
        remainingAmount: remaining,
        performancePercentage: Math.round(performancePercentage * 10) / 10,
        range: dashboardData.range,
      },
    ];
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return "success";
    if (percentage >= 75) return "info";
    if (percentage >= 50) return "warning";
    return "error";
  };

  if (userLoading || loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!isSalesPerson && !selectedSalesPersonId) {
    return (
      <>
        <Grid container spacing={3} sx={{ p: 3 }}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              CRM Dashboard
            </Typography>
            <FormControl fullWidth sx={{ mt: 2, maxWidth: 400 }} size="small">
              <InputLabel id="sales-person-select-label">Select Sales Person</InputLabel>
              <Select
                labelId="sales-person-select-label"
                id="sales-person-select"
                value={selectedSalesPersonId}
                label="Select Sales Person"
                onChange={handleSalesPersonSelect}
                size="small"
              >
                <MenuItem value="All">All</MenuItem>
                {salesPersons.map((person) => (
                  <MenuItem key={person.id} value={String(person.id)}>
                    {person.name} ({person.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </>
    );
  }

  if (!dashboardData || loading) {
    return (
      <>
        <Box sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            {loading ? "Loading..." : "No data available"}
          </Typography>
        </Box>
      </>
    );
  }

  const achievementPercentage = calculatePercentage(
    dashboardData.achievedTarget || 0,
    dashboardData.salesTarget || 0
  );

  const salesPersonPerformanceRows = getSalesPersonPerformanceRows();
  const isAllSalesPersonsView = selectedSalesPersonId === "All";

  const leadsOverviewStatusSum =
    (Number(dashboardData.wonLeadsCount) || 0) +
    (Number(dashboardData.lostLeadsCount) || 0) +
    (Number(dashboardData.newLeadsCount) || 0) +
    (Number(dashboardData.contactedLeadsCount) || 0) +
    (Number(dashboardData.qualifiedLeadsCount) || 0) +
    (Number(dashboardData.proposalLeadsCount) || 0) +
    (Number(dashboardData.negotiationLeadsCount) || 0);
  const leadsOverviewHasChartData =
    (Number(dashboardData.totalLeadsCount) || 0) > 0 || leadsOverviewStatusSum > 0;

  return (
    <>
      <Grid container spacing={3} sx={{ p: 3 }}>
        <Grid item xs={12}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6">
                {isSalesPerson ? "My Target Achievement" : "CRM Dashboard"}
              </Typography>
                  {isSalesPerson ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    {userData?.firstName} {userData?.lastName}
                  </Typography>
                  {currentTimePeriod && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Time Period: {timePeriods.find(p => p.value === currentTimePeriod)?.label || "N/A"}
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  <FormControl fullWidth sx={{ mt: 2, maxWidth: 400 }} size="small">
                    <InputLabel id="sales-person-select-label">Select Sales Person</InputLabel>
                    <Select
                      labelId="sales-person-select-label"
                      id="sales-person-select"
                      value={selectedSalesPersonId}
                      label="Select Sales Person"
                      onChange={handleSalesPersonSelect}
                      size="small"
                    >
                      <MenuItem value="All">All</MenuItem>
                      {salesPersons.map((person) => (
                        <MenuItem key={person.id} value={String(person.id)}>
                          {person.name} ({person.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedSalesPersonId && selectedSalesPersonId !== "All" && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {salesPersons.find(p => String(p.id) === String(selectedSalesPersonId))?.name || ""}
                    </Typography>
                  )}
                  {selectedSalesPersonId && selectedSalesPersonId !== "All" && dashboardData?.range && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Time Period: {timePeriods.find(p => p.value === dashboardData.range)?.label || "N/A"}
                    </Typography>
                  )}
                  {selectedSalesPersonId === "All" && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      All Sales Persons
                    </Typography>
                  )}
                </>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {dashboardData?.isAllData ? (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="From Date"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="To Date"
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </>
                ) : isSalesPerson && currentTimePeriod ? (
                  currentTimePeriod === 6 ? (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Date"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          setDateRange({ from: selectedDate, to: selectedDate });
                        }}
                        disabled
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  ) : currentTimePeriod === 9 ? (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="From Date (Monday)"
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const selectedDate = new Date(e.target.value);
                            selectedDate.setHours(0, 0, 0, 0);
                            const dayOfWeek = selectedDate.getDay();
                            if (dayOfWeek === 1) {
                              const sunday = new Date(selectedDate);
                              sunday.setDate(selectedDate.getDate() + 6);
                              sunday.setHours(0, 0, 0, 0);
                              const formatDate = (date) => {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                              };
                              setDateRange({ from: formatDate(selectedDate), to: formatDate(sunday) });
                            } else {
                              toast.error("Please select a Monday");
                              const currentMonday = parseDashboardDateInput(dateRange.from);
                              if (currentMonday && !isNaN(currentMonday.getTime())) {
                                const currentSunday = new Date(currentMonday);
                                currentSunday.setDate(currentMonday.getDate() + 6);
                                const formatDate = (date) => {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                setDateRange({ from: formatDate(currentMonday), to: formatDate(currentSunday) });
                              }
                            }
                          }}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                          helperText="Select a Monday only"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="To Date (Sunday)"
                          type="date"
                          value={dateRange.to}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                          helperText="Automatically set to Sunday"
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="From Date"
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="To Date"
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                    </>
                  )
                ) : isSalesPerson && !currentTimePeriod ? (
                  <>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="From Date"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                        disabled
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="To Date"
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                        disabled
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </>
                ) : !isSalesPerson && dashboardData?.range ? (
                  dashboardData.range === 6 ? (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Date"
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          setDateRange({ from: selectedDate, to: selectedDate });
                        }}
                        disabled
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  ) : dashboardData.range === 9 ? (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="From Date (Monday)"
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const selectedDate = new Date(e.target.value);
                            selectedDate.setHours(0, 0, 0, 0);
                            const dayOfWeek = selectedDate.getDay();
                            if (dayOfWeek === 1) {
                              const sunday = new Date(selectedDate);
                              sunday.setDate(selectedDate.getDate() + 6);
                              sunday.setHours(0, 0, 0, 0);
                              const formatDate = (date) => {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                              };
                              setDateRange({ from: formatDate(selectedDate), to: formatDate(sunday) });
                            } else {
                              toast.error("Please select a Monday");
                              const currentMonday = parseDashboardDateInput(dateRange.from);
                              if (currentMonday && !isNaN(currentMonday.getTime())) {
                                const currentSunday = new Date(currentMonday);
                                currentSunday.setDate(currentMonday.getDate() + 6);
                                const formatDate = (date) => {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                };
                                setDateRange({ from: formatDate(currentMonday), to: formatDate(currentSunday) });
                              }
                            }
                          }}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                          helperText="Select a Monday only"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="To Date (Sunday)"
                          type="date"
                          value={dateRange.to}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                          helperText="Automatically set to Sunday"
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="From Date"
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          size="small"
                          label="To Date"
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          disabled
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                    </>
                  )
                ) : null}
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              boxShadow: "0 8px 16px rgba(102, 126, 234, 0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px rgba(102, 126, 234, 0.4)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                  Sales Target
                </Typography>
                <TrendingUpIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "white",
                  mb: 1,
                  fontSize: { xs: "2rem", md: "2.5rem" },
                }}
              >
                {formatCurrency(dashboardData.salesTarget || 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                {isAllSalesPersonsView
                  ? "Total Target"
                  : `${timePeriods.find((p) => p.value === dashboardData.range)?.label || "N/A"} Target`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
              color: "white",
              boxShadow: "0 8px 16px rgba(17, 153, 142, 0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px rgba(17, 153, 142, 0.4)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                  Achieved Target
                </Typography>
                <CheckCircleIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "white",
                  mb: 1,
                  fontSize: { xs: "2rem", md: "2.5rem" },
                }}
              >
                {formatCurrency(dashboardData.achievedTarget || 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.9rem" }}>
                Current Achievement
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: "100%",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              boxShadow: "0 8px 16px rgba(245, 87, 108, 0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 24px rgba(245, 87, 108, 0.4)",
              },
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                  Achievement %
                </Typography>
                <PercentIcon sx={{ fontSize: 32, opacity: 0.8 }} />
              </Box>
              <Box sx={{ mt: 2, mb: 3 }}>
                <Box
                  sx={{
                    width: "100%",
                    height: 12,
                    backgroundColor: "rgba(255, 255, 255, 0.3)",
                    borderRadius: 6,
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.min(achievementPercentage, 100)}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)",
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </Box>
              </Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  color: "white",
                  fontSize: { xs: "2rem", md: "2.5rem" },
                }}
              >
                {achievementPercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Leads Overview
              </Typography>
              {dashboardData && !leadsOverviewHasChartData ? (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 350, px: 2 }}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    No leads in the selected date range
                    {isAllSalesPersonsView
                      ? " (active CRM leads created between From and To dates)."
                      : "."}
                  </Typography>
                </Box>
              ) : (
                <Chart
                  options={{
                    chart: {
                      type: "bar",
                      toolbar: {
                        show: false,
                      },
                    },
                    plotOptions: {
                      bar: {
                        horizontal: false,
                        columnWidth: "55%",
                        endingShape: "rounded",
                        borderRadius: 4,
                      },
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    stroke: {
                      show: true,
                      width: 2,
                      colors: ["transparent"],
                    },
                    colors: ["#2DB6F5", "#EE368C", "#FFA726", "#66BB6A", "#AB47BC", "#EF5350", "#29B6F6"],
                    xaxis: {
                      categories: [
                        "Won Leads",
                        "Lost Leads",
                        "New Leads",
                        "Contacted",
                        "Qualified",
                        "Proposal",
                        "Negotiation",
                      ],
                      labels: {
                        style: {
                          colors: "#666",
                          fontSize: "12px",
                        },
                        rotate: -45,
                        rotateAlways: false,
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: "#666",
                          fontSize: "12px",
                        },
                      },
                      forceNiceScale: false,
                      min: 0,
                      tickAmount: 5,
                    },
                    fill: {
                      opacity: 1,
                    },
                    tooltip: {
                      y: {
                        formatter: function (val) {
                          return val + " leads";
                        },
                      },
                    },
                    grid: {
                      show: true,
                      borderColor: "#f0f0f0",
                      strokeDashArray: 3,
                    },
                    legend: {
                      show: false,
                    },
                  }}
                  series={[
                    {
                      name: "Leads Count",
                      data: [
                        Number(dashboardData?.wonLeadsCount) || 0,
                        Number(dashboardData?.lostLeadsCount) || 0,
                        Number(dashboardData?.newLeadsCount) || 0,
                        Number(dashboardData?.contactedLeadsCount) || 0,
                        Number(dashboardData?.qualifiedLeadsCount) || 0,
                        Number(dashboardData?.proposalLeadsCount) || 0,
                        Number(dashboardData?.negotiationLeadsCount) || 0,
                      ].map(val => isNaN(val) ? 0 : val),
                    },
                  ]}
                  type="bar"
                  height={350}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Performance Chart
              </Typography>
              {dashboardData && (
              <Chart
                options={{
                  chart: {
                    type: "bar",
                    toolbar: {
                      show: false,
                    },
                  },
                  plotOptions: {
                    bar: {
                      horizontal: false,
                      columnWidth: "60%",
                      endingShape: "rounded",
                      borderRadius: 4,
                      dataLabels: {
                        position: "top",
                      },
                    },
                  },
                  dataLabels: {
                    enabled: true,
                    formatter: function (val) {
                      return formatCurrency(val);
                    },
                    style: {
                      fontSize: "12px",
                      fontWeight: 600,
                      colors: ["#fff"],
                    },
                    offsetY: 0,
                  },
                  stroke: {
                    show: true,
                    width: 2,
                    colors: ["transparent"],
                  },
                  colors: ["#757FEF", "#2DB6F5", "#EE368C"],
                  xaxis: {
                    categories: ["Target", "Achieved", "Remaining"],
                    labels: {
                      style: {
                        colors: "#666",
                        fontSize: "14px",
                        fontWeight: 600,
                      },
                    },
                  },
                  yaxis: {
                    labels: {
                      style: {
                        colors: "#666",
                        fontSize: "12px",
                      },
                      formatter: function (val) {
                        return formatCurrency(val);
                      },
                    },
                  },
                  fill: {
                    opacity: 1,
                  },
                  tooltip: {
                    y: {
                      formatter: function (val) {
                        return formatCurrency(val);
                      },
                    },
                  },
                  grid: {
                    show: true,
                    borderColor: "#f0f0f0",
                    strokeDashArray: 3,
                  },
                  legend: {
                    show: false,
                  },
                }}
                series={[
                  {
                    name: "Amount",
                    data: [
                      Number(dashboardData?.salesTarget) || 0,
                      Number(dashboardData?.achievedTarget) || 0,
                      Math.max(0, (Number(dashboardData?.salesTarget) || 0) - (Number(dashboardData?.achievedTarget) || 0)),
                    ].map(val => isNaN(val) ? 0 : val),
                  },
                ]}
                type="bar"
                height={350}
              />
              )}
            </CardContent>
          </Card>
        </Grid>

        {!isSalesPerson && salesPersonPerformanceRows.length > 0 && (
          <Grid item xs={12}>
            <Card
              sx={{
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3, pb: 2, borderBottom: "2px solid #f0f0f0" }}>
                  <Typography variant="h6" fontWeight={600}>
                    Sales Persons Performance
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {isAllSalesPersonsView
                      ? "Overview of all sales persons performance metrics"
                      : `Performance metrics for ${
                          salesPersonPerformanceRows[0]?.name || "selected sales person"
                        }`}
                  </Typography>
                </Box>
                <TableContainer
                  sx={{
                    maxWidth: "100%",
                    overflowX: "auto",
                    "& .MuiTable-root": {
                      minWidth: 700,
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: "#f8f9fa",
                          "& .MuiTableCell-head": {
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "#495057",
                            borderBottom: "2px solid #dee2e6",
                            py: 1.5,
                          },
                        }}
                      >
                        <TableCell sx={{ whiteSpace: "nowrap" }}>Sales Person</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>Target</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>Achieved</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>Remaining</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", minWidth: 160 }}>Performance</TableCell>
                        <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>Period</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salesPersonPerformanceRows.map((person) => {
                        const performance = person.performancePercentage || 0;
                        const isComplete = performance >= 100;
                        const isOnTrack = performance >= 50;
                        
                        return (
                          <TableRow
                            key={person.salesPersonId}
                            hover
                            sx={{
                              "&:nth-of-type(even)": {
                                backgroundColor: "#fafafa",
                              },
                              "&:hover": {
                                backgroundColor: "#f5f5f5",
                              },
                              "& .MuiTableCell-root": {
                                py: 2,
                                borderBottom: "1px solid #f0f0f0",
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {person.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" color="text.primary">
                                {formatCurrency(person.salesTarget || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight={600} color="text.primary">
                                {formatCurrency(person.achievedAmount || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" color="text.secondary">
                                {formatCurrency(person.remainingAmount || 0)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2, minWidth: 160 }}>
                                <Box sx={{ width: 100, flexShrink: 0 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={Math.min(performance, 100)}
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      backgroundColor: "#e9ecef",
                                      "& .MuiLinearProgress-bar": {
                                        borderRadius: 4,
                                        backgroundColor: isComplete ? "#28a745" : isOnTrack ? "#007bff" : "#dc3545",
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="body1"
                                  fontWeight={600}
                                  sx={{
                                    minWidth: 50,
                                    textAlign: "right",
                                    color: isComplete ? "#28a745" : isOnTrack ? "#007bff" : "#dc3545",
                                  }}
                                >
                                  {performance.toFixed(1)}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={timePeriods.find(p => p.value === person.range)?.label || "N/A"}
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: "#dee2e6",
                                  color: "text.primary",
                                  fontWeight: 500,
                                  backgroundColor: "#ffffff",
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

      </Grid>
    </>
  );
}

