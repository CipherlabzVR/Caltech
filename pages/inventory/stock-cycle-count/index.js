import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";

const StockCycleCount = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create } = IsPermissionEnabled(cId);
  const router = useRouter();
  const [statusLabels, setStatusLabels] = useState({});
  const [statusTabs, setStatusTabs] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [cycleCountList, setCycleCountList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    const colorMap = { 0: "default", 1: "success", 2: "info", 3: "warning" };
    return colorMap[status] ?? "default";
  };

  const navigateToCreate = () => {
    router.push({
      pathname: "/inventory/stock-cycle-count/create",
    });
  };

  const fetchCycleCountList = async (pageNum = 1, term = search, size = pageSize, statusVal = null) => {
    if (typeof window === "undefined") return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const skip = (pageNum - 1) * size;
      const searchParam = term ? encodeURIComponent(term) : "null";
      let url = `${BASE_URL}/StockCycleCount/GetAllStockCycleCount?SkipCount=${skip}&MaxResultCount=${size}&Search=${searchParam}`;
      if (statusVal != null) {
        url += `&status=${statusVal}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setCycleCountList([]);
        setTotalCount(0);
        return;
      }
      const data = await response.json();
      const result = data?.result;
      if (result?.items) {
        setCycleCountList(result.items);
        setTotalCount(result.totalCount ?? result.items.length);
      } else if (result?.result?.items) {
        setCycleCountList(result.result.items);
        setTotalCount(result.result.totalCount ?? result.result.items.length);
      } else {
        setCycleCountList([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error(err);
      setCycleCountList([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    const statusVal = statusTabs[tabValue]?.value ?? null;
    fetchCycleCountList(1, value, pageSize, statusVal);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    const statusVal = statusTabs[tabValue]?.value ?? null;
    fetchCycleCountList(value, search, pageSize, statusVal);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    const statusVal = statusTabs[tabValue]?.value ?? null;
    fetchCycleCountList(1, search, size, statusVal);
  };

  const openPrintPopup = (item) => {
    const query = new URLSearchParams({
      id: String(item.id ?? ""),
      documentNumber: item.documentNo ?? "",
    });
    window.open(
      `/inventory/stock-cycle-count/print?${query.toString()}`,
      `scc-print-${item.id}`,
      "popup=yes,width=1200,height=900,scrollbars=yes,resizable=yes"
    );
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
    const statusVal = statusTabs[newValue]?.value ?? null;
    fetchCycleCountList(1, search, pageSize, statusVal);
  };

  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/EnumLookup/ActivityStatuses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data?.result && typeof data.result === "object") {
          setStatusLabels(data.result);
          const tabs = Object.entries(data.result).map(([value, label]) => ({
            value: Number(value),
            label,
          }));
          setStatusTabs(tabs);
        }
      } catch (err) {
        console.error("Failed to load status options:", err);
      }
    };
    fetchStatusOptions();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && statusTabs.length > 0) {
      const statusVal = statusTabs[tabValue]?.value ?? null;
      fetchCycleCountList(page, search, pageSize, statusVal);
    }
  }, [statusTabs.length]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Cycle Count</h1>
        <ul>
          <li>
            <Link href="/inventory/stock-cycle-count">Stock Cycle Count</Link>
          </li>
        </ul>
      </div>
      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid
          item
          xs={12}
          lg={8}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 2 }}
        >
          {create ? (
            <Button variant="outlined" onClick={() => navigateToCreate()}>
              + Add New
            </Button>
          ) : (
            ""
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              {statusTabs.map((tab, idx) => (
                <Tab key={idx} label={tab.label} />
              ))}
            </Tabs>
          </Box>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && cycleCountList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        Loading...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : cycleCountList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="error">
                        No Stock Cycle Count Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  cycleCountList.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.documentNo || "-"}</TableCell>
                      <TableCell>
                        {item.startDate
                          ? formatDate(item.startDate)
                          : formatDate(item.createdOn)}
                      </TableCell>
                      <TableCell>
                        {item.endDate ? formatDate(item.endDate) : "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[item.status] ?? item.status ?? "-"}
                          size="small"
                          color={getStatusColor(item.status)}
                        />
                      </TableCell>
                      <TableCell>{item.remark || "-"}</TableCell>
                      <TableCell align="right">
                        {(statusLabels[item.status] ?? "").toLowerCase() === "completed" ? (
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              onClick={() => openPrintPopup(item)}
                              aria-label="print"
                            >
                              <PrintIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() =>
                                router.push(
                                  `/inventory/stock-cycle-count/edit?id=${item.id}`
                                )
                              }
                              aria-label="edit"
                            >
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil((totalCount || 0) / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handlePageSizeChange}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
};

export default StockCycleCount;
