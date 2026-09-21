import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tabs, Tab } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddChartOfAccounts from "./create";
import EditChartOfAccounts from "./edit";
import { ChartOfAccountType } from "@/components/types/types";

const GROUP_TYPES = ["Asset", "Liability", "Equity", "Income", "Expense"];
const FETCH_MAX = 5000;

export default function ChartOfAccounts() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const controller = "ChartOfAccount/DeleteChartOfAccount";

  const [tabIndex, setTabIndex] = useState(0);
  const [accountGroups, setAccountGroups] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageBeforeSearchRef = useRef(1);

  const accountTypeToGroup = useMemo(() => {
    const map = {};
    accountGroups.forEach((group) => {
      (group.subTypes || []).forEach((sub) => {
        map[sub.accountType] = group.groupType;
      });
    });
    return map;
  }, [accountGroups]);

  const activeGroupType = GROUP_TYPES[tabIndex] || GROUP_TYPES[0];

  const activeGroupSubTypes = useMemo(() => {
    const group = accountGroups.find((g) => g.groupType === activeGroupType);
    return group?.subTypes || [];
  }, [accountGroups, activeGroupType]);

  const fetchAccountTypeGroups = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/ChartOfAccount/GetAccountTypeGroups`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch account type groups");
      const data = await response.json();
      setAccountGroups(Array.isArray(data.result) ? data.result : []);
    } catch (error) {
      console.error("Error fetching account type groups:", error);
    }
  }, []);

  const fetchChartOfAccounts = useCallback(async (search = "") => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/ChartOfAccount/GetAllChartOfAccounts?SkipCount=0&MaxResultCount=${FETCH_MAX}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setAllAccounts(data.result?.items || []);
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  const filteredAccounts = useMemo(() => {
    const parseCode = (code) => {
      const numeric = Number.parseInt(code, 10);
      return Number.isNaN(numeric) ? Number.MAX_SAFE_INTEGER : numeric;
    };

    return allAccounts
      .filter((item) => accountTypeToGroup[item.accountType] === activeGroupType)
      .sort((a, b) => parseCode(a.code) - parseCode(b.code));
  }, [allAccounts, accountTypeToGroup, activeGroupType]);

  const totalCount = filteredAccounts.length;

  const paginatedAccounts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAccounts.slice(start, start + pageSize);
  }, [filteredAccounts, page, pageSize]);

  useEffect(() => {
    fetchAccountTypeGroups();
    fetchChartOfAccounts("");
  }, [fetchAccountTypeGroups, fetchChartOfAccounts]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(totalCount / pageSize) || 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [totalCount, pageSize, page]);

  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    const wasEmpty = !searchTerm.trim();
    const isEmpty = !value.trim();

    if (wasEmpty && !isEmpty) {
      pageBeforeSearchRef.current = page;
    }

    let targetPage = page;
    if (!isEmpty) {
      targetPage = 1;
    } else if (!wasEmpty) {
      targetPage = pageBeforeSearchRef.current;
    }

    setSearchTerm(value);
    setPage(targetPage);
    fetchChartOfAccounts(value);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    const maxPage = Math.max(1, Math.ceil(totalCount / size) || 1);
    setPageSize(size);
    setPage((current) => Math.min(current, maxPage));
  };

  const handleRefresh = () => {
    fetchChartOfAccounts(searchTerm);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Chart of Accounts</h1>
        <ul>
          <li>
            <Link href="/finance/chart-of-account/">Chart of Accounts</Link>
          </li>
        </ul>
      </div>

      <Tabs value={tabIndex} onChange={handleTabChange} sx={{ mb: 2 }}>
        {GROUP_TYPES.map((label) => (
          <Tab key={label} label={label} />
        ))}
      </Tabs>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? (
            <AddChartOfAccounts
              fetchItems={handleRefresh}
              activeGroupType={activeGroupType}
              subTypes={activeGroupSubTypes}
            />
          ) : (
            ""
          )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Bank Involved</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="error">
                        No Chart of Accounts Available for {activeGroupType}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedAccounts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.isBankInvolved ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>{ChartOfAccountType(item.accountType)}</TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditChartOfAccounts fetchItems={handleRefresh} item={item} />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={handleRefresh}
                          />
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
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
}
