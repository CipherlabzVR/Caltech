import React, { useEffect, useState, useCallback, useMemo } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import AddButton from "@/components/HR/AddButton";
import ActionButtons from "@/components/HR/ActionButtons";
import ConfirmDialog from "@/components/HR/ConfirmDialog";
import ModernTable from "@/components/HR/ModernTable";
import FormDialog from "@/components/HR/FormDialog";
import FormField from "@/components/HR/FormField";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import {
  createAuthHeaders,
  getOrgId,
  parsePagedResponse,
  parseObjectResponse,
  formatDate,
} from "@/components/utils/apiHelpers";
import { getCurrentLocation, getDeviceType, getDeviceIdentifier } from "@/components/utils/locationHelper";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DashboardIcon from "@mui/icons-material/Dashboard";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import WarningIcon from "@mui/icons-material/Warning";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CancelIcon from "@mui/icons-material/Cancel";

const ShiftAttendance = () => {
  const categoryId = 128;
  const moduleId = 6;

  useEffect(() => {
    sessionStorage.setItem("moduleid", moduleId);
    sessionStorage.setItem("category", categoryId);
    
    if (!sessionStorage.getItem("orgId")) {
      const orgIdFromLocal = localStorage.getItem("orgId");
      if (orgIdFromLocal) {
        sessionStorage.setItem("orgId", orgIdFromLocal);
      }
    }
  }, [moduleId, categoryId]);

  const { navigate } = IsPermissionEnabled(categoryId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [clockIns, setClockIns] = useState([]);
  const [clockOuts, setClockOuts] = useState([]);
  const [dailyWorkHours, setDailyWorkHours] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Clock In/Out Forms
  const [clockInFormOpen, setClockInFormOpen] = useState(false);
  const [clockOutFormOpen, setClockOutFormOpen] = useState(false);
  const [clockInFormData, setClockInFormData] = useState({
    employeeProfileId: "",
    clockInDate: new Date().toISOString().split("T")[0],
    clockInTime: new Date().toTimeString().slice(0, 5),
    location: "",
    address: "",
    latitude: null,
    longitude: null,
    notes: "",
  });
  const [clockOutFormData, setClockOutFormData] = useState({
    employeeProfileId: "",
    clockInId: "",
    clockOutDate: new Date().toISOString().split("T")[0],
    clockOutTime: new Date().toTimeString().slice(0, 5),
    location: "",
    address: "",
    latitude: null,
    longitude: null,
    notes: "",
  });
  const [clockInFormErrors, setClockInFormErrors] = useState({});
  const [clockOutFormErrors, setClockOutFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const [availableClockIns, setAvailableClockIns] = useState([]);
  const [hasOpenClockIn, setHasOpenClockIn] = useState(false);
  const [selectedEmployeeForAction, setSelectedEmployeeForAction] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  
  // Attendance Grid state
  const [attendanceGridData, setAttendanceGridData] = useState([]);
  const [attendanceGridDateRange, setAttendanceGridDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
  });
  const [attendanceGridLoading, setAttendanceGridLoading] = useState(false);
  
  // Manual Adjustment state
  const [manualAdjustmentDialogOpen, setManualAdjustmentDialogOpen] = useState(false);
  const [manualAdjustmentFormData, setManualAdjustmentFormData] = useState({
    employeeProfileId: "",
    workDate: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "Present",
    source: "Manual",
    location: "",
    remarks: "",
  });
  
  // Shift Planner state
  const [shifts, setShifts] = useState([]);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
    breakDuration: 60,
    gracePeriod: 15,
  });
  
  // Late/Absence Dashboard state
  const [lateAbsenceStats, setLateAbsenceStats] = useState({
    totalLates: 0,
    totalAbsences: 0,
    totalHalfDays: 0,
    noPayDays: 0,
  });
  
  // OT/Leave Requests state
  const [otLeaveRequests, setOtLeaveRequests] = useState([]);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestFormData, setRequestFormData] = useState({
    employeeProfileId: "",
    requestType: "OT",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    reason: "",
  });
  
  // Edit/Delete states
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(""); // "attendance", "shift", "request"

  // Load employees from employee lifecycle
  const loadEmployees = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/hr/employees?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=1000`,
        { headers }
      );

      if (response.ok) {
        const data = parsePagedResponse(await response.json());
        setEmployees(data.items || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  }, []);

  // Load clock-ins
  const loadClockIns = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const skip = (page - 1) * pageSize;
      
      let query = `${BASE_URL}/hr/clock-in-out/clock-ins?OrgId=${orgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
      
      if (employeeFilter) {
        query += `&EmployeeProfileId=${employeeFilter}`;
      }
      
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        query += `&FromDate=${filterDate.toISOString()}&ToDate=${filterDate.toISOString()}`;
      }

      const response = await fetch(query, { headers });
      if (response.ok) {
        const data = parsePagedResponse(await response.json());
        setClockIns(data.items || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (error) {
      console.error("Error loading clock-ins:", error);
    }
  }, [page, pageSize, employeeFilter, dateFilter]);

  // Load clock-outs
  const loadClockOuts = useCallback(async () => {
    try {
        const orgId = getOrgId();
        const headers = createAuthHeaders();
        const skip = (page - 1) * pageSize;

      let query = `${BASE_URL}/hr/clock-in-out/clock-outs?OrgId=${orgId || 0}&SkipCount=${skip}&MaxResultCount=${pageSize}`;
      
      if (employeeFilter) {
        query += `&EmployeeProfileId=${employeeFilter}`;
      }
      
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        query += `&FromDate=${filterDate.toISOString()}&ToDate=${filterDate.toISOString()}`;
      }

      const response = await fetch(query, { headers });
      if (response.ok) {
        const data = parsePagedResponse(await response.json());
        setClockOuts(data.items || []);
      }
    } catch (error) {
      console.error("Error loading clock-outs:", error);
    }
  }, [page, pageSize, employeeFilter, dateFilter]);

  // Load daily attendance grid data
  const loadDailyAttendanceGrid = useCallback(async () => {
    try {
      setAttendanceGridLoading(true);
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      // Fetch all employees
      const employeesResponse = await fetch(
        `${BASE_URL}/hr/employees?OrgId=${orgId || 0}&SkipCount=0&MaxResultCount=1000`,
        { headers }
      );
      
      if (!employeesResponse.ok) {
        throw new Error("Failed to load employees");
      }
      
      const employeesData = parsePagedResponse(await employeesResponse.json());
      const allEmployees = employeesData.items || [];
      
      // For each employee, get their clock-in/out data for the date range
      const attendanceData = await Promise.all(
        allEmployees.map(async (emp) => {
          const empId = emp.id || emp.Id || emp.internalId || emp.InternalId;
          const firstName = emp.firstName || emp.FirstName || "";
          const lastName = emp.lastName || emp.LastName || "";
          const employeeName = `${firstName} ${lastName}`.trim() || `Employee ${empId}`;
          
          // Get clock-ins for date range
          const clockInsResponse = await fetch(
            `${BASE_URL}/hr/clock-in-out/clock-ins?OrgId=${orgId || 0}&EmployeeProfileId=${empId}&FromDate=${attendanceGridDateRange.from}&ToDate=${attendanceGridDateRange.to}&SkipCount=0&MaxResultCount=1000`,
            { headers }
          );
          
          // Get clock-outs for date range
          const clockOutsResponse = await fetch(
            `${BASE_URL}/hr/clock-in-out/clock-outs?OrgId=${orgId || 0}&EmployeeProfileId=${empId}&FromDate=${attendanceGridDateRange.from}&ToDate=${attendanceGridDateRange.to}&SkipCount=0&MaxResultCount=1000`,
            { headers }
          );
          
          let clockIns = [];
          let clockOuts = [];
          
          if (clockInsResponse.ok) {
            const clockInsData = parsePagedResponse(await clockInsResponse.json());
            clockIns = clockInsData.items || [];
          }
          
          if (clockOutsResponse.ok) {
            const clockOutsData = parsePagedResponse(await clockOutsResponse.json());
            clockOuts = clockOutsData.items || [];
          }
          
          // Group by date
          const dateMap = {};
          
          // Process clock-ins
          clockIns.forEach(ci => {
            const date = ci.clockInDate || ci.ClockInDate;
            if (date) {
              const dateStr = new Date(date).toISOString().split("T")[0];
              if (!dateMap[dateStr]) {
                dateMap[dateStr] = {
                  employeeId: empId,
                  employeeName: employeeName,
                  date: dateStr,
                  clockIns: [],
                  clockOuts: [],
                  status: "Absent", // Default to Absent
                };
              }
              const clockInTime = ci.clockInTime || ci.ClockInTime;
              const clockInDateTime = ci.clockInDateTime || ci.ClockInDateTime;
              dateMap[dateStr].clockIns.push({
                time: clockInTime,
                dateTime: clockInDateTime,
                location: ci.location || ci.Location || "",
              });
            }
          });
          
          // Process clock-outs
          clockOuts.forEach(co => {
            const date = co.clockOutDate || co.ClockOutDate;
            if (date) {
              const dateStr = new Date(date).toISOString().split("T")[0];
              if (!dateMap[dateStr]) {
                dateMap[dateStr] = {
                  employeeId: empId,
                  employeeName: employeeName,
                  date: dateStr,
                  clockIns: [],
                  clockOuts: [],
                  status: "Absent",
                };
              }
              const clockOutTime = co.clockOutTime || co.ClockOutTime;
              const clockOutDateTime = co.clockOutDateTime || co.ClockOutDateTime;
              dateMap[dateStr].clockOuts.push({
                time: clockOutTime,
                dateTime: clockOutDateTime,
                location: co.location || co.Location || "",
              });
            }
          });
          
          // Convert dateMap to array and calculate status
          return Object.values(dateMap).map(dayData => {
            // Sort clock-ins by time (first clock-in)
            dayData.clockIns.sort((a, b) => {
              const aTime = a.dateTime ? new Date(a.dateTime) : (a.time ? new Date(`2000-01-01T${a.time}`) : new Date(0));
              const bTime = b.dateTime ? new Date(b.dateTime) : (b.time ? new Date(`2000-01-01T${b.time}`) : new Date(0));
              return aTime - bTime;
            });
            
            // Sort clock-outs by time (last clock-out)
            dayData.clockOuts.sort((a, b) => {
              const aTime = a.dateTime ? new Date(a.dateTime) : (a.time ? new Date(`2000-01-01T${a.time}`) : new Date(0));
              const bTime = b.dateTime ? new Date(b.dateTime) : (b.time ? new Date(`2000-01-01T${b.time}`) : new Date(0));
              return bTime - aTime;
            });
            
            const firstClockIn = dayData.clockIns[0];
            const lastClockOut = dayData.clockOuts[0];
            
            // If first clock-in exists, status is Present
            const status = firstClockIn ? "Present" : "Absent";
            
            // Calculate working hours
            let workingHours = 0;
            if (firstClockIn && lastClockOut) {
              const checkIn = firstClockIn.dateTime ? new Date(firstClockIn.dateTime) : 
                             (firstClockIn.time ? new Date(`${dayData.date}T${firstClockIn.time}`) : null);
              const checkOut = lastClockOut.dateTime ? new Date(lastClockOut.dateTime) : 
                              (lastClockOut.time ? new Date(`${dayData.date}T${lastClockOut.time}`) : null);
              
              if (checkIn && checkOut) {
                workingHours = (checkOut - checkIn) / (1000 * 60 * 60); // Convert to hours
              }
            }
            
            return {
              id: `${empId}-${dayData.date}`,
              employeeId: empId,
              employeeName: employeeName,
              date: dayData.date,
              checkIn: firstClockIn ? (firstClockIn.dateTime || `${dayData.date}T${firstClockIn.time}`) : null,
              checkOut: lastClockOut ? (lastClockOut.dateTime || `${dayData.date}T${lastClockOut.time}`) : null,
              status: status,
              workingHours: workingHours,
              source: firstClockIn ? (firstClockIn.location ? "GPS" : "Manual") : "Manual",
            };
          });
        })
      );
      
      // Flatten the array
      const flattenedData = attendanceData.flat();
      
      // Sort by date and employee name
      flattenedData.sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.employeeName.localeCompare(b.employeeName);
      });
      
      setAttendanceGridData(flattenedData);
    } catch (error) {
      console.error("Error loading daily attendance grid:", error);
      toast.error("Failed to load attendance grid");
    } finally {
      setAttendanceGridLoading(false);
    }
  }, [attendanceGridDateRange]);

  // Load manual adjustments
  const loadManualAdjustments = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      // Fetch manual attendance adjustments (source = "Manual")
      const response = await fetch(
        `${BASE_URL}/hr/attendance/records?OrgId=${orgId || 0}&Source=Manual&SkipCount=0&MaxResultCount=1000`,
        { headers }
      );
      
      if (response.ok) {
        const data = parsePagedResponse(await response.json());
        const adjustments = (data.items || []).map(item => {
          const empId = item.employeeProfileId || item.EmployeeProfileId;
          const emp = employees.find(e => (e.id || e.Id || e.internalId || e.InternalId) == empId);
          const firstName = emp?.firstName || emp?.FirstName || "";
          const lastName = emp?.lastName || emp?.LastName || "";
          const employeeName = `${firstName} ${lastName}`.trim() || `Employee ${empId}`;
          
          return {
            id: item.id || item.Id || item.internalId || item.InternalId,
            employeeId: empId,
            employeeName: employeeName,
            workDate: item.workDate || item.WorkDate,
            checkIn: item.checkIn || item.CheckIn,
            checkOut: item.checkOut || item.CheckOut,
            status: item.status || item.Status || "Present",
            source: item.source || item.Source || "Manual",
            location: item.geoLocation || item.GeoLocation || "",
            remarks: item.remarks || item.Remarks || "",
          };
        });
        setManualAdjustmentData(adjustments);
      }
    } catch (error) {
      console.error("Error loading manual adjustments:", error);
    }
  }, [employees]);

  // Load daily work hours
  const loadDailyWorkHours = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      let fromDate, toDate;
      if (dateFilter) {
        const filterDate = new Date(dateFilter);
        fromDate = new Date(filterDate);
        toDate = new Date(filterDate);
      } else {
        // Default to current month
        const today = new Date();
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      
      let query = `${BASE_URL}/hr/clock-in-out/daily-work-hours?OrgId=${orgId || 0}`;
      
      if (employeeFilter) {
        query += `&EmployeeProfileId=${employeeFilter}`;
      }
      
      query += `&FromDate=${fromDate.toISOString()}&ToDate=${toDate.toISOString()}`;

      const response = await fetch(query, { headers });
      if (response.ok) {
        const data = parsePagedResponse(await response.json());
        setDailyWorkHours(data.items || []);
      }
    } catch (error) {
      console.error("Error loading daily work hours:", error);
    }
  }, [employeeFilter, dateFilter]);

  // Check all employees for open clock-ins (used when no employee filter is selected)
  const checkAllEmployeesForOpenClockIn = useCallback(async () => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      const today = new Date().toISOString().split("T")[0];
      
      // Get all clock-ins for today
      const clockInsResponse = await fetch(
        `${BASE_URL}/hr/clock-in-out/clock-ins?OrgId=${orgId || 0}&FromDate=${today}&ToDate=${today}&SkipCount=0&MaxResultCount=1000`,
        { headers }
      );
      
      if (clockInsResponse.ok) {
        const clockInsData = parsePagedResponse(await clockInsResponse.json());
        const allClockIns = clockInsData.items || [];
        
        // Get all clock-outs for today
        const clockOutsResponse = await fetch(
          `${BASE_URL}/hr/clock-in-out/clock-outs?OrgId=${orgId || 0}&FromDate=${today}&ToDate=${today}&SkipCount=0&MaxResultCount=1000`,
          { headers }
        );
        
        if (clockOutsResponse.ok) {
          const clockOutsData = parsePagedResponse(await clockOutsResponse.json());
          const clockOutClockInIds = new Set((clockOutsData.items || []).map(co => co.clockInId || co.ClockInId));
          
          // Filter clock-ins that don't have clock-outs
          const openClockIns = allClockIns.filter(ci => {
            const ciId = ci.id || ci.Id || ci.internalId || ci.InternalId;
            return !clockOutClockInIds.has(ciId);
          });
          
          // If there are any open clock-ins, show Clock Out button
          setHasOpenClockIn(openClockIns.length > 0);
          
          // If there's an open clock-in, set the employee and clock-in ID for the form
          if (openClockIns.length > 0) {
            const firstOpenClockIn = openClockIns[0];
            const empId = firstOpenClockIn.employeeProfileId || firstOpenClockIn.EmployeeProfileId;
            const clockInId = firstOpenClockIn.id || firstOpenClockIn.Id || firstOpenClockIn.internalId || firstOpenClockIn.InternalId;
            
            setSelectedEmployeeForAction(String(empId));
            setClockOutFormData(prev => ({
              ...prev,
              employeeProfileId: String(empId),
              clockInId: String(clockInId),
            }));
          } else {
            setHasOpenClockIn(false);
            setSelectedEmployeeForAction("");
          }
        }
      }
    } catch (error) {
      console.error("Error checking all employees for open clock-ins:", error);
      setHasOpenClockIn(false);
    }
  }, []);

  // Load available clock-ins for clock-out (clock-ins without clock-out)
  const loadAvailableClockIns = useCallback(async (employeeProfileId) => {
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      const response = await fetch(
        `${BASE_URL}/hr/clock-in-out/clock-ins?OrgId=${orgId || 0}&EmployeeProfileId=${employeeProfileId}&SkipCount=0&MaxResultCount=100`,
        { headers }
      );
      
      if (response.ok) {
        const data = parsePagedResponse(await response.json());
        const allClockIns = data.items || [];
        
        // Get clock-outs to find which clock-ins don't have clock-outs
        const clockOutsResponse = await fetch(
          `${BASE_URL}/hr/clock-in-out/clock-outs?OrgId=${orgId || 0}&EmployeeProfileId=${employeeProfileId}&SkipCount=0&MaxResultCount=1000`,
          { headers }
        );
        
        if (clockOutsResponse.ok) {
          const clockOutsData = parsePagedResponse(await clockOutsResponse.json());
          const clockOutClockInIds = new Set((clockOutsData.items || []).map(co => co.clockInId || co.ClockInId));
          
          // Filter clock-ins that don't have clock-outs
          const available = allClockIns.filter(ci => {
            const ciId = ci.id || ci.Id || ci.internalId || ci.InternalId;
            return !clockOutClockInIds.has(ciId);
          });
          
          setAvailableClockIns(available);
          
          // Update hasOpenClockIn state - check if there's an open clock-in for today
          const today = new Date().toISOString().split("T")[0];
          const todayClockIns = available.filter(ci => {
            const ciDate = ci.clockInDate || ci.ClockInDate;
            return ciDate && ciDate.split("T")[0] === today;
          });
          
          setHasOpenClockIn(todayClockIns.length > 0);
          if (todayClockIns.length > 0 && todayClockIns[0]) {
            const firstOpenClockIn = todayClockIns[0];
            const clockInId = firstOpenClockIn.id || firstOpenClockIn.Id || firstOpenClockIn.internalId || firstOpenClockIn.InternalId;
            setClockOutFormData(prev => ({
              ...prev,
              employeeProfileId: String(employeeProfileId),
              clockInId: String(clockInId),
            }));
          } else {
            setHasOpenClockIn(false);
          }
        }
      }
    } catch (error) {
      console.error("Error loading available clock-ins:", error);
      setHasOpenClockIn(false);
    }
  }, []);

  // Check for open clock-ins for the selected employee
  const checkOpenClockIn = useCallback(async (employeeProfileId) => {
    if (!employeeProfileId) {
      // If no employee selected, check all employees for open clock-ins
      await checkAllEmployeesForOpenClockIn();
      return;
    }

    await loadAvailableClockIns(parseInt(employeeProfileId));
  }, [loadAvailableClockIns, checkAllEmployeesForOpenClockIn]);

  useEffect(() => {
    if (!navigate) return;
    
    const initialize = async () => {
      await loadEmployees();
      await loadClockIns();
      await loadClockOuts();
      await loadDailyWorkHours();
      await loadDailyAttendanceGrid();
      await loadManualAdjustments();
      
      // Check for open clock-ins on page load
      await checkOpenClockIn(employeeFilter ? parseInt(employeeFilter) : null);
      
      setLoading(false);
    };
    
    initialize();
  }, [navigate, loadEmployees, loadClockIns, loadClockOuts, loadDailyWorkHours, loadDailyAttendanceGrid, loadManualAdjustments, checkOpenClockIn, employeeFilter]);

  // Reload attendance grid when date range changes
  useEffect(() => {
    if (activeTab === 1) {
      loadDailyAttendanceGrid();
    }
  }, [attendanceGridDateRange, activeTab, loadDailyAttendanceGrid]);

  // Check for open clock-ins when employee filter changes
  useEffect(() => {
    if (employeeFilter) {
      checkOpenClockIn(parseInt(employeeFilter));
      setSelectedEmployeeForAction(employeeFilter);
    } else {
      // If no employee filter, check all employees for open clock-ins
      checkOpenClockIn(null);
    }
  }, [employeeFilter, checkOpenClockIn]);

  // Get location
  const handleGetLocation = async (isClockIn = true) => {
    // Prevent multiple simultaneous calls
    if (gettingLocation) {
      return;
    }
    
    setGettingLocation(true);
    setLocationPermissionDenied(false);
    
    try {
      console.log("Getting location...");
      const location = await getCurrentLocation();
      console.log("Location received:", location);
      
      if (isClockIn) {
        setClockInFormData(prev => ({
          ...prev,
          location: location.location,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
      } else {
        setClockOutFormData(prev => ({
          ...prev,
          location: location.location,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
      }
      toast.success("Location captured successfully!");
      setLocationPermissionDenied(false);
    } catch (error) {
      console.error("Location error:", error);
      const errorMessage = error.message || "Failed to get location";
      
      // Check if it's a permission denied error
      if (errorMessage.includes("permission denied") || errorMessage.includes("Permission denied")) {
        setLocationPermissionDenied(true);
        toast.error("Location permission denied. Please enable location access in your browser settings and refresh the page.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setGettingLocation(false);
    }
  };

  // Handle clock in
  const handleClockIn = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!clockInFormData.employeeProfileId) errors.employeeProfileId = "Employee is required";
    if (!clockInFormData.clockInDate) errors.clockInDate = "Date is required";
    if (!clockInFormData.clockInTime) errors.clockInTime = "Time is required";
    if (!clockInFormData.location) errors.location = "Location is required";
    
    setClockInFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setFormLoading(true);
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      // Parse time
      const [hours, minutes] = clockInFormData.clockInTime.split(":");
      
      const payload = {
        EmployeeProfileId: parseInt(clockInFormData.employeeProfileId),
        ClockInDate: clockInFormData.clockInDate,
        ClockInTime: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`,
        Location: clockInFormData.location,
        Address: clockInFormData.address || null,
        Latitude: clockInFormData.latitude,
        Longitude: clockInFormData.longitude,
        Notes: clockInFormData.notes || null,
        DeviceIdentifier: getDeviceIdentifier(),
        DeviceType: getDeviceType(),
        OrgId: orgId || 0,
      };
      
      const response = await fetch(`${BASE_URL}/hr/clock-in-out/clock-in`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      // Check for success - ResponseStatus enum: SUCCESS = 200, FAILED = -99
      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess = 
        response.ok && (
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS" ||
          (statusCode === undefined && !responseData.message && !responseData.Message)
        );
      
      if (!isSuccess) {
        throw new Error(responseData.message || responseData.Message || "Failed to clock in");
      }
      
      toast.success(responseData.message || responseData.Message || "Clock in recorded successfully!");
      setClockInFormOpen(false);
      const clockedInEmployeeId = clockInFormData.employeeProfileId;
      
      // Reload data
      await loadClockIns();
      await loadClockOuts();
      await loadDailyWorkHours();
      await checkOpenClockIn(parseInt(clockedInEmployeeId));
      // Refresh attendance grid if on that tab
      if (activeTab === 1) {
        await loadDailyAttendanceGrid();
      }
      
      setClockInFormData({
        employeeProfileId: "",
        clockInDate: new Date().toISOString().split("T")[0],
        clockInTime: new Date().toTimeString().slice(0, 5),
        location: "",
        address: "",
        latitude: null,
        longitude: null,
        notes: "",
      });
      
      // Reload data after clock-in - add small delay to ensure backend update completes
      await Promise.all([loadClockIns()]);
      
      // Small delay to ensure backend has updated daily work hours
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await loadDailyWorkHours();
      
      // Refresh attendance grid if on that tab
      if (activeTab === 1) {
        await loadDailyAttendanceGrid();
      }
      
      // After clock-in, check for open clock-ins to show clock-out button
      if (clockedInEmployeeId) {
        await checkOpenClockIn(parseInt(clockedInEmployeeId));
        setSelectedEmployeeForAction(clockedInEmployeeId);
      } else {
        // If no employee ID, check all employees
        await checkOpenClockIn(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to clock in");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle clock out
  const handleClockOut = async (e) => {
    e.preventDefault();
    
    const errors = {};
    if (!clockOutFormData.employeeProfileId) errors.employeeProfileId = "Employee is required";
    if (!clockOutFormData.clockInId) errors.clockInId = "Clock in is required";
    if (!clockOutFormData.clockOutDate) errors.clockOutDate = "Date is required";
    if (!clockOutFormData.clockOutTime) errors.clockOutTime = "Time is required";
    if (!clockOutFormData.location) errors.location = "Location is required";
    
    setClockOutFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    
    setFormLoading(true);
    try {
      const orgId = getOrgId();
      const headers = createAuthHeaders();
      
      // Parse time
      const [hours, minutes] = clockOutFormData.clockOutTime.split(":");
      
      const payload = {
        EmployeeProfileId: parseInt(clockOutFormData.employeeProfileId),
        ClockInId: parseInt(clockOutFormData.clockInId),
        ClockOutDate: clockOutFormData.clockOutDate,
        ClockOutTime: `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`,
        Location: clockOutFormData.location,
        Address: clockOutFormData.address || null,
        Latitude: clockOutFormData.latitude,
        Longitude: clockOutFormData.longitude,
        Notes: clockOutFormData.notes || null,
        DeviceIdentifier: getDeviceIdentifier(),
        DeviceType: getDeviceType(),
        OrgId: orgId || 0,
      };
      
      const response = await fetch(`${BASE_URL}/hr/clock-in-out/clock-out`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      // Check for success - ResponseStatus enum: SUCCESS = 200, FAILED = -99
      const statusCode = responseData.statusCode || responseData.StatusCode;
      const isSuccess = 
        response.ok && (
          statusCode === 200 || 
          statusCode === "200" ||
          statusCode === "SUCCESS" ||
          (statusCode === undefined && !responseData.message && !responseData.Message)
        );
      
      if (!isSuccess) {
        throw new Error(responseData.message || responseData.Message || "Failed to clock out");
      }
      
      toast.success(responseData.message || responseData.Message || "Clock out recorded successfully!");
      setClockOutFormOpen(false);
      const clockedOutEmployeeId = clockOutFormData.employeeProfileId;
      
      // Reload data
      await loadClockIns();
      await loadClockOuts();
      await loadDailyWorkHours();
      await checkOpenClockIn(parseInt(clockedOutEmployeeId));
      // Refresh attendance grid if on that tab
      if (activeTab === 1) {
        await loadDailyAttendanceGrid();
      }
      
      setClockOutFormData({
        employeeProfileId: "",
        clockInId: "",
        clockOutDate: new Date().toISOString().split("T")[0],
        clockOutTime: new Date().toTimeString().slice(0, 5),
        location: "",
        address: "",
        latitude: null,
        longitude: null,
        notes: "",
      });
      
      // Reload data after clock-out - add delay to ensure backend update completes
      await Promise.all([loadClockIns(), loadClockOuts()]);
      
      // Delay to ensure backend has updated daily work hours (increased for reliability)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reload daily work hours to show updated Last Clock Out immediately
      await loadDailyWorkHours();
      
      // After clock-out, check for open clock-ins to determine next action
      if (clockedOutEmployeeId) {
        await checkOpenClockIn(parseInt(clockedOutEmployeeId));
        // Keep the selected employee so they can clock in again if needed
        setSelectedEmployeeForAction(clockedOutEmployeeId);
      } else {
        // If no employee ID, check all employees
        await checkOpenClockIn(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to clock out");
    } finally {
      setFormLoading(false);
    }
  };

  // Get employee name
  const getEmployeeName = (employeeProfileId) => {
    const employee = employees.find(emp => 
      (emp.id || emp.Id || emp.internalId || emp.InternalId) === employeeProfileId
    );
    if (employee) {
      const firstName = employee.firstName || employee.FirstName || "";
      const lastName = employee.lastName || employee.LastName || "";
      return `${firstName} ${lastName}`.trim() || "Unknown";
    }
    return "Unknown";
  };

  // Match clock-ins with their corresponding clock-outs for unified table
  const clockInOutPairs = useMemo(() => {
    // Match clock-ins with their corresponding clock-outs
    const matchedPairs = clockIns.map(clockIn => {
      const clockInId = clockIn.id || clockIn.Id || clockIn.internalId || clockIn.InternalId;
      const matchingClockOut = clockOuts.find(co => {
        const coClockInId = co.clockInId || co.ClockInId;
        return coClockInId === clockInId;
      });

      return {
        id: clockInId,
        clockInId: clockInId, // Keep original ID for sorting
        employeeProfileId: clockIn.employeeProfileId || clockIn.EmployeeProfileId,
        // Clock In data
        clockInDate: clockIn.clockInDate || clockIn.ClockInDate,
        clockInTime: clockIn.clockInTime || clockIn.ClockInTime,
        clockInDateTime: clockIn.clockInDateTime || clockIn.ClockInDateTime, // Full datetime for sorting
        clockInLocation: clockIn.location || clockIn.Location || "-",
        clockInDevice: clockIn.deviceType || clockIn.DeviceType || "-",
        // Clock Out data (if exists)
        clockOutDate: matchingClockOut ? (matchingClockOut.clockOutDate || matchingClockOut.ClockOutDate) : null,
        clockOutTime: matchingClockOut ? (matchingClockOut.clockOutTime || matchingClockOut.ClockOutTime) : null,
        clockOutDateTime: matchingClockOut ? (matchingClockOut.clockOutDateTime || matchingClockOut.ClockOutDateTime) : null,
        workingHours: matchingClockOut ? (matchingClockOut.workingHours || matchingClockOut.WorkingHours || 0) : null,
        clockOutLocation: matchingClockOut ? (matchingClockOut.location || matchingClockOut.Location || "-") : "-",
        clockOutDevice: matchingClockOut ? (matchingClockOut.deviceType || matchingClockOut.DeviceType || "-") : "-",
      };
    });

    // Also include clock-outs that don't have matching clock-ins (shouldn't happen, but just in case)
    const unmatchedClockOuts = clockOuts.filter(co => {
      const coClockInId = co.clockInId || co.ClockInId;
      return !clockIns.some(ci => {
        const ciId = ci.id || ci.Id || ci.internalId || ci.InternalId;
        return ciId === coClockInId;
      });
    }).map(clockOut => ({
      id: `out-${clockOut.id || clockOut.Id || clockOut.internalId || clockOut.InternalId}`,
      clockInId: clockOut.clockInId || clockOut.ClockInId || clockOut.id || clockOut.Id, // Use clockInId or fallback to clockOut id
      employeeProfileId: clockOut.employeeProfileId || clockOut.EmployeeProfileId,
      // Clock In data (empty)
      clockInDate: null,
      clockInTime: null,
      clockInDateTime: null,
      clockInLocation: "-",
      clockInDevice: "-",
      // Clock Out data
      clockOutDate: clockOut.clockOutDate || clockOut.ClockOutDate,
      clockOutTime: clockOut.clockOutTime || clockOut.ClockOutTime,
      clockOutDateTime: clockOut.clockOutDateTime || clockOut.ClockOutDateTime,
      workingHours: clockOut.workingHours || clockOut.WorkingHours || 0,
      clockOutLocation: clockOut.location || clockOut.Location || "-",
      clockOutDevice: clockOut.deviceType || clockOut.DeviceType || "-",
    }));

    return [...matchedPairs, ...unmatchedClockOuts].sort((a, b) => {
      // Sort by clock-in datetime first (oldest first)
      const aClockInDateTime = a.clockInDateTime 
        ? new Date(a.clockInDateTime)
        : (a.clockInDate && a.clockInTime) 
        ? new Date(`${a.clockInDate}T${a.clockInTime}`)
        : a.clockInDate 
        ? new Date(a.clockInDate)
        : null;
      
      const bClockInDateTime = b.clockInDateTime 
        ? new Date(b.clockInDateTime)
        : (b.clockInDate && b.clockInTime) 
        ? new Date(`${b.clockInDate}T${b.clockInTime}`)
        : b.clockInDate 
        ? new Date(b.clockInDate)
        : null;
      
      // If both have clock-in datetime, sort by clock-in (oldest first)
      if (aClockInDateTime && bClockInDateTime) {
        const dateDiff = aClockInDateTime - bClockInDateTime;
        if (dateDiff !== 0) return dateDiff; // Oldest first
      }
      
      // If only one has clock-in, prioritize it
      if (aClockInDateTime && !bClockInDateTime) return -1;
      if (!aClockInDateTime && bClockInDateTime) return 1;
      
      // If neither has clock-in, sort by clock-out datetime
      const aClockOutDateTime = a.clockOutDateTime 
        ? new Date(a.clockOutDateTime)
        : (a.clockOutDate && a.clockOutTime) 
        ? new Date(`${a.clockOutDate}T${a.clockOutTime}`)
        : a.clockOutDate 
        ? new Date(a.clockOutDate)
        : null;
      
      const bClockOutDateTime = b.clockOutDateTime 
        ? new Date(b.clockOutDateTime)
        : (b.clockOutDate && b.clockOutTime) 
        ? new Date(`${b.clockOutDate}T${b.clockOutTime}`)
        : b.clockOutDate 
        ? new Date(b.clockOutDate)
        : null;
      
      if (aClockOutDateTime && bClockOutDateTime) {
        return aClockOutDateTime - bClockOutDateTime; // Oldest first
      }
      
      // Fallback: sort by ID (lower ID = older record, first added)
      const aId = typeof a.clockInId === 'number' ? a.clockInId : (typeof a.id === 'number' ? a.id : parseInt(a.id) || 0);
      const bId = typeof b.clockInId === 'number' ? b.clockInId : (typeof b.id === 'number' ? b.id : parseInt(b.id) || 0);
      return aId - bId; // Oldest first (lower ID = first added)
    });
  }, [clockIns, clockOuts]);


  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shift & Attendance</h1>
        <ul>
          <li>
            <Link href="/hr/shifts-attendance/">Shift & Attendance</Link>
          </li>
        </ul>
      </div>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={320}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {error ? (
            <Box mb={3}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : null}

          {/* Tabbed Interface */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab icon={<AccessTimeIcon />} iconPosition="start" label="Clock In/Out" />
              <Tab icon={<CalendarTodayIcon />} iconPosition="start" label="Daily Attendance Grid" />
              <Tab icon={<EditIcon />} iconPosition="start" label="Manual Adjustment" />
              <Tab icon={<ScheduleIcon />} iconPosition="start" label="Shift Planner" />
              <Tab icon={<DashboardIcon />} iconPosition="start" label="Late/Absence Dashboard" />
              <Tab icon={<RequestQuoteIcon />} iconPosition="start" label="OT/Leave Requests" />
            </Tabs>
          </Paper>

          {/* Tab Panel: Clock In/Out */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                {!hasOpenClockIn ? (
                  <AddButton
                    label="Clock In"
                    onClick={async () => {
                      // If employee filter is set, pre-fill it
                      const initialEmployeeId = employeeFilter || selectedEmployeeForAction || "";
                      setClockInFormData({
                        employeeProfileId: initialEmployeeId,
                        clockInDate: new Date().toISOString().split("T")[0],
                        clockInTime: new Date().toTimeString().slice(0, 5),
                        location: "",
                        address: "",
                        latitude: null,
                        longitude: null,
                        notes: "",
                      });
                      setClockInFormErrors({});
                      setClockInFormOpen(true);
                    }}
                  />
                ) : (
                  <AddButton
                    label="Clock Out"
                    onClick={async () => {
                      // Pre-fill with selected employee and available clock-in
                      const empId = employeeFilter || selectedEmployeeForAction || "";
                      if (empId) {
                        await loadAvailableClockIns(parseInt(empId));
                      }
                      setClockOutFormErrors({});
                      setClockOutFormOpen(true);
                    }}
                  />
                )}
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={employeeFilter}
                  label="Employee"
                  onChange={async (e) => {
                    const empId = e.target.value;
                    setEmployeeFilter(empId);
                    setPage(1);
                    setSelectedEmployeeForAction(empId);
                    // Check for open clock-ins when employee is selected
                    if (empId) {
                      await checkOpenClockIn(parseInt(empId));
                    } else {
                      setHasOpenClockIn(false);
                    }
                  }}
                >
                  <MenuItem value="">All Employees</MenuItem>
                  {employees.map((emp) => {
                    const id = emp.id || emp.Id || emp.internalId || emp.InternalId;
                    const firstName = emp.firstName || emp.FirstName || "";
                    const lastName = emp.lastName || emp.LastName || "";
                    const name = `${firstName} ${lastName}`.trim();
                    return (
                      <MenuItem key={id} value={id}>
                        {name || `Employee ${id}`}
                    </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Daily Work Hours Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Daily Work Hours Summary
              </Typography>
            <ModernTable
              columns={[
                  { id: "workDate", label: "Date", render: (value) => formatDate(value) },
                  { id: "employeeProfileId", label: "Employee", render: (value) => getEmployeeName(value) },
                  { 
                    id: "workingHours", 
                    label: "Working Hours", 
                    render: (value) => `${(value || 0).toFixed(2)} hrs` 
                  },
                  { 
                    id: "breakHours", 
                    label: "Break Hours", 
                    render: (value) => `${(value || 0).toFixed(2)} hrs` 
                  },
                  { id: "totalWorkingHours", label: "Total Hours", render: (value) => `${(value || 0).toFixed(2)} hrs` },
                  { id: "clockInCount", label: "Clock Ins" },
                  { id: "clockOutCount", label: "Clock Outs" },
                  { 
                    id: "firstClockIn", 
                    label: "First Clock In", 
                    render: (value) => value ? new Date(value).toLocaleTimeString() : "-" 
                  },
                  { 
                    id: "lastClockOut", 
                    label: "Last Clock Out", 
                    render: (value) => value ? new Date(value).toLocaleTimeString() : "-" 
                  },
                ]}
                rows={dailyWorkHours.map(item => {
                  const employeeProfileId = item.employeeProfileId || item.EmployeeProfileId;
                  const workDate = item.workDate || item.WorkDate;
                  const firstClockIn = item.firstClockIn || item.FirstClockIn;
                  const lastClockOut = item.lastClockOut || item.LastClockOut;
                  
                  // Use backend-calculated values
                  const workingHours = item.totalWorkingHours || item.TotalWorkingHours || 0;
                  const breakHours = item.breakHours || item.BreakHours || 0;
                  
                  // Calculate total hours (first clock in to last clock out)
                  let totalHours = 0;
                  if (firstClockIn && lastClockOut) {
                    totalHours = (new Date(lastClockOut) - new Date(firstClockIn)) / (1000 * 60 * 60);
                  }
                  
                  return {
                    id: item.id || item.Id || item.internalId || item.InternalId,
                    workDate: workDate,
                    employeeProfileId: employeeProfileId,
                    workingHours: workingHours,
                    breakHours: breakHours,
                    totalWorkingHours: totalHours,
                    clockInCount: item.clockInCount || item.ClockInCount || 0,
                    clockOutCount: item.clockOutCount || item.ClockOutCount || 0,
                    firstClockIn: firstClockIn,
                    lastClockOut: lastClockOut,
                  };
                })}
                emptyMessage="No work hours data available"
              />
            </CardContent>
          </Card>

          {/* Clock In/Out Combined Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Clock In / Clock Out
              </Typography>
              <ModernTable
                columns={[
                  { id: "employeeProfileId", label: "Employee", render: (value) => getEmployeeName(value) },
                  // Clock In columns (left side)
                  { id: "clockInDate", label: "Clock In Date", render: (value) => value ? formatDate(value) : "-" },
                  { id: "clockInTime", label: "Clock In Time", render: (value) => {
                    if (!value) return "-";
                    if (typeof value === "string") {
                      const [hours, minutes] = value.split(":");
                      return `${hours}:${minutes}`;
                    }
                    return "-";
                  }},
                  { id: "clockInLocation", label: "Clock In Location", render: (value) => value || "-" },
                  { id: "clockInDevice", label: "Clock In Device", render: (value) => value || "-" },
                  // Clock Out columns (right side)
                  { id: "clockOutDate", label: "Clock Out Date", render: (value) => value ? formatDate(value) : "-" },
                  { id: "clockOutTime", label: "Clock Out Time", render: (value) => {
                    if (!value) return "-";
                    if (typeof value === "string") {
                      const [hours, minutes] = value.split(":");
                      return `${hours}:${minutes}`;
                    }
                    return "-";
                  }},
                  { id: "workingHours", label: "Working Hours", render: (value) => value ? `${(value || 0).toFixed(2)} hrs` : "-" },
                  { id: "clockOutLocation", label: "Clock Out Location", render: (value) => value || "-" },
                  { id: "clockOutDevice", label: "Clock Out Device", render: (value) => value || "-" },
                ]}
                rows={clockInOutPairs}
                emptyMessage="No clock in/out records"
              />
              <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={Math.ceil(totalCount / pageSize)}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Clock In Form Dialog */}
          <FormDialog
            open={clockInFormOpen}
            onClose={() => setClockInFormOpen(false)}
            title="Clock In"
            onSubmit={handleClockIn}
            loading={formLoading}
          >
            <Grid container spacing={2}>
              <FormField
                name="employeeProfileId"
                label="Employee"
                type="select"
                value={clockInFormData.employeeProfileId}
                onChange={async (e) => {
                  const empId = e.target.value;
                  setClockInFormData(prev => ({ ...prev, employeeProfileId: empId }));
                  setSelectedEmployeeForAction(empId);
                  if (empId) {
                    await checkOpenClockIn(parseInt(empId));
                  }
                }}
                options={employees.map(emp => {
                  const id = emp.id || emp.Id || emp.internalId || emp.InternalId;
                  const firstName = emp.firstName || emp.FirstName || "";
                  const lastName = emp.lastName || emp.LastName || "";
                  const name = `${firstName} ${lastName}`.trim();
                  return { value: String(id), label: name || `Employee ${id}` };
                })}
                error={!!clockInFormErrors.employeeProfileId}
                helperText={clockInFormErrors.employeeProfileId}
                xs={12}
              />
              <FormField
                name="clockInDate"
                label="Date"
                type="date"
                value={clockInFormData.clockInDate}
                onChange={(e) => setClockInFormData(prev => ({ ...prev, clockInDate: e.target.value }))}
                error={!!clockInFormErrors.clockInDate}
                helperText={clockInFormErrors.clockInDate}
                xs={6}
              />
              <FormField
                name="clockInTime"
                label="Time"
                type="time"
                value={clockInFormData.clockInTime}
                onChange={(e) => setClockInFormData(prev => ({ ...prev, clockInTime: e.target.value }))}
                error={!!clockInFormErrors.clockInTime}
                helperText={clockInFormErrors.clockInTime}
                xs={6}
              />
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={clockInFormData.location}
                    onChange={(e) => setClockInFormData(prev => ({ ...prev, location: e.target.value }))}
                    error={!!clockInFormErrors.location}
                    helperText={clockInFormErrors.location}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<LocationOnIcon />}
                    onClick={() => handleGetLocation(true)}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? "Getting..." : "Get Location"}
                  </Button>
                </Box>
              </Grid>
              <FormField
                name="notes"
                label="Notes"
                type="textarea"
                value={clockInFormData.notes}
                onChange={(e) => setClockInFormData(prev => ({ ...prev, notes: e.target.value }))}
                xs={12}
              />
            </Grid>
          </FormDialog>

          {/* Clock Out Form Dialog */}
          <FormDialog
            open={clockOutFormOpen}
            onClose={() => setClockOutFormOpen(false)}
            title="Clock Out"
            onSubmit={handleClockOut}
            loading={formLoading}
          >
            <Grid container spacing={2}>
              <FormField
                name="employeeProfileId"
                label="Employee"
                type="select"
                value={clockOutFormData.employeeProfileId}
                onChange={async (e) => {
                  const empId = e.target.value;
                  setClockOutFormData(prev => ({ ...prev, employeeProfileId: empId, clockInId: "" }));
                  if (empId) {
                    await loadAvailableClockIns(parseInt(empId));
                  }
                }}
                options={employees.map(emp => {
                  const id = emp.id || emp.Id || emp.internalId || emp.InternalId;
                  const firstName = emp.firstName || emp.FirstName || "";
                  const lastName = emp.lastName || emp.LastName || "";
                  const name = `${firstName} ${lastName}`.trim();
                  return { value: String(id), label: name || `Employee ${id}` };
                })}
                error={!!clockOutFormErrors.employeeProfileId}
                helperText={clockOutFormErrors.employeeProfileId}
                xs={12}
              />
              <FormField
                name="clockInId"
                label="Clock In"
                type="select"
                value={clockOutFormData.clockInId}
                onChange={(e) => setClockOutFormData(prev => ({ ...prev, clockInId: e.target.value }))}
                options={availableClockIns.map(ci => {
                  const id = ci.id || ci.Id || ci.internalId || ci.InternalId;
                  const date = ci.clockInDate || ci.ClockInDate;
                  const time = ci.clockInTime || ci.ClockInTime;
                  return { 
                    value: String(id), 
                    label: `${formatDate(date)} ${typeof time === "string" ? time.slice(0, 5) : ""}` 
                  };
                })}
                error={!!clockOutFormErrors.clockInId}
                helperText={clockOutFormErrors.clockInId}
                xs={12}
                disabled={!clockOutFormData.employeeProfileId}
              />
              <FormField
                name="clockOutDate"
                label="Date"
                type="date"
                value={clockOutFormData.clockOutDate}
                onChange={(e) => setClockOutFormData(prev => ({ ...prev, clockOutDate: e.target.value }))}
                error={!!clockOutFormErrors.clockOutDate}
                helperText={clockOutFormErrors.clockOutDate}
                xs={6}
              />
              <FormField
                name="clockOutTime"
                label="Time"
                type="time"
                value={clockOutFormData.clockOutTime}
                onChange={(e) => setClockOutFormData(prev => ({ ...prev, clockOutTime: e.target.value }))}
                error={!!clockOutFormErrors.clockOutTime}
                helperText={clockOutFormErrors.clockOutTime}
                xs={6}
              />
              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={clockOutFormData.location}
                    onChange={(e) => setClockOutFormData(prev => ({ ...prev, location: e.target.value }))}
                    error={!!clockOutFormErrors.location}
                    helperText={clockOutFormErrors.location}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<LocationOnIcon />}
                    onClick={() => handleGetLocation(false)}
                    disabled={gettingLocation}
                  >
                    {gettingLocation ? "Getting..." : "Get Location"}
                  </Button>
                </Box>
              </Grid>
              <FormField
                name="notes"
                label="Notes"
                type="textarea"
                value={clockOutFormData.notes}
                onChange={(e) => setClockOutFormData(prev => ({ ...prev, notes: e.target.value }))}
                xs={12}
              />
            </Grid>
          </FormDialog>
            </Box>
          )}

          {/* Tab Panel: Daily Attendance Grid */}
          {activeTab === 1 && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Daily Attendance Grid</Typography>
                    <Box display="flex" gap={2}>
                      <TextField
                        type="date"
                        label="From Date"
                        value={attendanceGridDateRange.from}
                        onChange={(e) => setAttendanceGridDateRange(prev => ({ ...prev, from: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                      <TextField
                        type="date"
                        label="To Date"
                        value={attendanceGridDateRange.to}
                        onChange={(e) => setAttendanceGridDateRange(prev => ({ ...prev, to: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                      />
                      <Button
                        variant="outlined"
                        onClick={loadDailyAttendanceGrid}
                        disabled={attendanceGridLoading}
                      >
                        {attendanceGridLoading ? "Loading..." : "Refresh"}
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Shows all employees with their first clock-in and last clock-out. Status is automatically set to "Present" when first clock-in is recorded, otherwise "Absent".
                  </Typography>
                  {attendanceGridLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ModernTable
                      columns={[
                        { id: "employeeName", label: "Employee" },
                        { id: "date", label: "Date", render: (value) => formatDate(value) },
                        { 
                          id: "checkIn", 
                          label: "First Clock In", 
                          render: (value) => {
                            if (!value) return "-";
                            try {
                              const date = new Date(value);
                              return date.toLocaleTimeString();
                            } catch {
                              return value;
                            }
                          }
                        },
                        { 
                          id: "checkOut", 
                          label: "Last Clock Out", 
                          render: (value) => {
                            if (!value) return "-";
                            try {
                              const date = new Date(value);
                              return date.toLocaleTimeString();
                            } catch {
                              return value;
                            }
                          }
                        },
                        { 
                          id: "status", 
                          label: "Status", 
                          render: (value) => (
                            <Chip 
                              label={value || "Absent"} 
                              color={value === "Absent" ? "error" : value === "Late" ? "warning" : "success"}
                              size="small"
                            />
                          )
                        },
                        { 
                          id: "workingHours", 
                          label: "Working Hours", 
                          render: (value) => `${(value || 0).toFixed(2)} hrs` 
                        },
                        { 
                          id: "source", 
                          label: "Source", 
                          render: (value) => value || "Manual" 
                        },
                      ]}
                      rows={attendanceGridData}
                      emptyMessage="No attendance records found"
                    />
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Tab Panel: Manual Attendance Adjustment */}
          {activeTab === 2 && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Manual Attendance Adjustment</Typography>
                    <AddButton
                      label="Add Adjustment"
                      onClick={() => {
                        setEditingAttendanceRecord(null);
                        setManualAdjustmentFormData({
                          employeeProfileId: "",
                          workDate: new Date().toISOString().split("T")[0],
                          checkIn: "",
                          checkOut: "",
                          status: "Present",
                          source: "Manual",
                          location: "",
                          remarks: "",
                        });
                        setManualAdjustmentDialogOpen(true);
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Manually adjust attendance records for employees. This is useful for correcting errors or adding missed entries.
                  </Typography>
                  <ModernTable
                    columns={[
                      { id: "employeeName", label: "Employee" },
                      { id: "workDate", label: "Date", render: (value) => formatDate(value) },
                      { id: "checkIn", label: "Check In", render: (value) => value ? new Date(value).toLocaleTimeString() : "-" },
                      { id: "checkOut", label: "Check Out", render: (value) => value ? new Date(value).toLocaleTimeString() : "-" },
                      { id: "status", label: "Status", render: (value) => (
                        <Chip 
                          label={value || "Present"} 
                          color={value === "Absent" ? "error" : value === "Late" ? "warning" : "success"}
                          size="small"
                        />
                      )},
                      { id: "source", label: "Source" },
                      { id: "remarks", label: "Remarks" },
                      {
                        id: "actions",
                        label: "Actions",
                        align: "center",
                        render: (_, row) => (
                          <ActionButtons
                            onEdit={() => {
                              setEditingAttendanceRecord(row);
                              setManualAdjustmentFormData({
                                employeeProfileId: row.employeeProfileId || "",
                                workDate: row.workDate || new Date().toISOString().split("T")[0],
                                checkIn: row.checkIn || "",
                                checkOut: row.checkOut || "",
                                status: row.status || "Present",
                                source: row.source || "Manual",
                                location: row.location || "",
                                remarks: row.remarks || "",
                              });
                              setManualAdjustmentDialogOpen(true);
                            }}
                            onDelete={() => {
                              setItemToDelete(row);
                              setDeleteItemType("attendance");
                              setDeleteDialogOpen(true);
                            }}
                          />
                        )
                      },
                    ]}
                    rows={manualAdjustmentData}
                    emptyMessage="No manual adjustments found"
                  />
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Tab Panel: Shift Planner */}
          {activeTab === 3 && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Shift Planner</Typography>
                    <AddButton
                      label="Add Shift"
                      onClick={() => {
                        setEditingShift(null);
                        setShiftFormData({
                          name: "",
                          startTime: "09:00",
                          endTime: "17:00",
                          breakDuration: 60,
                          gracePeriod: 15,
                        });
                        setShiftDialogOpen(true);
                      }}
                    />
                  </Box>
                  <ModernTable
                    columns={[
                      { id: "name", label: "Shift Name" },
                      { id: "startTime", label: "Start Time", render: (value) => value || "-" },
                      { id: "endTime", label: "End Time", render: (value) => value || "-" },
                      { id: "breakDuration", label: "Break (mins)", render: (value) => `${value || 0} mins` },
                      { id: "gracePeriod", label: "Grace Period (mins)", render: (value) => `${value || 0} mins` },
                      {
                        id: "actions",
                        label: "Actions",
                        align: "center",
                        render: (_, row) => (
                          <ActionButtons
                            onEdit={() => {
                              setEditingShift(row);
                              setShiftFormData({
                                name: row.name || "",
                                startTime: row.startTime || "09:00",
                                endTime: row.endTime || "17:00",
                                breakDuration: row.breakDuration || 60,
                                gracePeriod: row.gracePeriod || 15,
                              });
                              setShiftDialogOpen(true);
                            }}
                            onDelete={() => {
                              setItemToDelete(row);
                              setDeleteItemType("shift");
                              setDeleteDialogOpen(true);
                            }}
                          />
                        )
                      },
                    ]}
                    rows={shifts}
                    emptyMessage="No shifts configured"
                  />
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Tab Panel: Late/Absence Dashboard */}
          {activeTab === 4 && (
            <Box>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <WarningIcon color="warning" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4">{lateAbsenceStats.totalLates}</Typography>
                          <Typography variant="body2" color="text.secondary">Total Lates</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CancelIcon color="error" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4">{lateAbsenceStats.totalAbsences}</Typography>
                          <Typography variant="body2" color="text.secondary">Total Absences</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <AccessTimeIcon color="info" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4">{lateAbsenceStats.totalHalfDays}</Typography>
                          <Typography variant="body2" color="text.secondary">Half Days</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <TrendingUpIcon color="error" sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4">{lateAbsenceStats.noPayDays}</Typography>
                          <Typography variant="body2" color="text.secondary">No-Pay Days</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2 }}>Late/Absence Details</Typography>
                  <ModernTable
                    columns={[
                      { id: "employeeName", label: "Employee" },
                      { id: "date", label: "Date", render: (value) => formatDate(value) },
                      { id: "type", label: "Type", render: (value) => (
                        <Chip 
                          label={value || "Late"} 
                          color={value === "Absent" ? "error" : value === "Half Day" ? "warning" : "warning"}
                          size="small"
                        />
                      )},
                      { id: "duration", label: "Duration" },
                      { id: "noPayAmount", label: "No-Pay Amount", render: (value) => value ? `LKR ${value}` : "-" },
                    ]}
                    rows={[]}
                    emptyMessage="No late/absence records found"
                  />
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Tab Panel: OT/Leave Requests */}
          {activeTab === 5 && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">OT/Leave Request Approval</Typography>
                    <AddButton
                      label="Add Request"
                      onClick={() => {
                        setSelectedRequest(null);
                        setRequestFormData({
                          employeeProfileId: "",
                          requestType: "OT",
                          date: new Date().toISOString().split("T")[0],
                          hours: "",
                          reason: "",
                        });
                        setRequestDialogOpen(true);
                      }}
                    />
                  </Box>
                  <ModernTable
                    columns={[
                      { id: "employeeName", label: "Employee" },
                      { id: "requestType", label: "Type", render: (value) => (
                        <Chip 
                          label={value || "OT"} 
                          color={value === "Leave" ? "info" : "success"}
                          size="small"
                        />
                      )},
                      { id: "date", label: "Date", render: (value) => formatDate(value) },
                      { id: "hours", label: "Hours/Days", render: (value) => value || "-" },
                      { id: "reason", label: "Reason" },
                      { id: "status", label: "Status", render: (value) => (
                        <Chip 
                          label={value || "Pending"} 
                          color={value === "Approved" ? "success" : value === "Rejected" ? "error" : "warning"}
                          size="small"
                        />
                      )},
                      { 
                        id: "actions", 
                        label: "Actions",
                        align: "center",
                        render: (_, row) => (
                          <Box display="flex" gap={1} justifyContent="center">
                            {row.status === "Pending" && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={async () => {
                                    try {
                                      const headers = createAuthHeaders();
                                      const response = await fetch(`${BASE_URL}/hr/attendance/requests/${row.id}/approve`, {
                                        method: "PUT",
                                        headers: { ...headers, "Content-Type": "application/json" },
                                        body: JSON.stringify({ approved: true }),
                                      });
                                      if (response.ok) {
                                        toast.success("Request approved successfully");
                                        // Reload requests
                                      } else {
                                        toast.error("Failed to approve request");
                                      }
                                    } catch (error) {
                                      toast.error("Error approving request");
                                    }
                                  }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={async () => {
                                    try {
                                      const headers = createAuthHeaders();
                                      const response = await fetch(`${BASE_URL}/hr/attendance/requests/${row.id}/reject`, {
                                        method: "PUT",
                                        headers: { ...headers, "Content-Type": "application/json" },
                                        body: JSON.stringify({ approved: false }),
                                      });
                                      if (response.ok) {
                                        toast.success("Request rejected");
                                        // Reload requests
                                      } else {
                                        toast.error("Failed to reject request");
                                      }
                                    } catch (error) {
                                      toast.error("Error rejecting request");
                                    }
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedRequest(row);
                                setRequestFormData({
                                  employeeProfileId: row.employeeProfileId || "",
                                  requestType: row.requestType || "OT",
                                  date: row.date || new Date().toISOString().split("T")[0],
                                  hours: row.hours || "",
                                  reason: row.reason || "",
                                });
                                setRequestDialogOpen(true);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setItemToDelete(row);
                                setDeleteItemType("request");
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <CancelIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )
                      },
                    ]}
                    rows={otLeaveRequests}
                    emptyMessage="No OT/Leave requests pending"
                  />
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Manual Adjustment Dialog */}
          <FormDialog
            open={manualAdjustmentDialogOpen}
            onClose={() => {
              setManualAdjustmentDialogOpen(false);
              setEditingAttendanceRecord(null);
            }}
            title={editingAttendanceRecord ? "Edit Attendance Record" : "Manual Attendance Adjustment"}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const headers = createAuthHeaders();
                const orgId = getOrgId();
                
                if (editingAttendanceRecord) {
                  // Update existing record
                  const response = await fetch(`${BASE_URL}/hr/attendance/records/${editingAttendanceRecord.id}`, {
                    method: "PUT",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      employeeProfileId: parseInt(manualAdjustmentFormData.employeeProfileId),
                      workDate: manualAdjustmentFormData.workDate,
                      checkIn: manualAdjustmentFormData.checkIn ? new Date(manualAdjustmentFormData.checkIn).toISOString() : null,
                      checkOut: manualAdjustmentFormData.checkOut ? new Date(manualAdjustmentFormData.checkOut).toISOString() : null,
                      status: manualAdjustmentFormData.status,
                      source: manualAdjustmentFormData.source,
                      location: manualAdjustmentFormData.location,
                      remarks: manualAdjustmentFormData.remarks,
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Attendance record updated successfully");
                    setManualAdjustmentDialogOpen(false);
                    setEditingAttendanceRecord(null);
                    await loadManualAdjustments();
                    // Reload attendance grid if on that tab
                    if (activeTab === 1) {
                      await loadDailyAttendanceGrid();
                    }
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to update attendance record");
                  }
                } else {
                  // Create new record
                  const response = await fetch(`${BASE_URL}/hr/attendance/records`, {
                    method: "POST",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      employeeProfileId: parseInt(manualAdjustmentFormData.employeeProfileId),
                      workDate: manualAdjustmentFormData.workDate,
                      checkIn: manualAdjustmentFormData.checkIn ? new Date(manualAdjustmentFormData.checkIn).toISOString() : null,
                      checkOut: manualAdjustmentFormData.checkOut ? new Date(manualAdjustmentFormData.checkOut).toISOString() : null,
                      status: manualAdjustmentFormData.status,
                      source: manualAdjustmentFormData.source,
                      location: manualAdjustmentFormData.location,
                      remarks: manualAdjustmentFormData.remarks,
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Attendance record created successfully");
                    setManualAdjustmentDialogOpen(false);
                    await loadManualAdjustments();
                    // Reload attendance grid if on that tab
                    if (activeTab === 1) {
                      await loadDailyAttendanceGrid();
                    }
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to create attendance record");
                  }
                }
              } catch (error) {
                console.error("Error saving attendance record:", error);
                toast.error("Error saving attendance record");
              }
            }}
          >
            <Grid container spacing={2}>
              <FormField
                name="employeeProfileId"
                label="Employee"
                type="select"
                value={manualAdjustmentFormData.employeeProfileId}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, employeeProfileId: e.target.value }))}
                options={employees.map(emp => {
                  const id = emp.id || emp.Id || emp.internalId || emp.InternalId;
                  const firstName = emp.firstName || emp.FirstName || "";
                  const lastName = emp.lastName || emp.LastName || "";
                  const name = `${firstName} ${lastName}`.trim();
                  return { value: String(id), label: name || `Employee ${id}` };
                })}
                xs={12}
                required
              />
              <FormField
                name="workDate"
                label="Work Date"
                type="date"
                value={manualAdjustmentFormData.workDate}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, workDate: e.target.value }))}
                xs={6}
                required
              />
              <FormField
                name="status"
                label="Status"
                type="select"
                value={manualAdjustmentFormData.status}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: "Present", label: "Present" },
                  { value: "Absent", label: "Absent" },
                  { value: "Half Day", label: "Half Day" },
                  { value: "Late", label: "Late" },
                ]}
                xs={6}
                required
              />
              <FormField
                name="checkIn"
                label="Check In"
                type="datetime-local"
                value={manualAdjustmentFormData.checkIn}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                xs={6}
              />
              <FormField
                name="checkOut"
                label="Check Out"
                type="datetime-local"
                value={manualAdjustmentFormData.checkOut}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                xs={6}
              />
              <FormField
                name="source"
                label="Source"
                type="select"
                value={manualAdjustmentFormData.source}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, source: e.target.value }))}
                options={[
                  { value: "Manual", label: "Manual" },
                  { value: "Biometric", label: "Biometric" },
                  { value: "Web", label: "Web Check-in" },
                  { value: "Mobile", label: "Mobile App GPS" },
                  { value: "DutyTravel", label: "Duty Travel" },
                ]}
                xs={6}
              />
              <FormField
                name="location"
                label="Location"
                value={manualAdjustmentFormData.location}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, location: e.target.value }))}
                xs={6}
              />
              <FormField
                name="remarks"
                label="Remarks"
                type="textarea"
                value={manualAdjustmentFormData.remarks}
                onChange={(e) => setManualAdjustmentFormData(prev => ({ ...prev, remarks: e.target.value }))}
                xs={12}
              />
            </Grid>
          </FormDialog>

          {/* Shift Planner Dialog */}
          <FormDialog
            open={shiftDialogOpen}
            onClose={() => {
              setShiftDialogOpen(false);
              setEditingShift(null);
            }}
            title={editingShift ? "Edit Shift" : "Add Shift"}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const headers = createAuthHeaders();
                const orgId = getOrgId();
                
                if (editingShift) {
                  // Update existing shift
                  const response = await fetch(`${BASE_URL}/hr/shifts/${editingShift.id}`, {
                    method: "PUT",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: shiftFormData.name,
                      startTime: shiftFormData.startTime,
                      endTime: shiftFormData.endTime,
                      breakDuration: shiftFormData.breakDuration,
                      gracePeriod: shiftFormData.gracePeriod,
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Shift updated successfully");
                    setShiftDialogOpen(false);
                    setEditingShift(null);
                    // Reload shifts
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to update shift");
                  }
                } else {
                  // Create new shift
                  const response = await fetch(`${BASE_URL}/hr/shifts`, {
                    method: "POST",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: shiftFormData.name,
                      startTime: shiftFormData.startTime,
                      endTime: shiftFormData.endTime,
                      breakDuration: shiftFormData.breakDuration,
                      gracePeriod: shiftFormData.gracePeriod,
                      orgId: orgId || 0,
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Shift created successfully");
                    setShiftDialogOpen(false);
                    // Reload shifts
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to create shift");
                  }
                }
              } catch (error) {
                console.error("Error saving shift:", error);
                toast.error("Error saving shift");
              }
            }}
          >
            <Grid container spacing={2}>
              <FormField
                name="name"
                label="Shift Name"
                value={shiftFormData.name}
                onChange={(e) => setShiftFormData(prev => ({ ...prev, name: e.target.value }))}
                xs={12}
                required
              />
              <FormField
                name="startTime"
                label="Start Time"
                type="time"
                value={shiftFormData.startTime}
                onChange={(e) => setShiftFormData(prev => ({ ...prev, startTime: e.target.value }))}
                xs={6}
                required
              />
              <FormField
                name="endTime"
                label="End Time"
                type="time"
                value={shiftFormData.endTime}
                onChange={(e) => setShiftFormData(prev => ({ ...prev, endTime: e.target.value }))}
                xs={6}
                required
              />
              <FormField
                name="breakDuration"
                label="Break Duration (minutes)"
                type="number"
                value={shiftFormData.breakDuration}
                onChange={(e) => setShiftFormData(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 0 }))}
                xs={6}
              />
              <FormField
                name="gracePeriod"
                label="Late Grace Period (minutes)"
                type="number"
                value={shiftFormData.gracePeriod}
                onChange={(e) => setShiftFormData(prev => ({ ...prev, gracePeriod: parseInt(e.target.value) || 0 }))}
                xs={6}
              />
            </Grid>
          </FormDialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setItemToDelete(null);
              setDeleteItemType("");
            }}
            title="Confirm Delete"
            message={`Are you sure you want to delete this ${deleteItemType === "attendance" ? "attendance record" : deleteItemType === "shift" ? "shift" : "request"}? This action cannot be undone.`}
            onConfirm={async () => {
              try {
                const headers = createAuthHeaders();
                let response;
                
                if (deleteItemType === "attendance") {
                  response = await fetch(`${BASE_URL}/hr/attendance/records/${itemToDelete.id}`, {
                    method: "DELETE",
                    headers,
                  });
                } else if (deleteItemType === "shift") {
                  response = await fetch(`${BASE_URL}/hr/shifts/${itemToDelete.id}`, {
                    method: "DELETE",
                    headers,
                  });
                } else if (deleteItemType === "request") {
                  response = await fetch(`${BASE_URL}/hr/attendance/requests/${itemToDelete.id}`, {
                    method: "DELETE",
                    headers,
                  });
                }
                
                if (response && response.ok) {
                  toast.success("Item deleted successfully");
                  setDeleteDialogOpen(false);
                  setItemToDelete(null);
                  const deletedType = deleteItemType;
                  setDeleteItemType("");
                  
                  // Reload data based on active tab and deleted type
                  if (deletedType === "attendance") {
                    await loadManualAdjustments();
                    if (activeTab === 1) {
                      await loadDailyAttendanceGrid();
                    }
                  } else if (deletedType === "shift") {
                    // Reload shifts
                  } else if (deletedType === "request") {
                    // Reload requests
                  }
                } else {
                  toast.error("Failed to delete item");
                }
              } catch (error) {
                console.error("Error deleting item:", error);
                toast.error("Error deleting item");
              }
            }}
          />

          {/* OT/Leave Request Dialog */}
          <FormDialog
            open={requestDialogOpen}
            onClose={() => {
              setRequestDialogOpen(false);
              setSelectedRequest(null);
            }}
            title={selectedRequest ? "Edit OT/Leave Request" : "Add OT/Leave Request"}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const headers = createAuthHeaders();
                const orgId = getOrgId();
                
                if (selectedRequest) {
                  // Update existing request
                  const response = await fetch(`${BASE_URL}/hr/attendance/requests/${selectedRequest.id}`, {
                    method: "PUT",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      employeeProfileId: parseInt(requestFormData.employeeProfileId),
                      requestType: requestFormData.requestType,
                      date: requestFormData.date,
                      hours: parseFloat(requestFormData.hours) || 0,
                      reason: requestFormData.reason,
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Request updated successfully");
                    setRequestDialogOpen(false);
                    setSelectedRequest(null);
                    // Reload requests
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to update request");
                  }
                } else {
                  // Create new request
                  const response = await fetch(`${BASE_URL}/hr/attendance/requests`, {
                    method: "POST",
                    headers: { ...headers, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      employeeProfileId: parseInt(requestFormData.employeeProfileId),
                      requestType: requestFormData.requestType,
                      date: requestFormData.date,
                      hours: parseFloat(requestFormData.hours) || 0,
                      reason: requestFormData.reason,
                      orgId: orgId || 0,
                    }),
                  });
                  
                  if (response.ok) {
                    toast.success("Request created successfully");
                    setRequestDialogOpen(false);
                    // Reload requests
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.message || "Failed to create request");
                  }
                }
              } catch (error) {
                console.error("Error saving request:", error);
                toast.error("Error saving request");
              }
            }}
          >
            <Grid container spacing={2}>
              <FormField
                name="employeeProfileId"
                label="Employee"
                type="select"
                value={requestFormData.employeeProfileId}
                onChange={(e) => setRequestFormData(prev => ({ ...prev, employeeProfileId: e.target.value }))}
                options={employees.map(emp => {
                  const id = emp.id || emp.Id || emp.internalId || emp.InternalId;
                  const firstName = emp.firstName || emp.FirstName || "";
                  const lastName = emp.lastName || emp.LastName || "";
                  const name = `${firstName} ${lastName}`.trim();
                  return { value: String(id), label: name || `Employee ${id}` };
                })}
                xs={12}
                required
              />
              <FormField
                name="requestType"
                label="Request Type"
                type="select"
                value={requestFormData.requestType}
                onChange={(e) => setRequestFormData(prev => ({ ...prev, requestType: e.target.value }))}
                options={[
                  { value: "OT", label: "Overtime" },
                  { value: "Leave", label: "Leave" },
                ]}
                xs={6}
                required
              />
              <FormField
                name="date"
                label="Date"
                type="date"
                value={requestFormData.date}
                onChange={(e) => setRequestFormData(prev => ({ ...prev, date: e.target.value }))}
                xs={6}
                required
              />
              <FormField
                name="hours"
                label="Hours/Days"
                type="number"
                value={requestFormData.hours}
                onChange={(e) => setRequestFormData(prev => ({ ...prev, hours: e.target.value }))}
                xs={6}
                required
              />
              <FormField
                name="reason"
                label="Reason"
                type="textarea"
                value={requestFormData.reason}
                onChange={(e) => setRequestFormData(prev => ({ ...prev, reason: e.target.value }))}
                xs={12}
                required
              />
            </Grid>
          </FormDialog>
        </>
      )}
    </>
  );
};

export default ShiftAttendance;
