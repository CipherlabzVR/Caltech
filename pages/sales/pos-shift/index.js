import React, { useEffect, useState } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Tooltip, IconButton, Box } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import AddShift from "./create";
import EditShift from "./edit";
import { formatCurrency, formatDateWithTime } from "@/components/utils/formatHelper";
import ViewShift from "./view-denomination";
import { Report } from "Base/report";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import CashInOut from "./create-cash-in-out";
import ViewCashInOut from "./view-cash-in-out";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";

export default function POSShift() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [shifts, setShifts] = useState([]);
  const [searchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [activeShiftId, setActiveShiftId] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { data: ReportName } = GetReportSettingValueByName("ShiftEndReport");
  const name = localStorage.getItem("name");


  const handlePageChange = (event, value) => {
    setPage(value);
    fetchShifts(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchShifts(1, searchTerm, newSize);
  };

  const fetchShifts = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/POSShift/GetAllShift?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setShifts(data.result.items);
      setTotalCount(data.result.totalCount || 0);


    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  useEffect(() => {
    const activeShift = shifts.find(shift => shift.isActive === true);
    if (activeShift) {
      setActiveShiftId(activeShift.id);
    } else {
      setActiveShiftId(null);
    }
  }, [shifts]);

  if (!navigate) {
    return <AccessDenied />;
  }
  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>POS Shift</h1>
        <ul>
          <li>
            <Link href="/sales/pos-shift/">POS Shift</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} mb={1} display="flex" gap={1}>
          {create ? <AddShift fetchItems={fetchShifts} /> : ""}
          {activeShiftId == null ? "" :
            <CashInOut fetchItems={fetchShifts} shiftId={activeShiftId} />
          }
        </Grid>
        <Grid item xs={12} >
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Shift Code</TableCell>
                  <TableCell>Terminal</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Start Amount</TableCell>
                  <TableCell>End Amount</TableCell>
                  <TableCell>Invoice Total</TableCell>
                  <TableCell>Cash Inv. Total</TableCell>
                  <TableCell>Cash In/Out</TableCell>
                  <TableCell>Variance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11}>
                      <Typography color="error">No Shift Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.terminalCode}</TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.createdUser}</TableCell>
                      <TableCell>{formatDateWithTime(item.startDate)}</TableCell>
                      <TableCell>{!item.isActive && formatDateWithTime(item.endDate)}</TableCell>
                      <TableCell>{formatCurrency(item.totalStartAmount)}</TableCell>
                      <TableCell>{!item.isActive && formatCurrency(item.totalEndAmount)}</TableCell>
                      <TableCell>{!item.isActive && formatCurrency(item.totalInvoice)}</TableCell>
                      <TableCell>{!item.isActive && formatCurrency(item.totalCashInvoice)}</TableCell>
                      <TableCell>
                        <ViewCashInOut fetchItems={fetchShifts} shift={item} />
                      </TableCell>
                      <TableCell>
                        {item.variance < 0 ? (
                          <span className="dangerBadge">Short /{item.variance} </span>
                        ) : item.variance > 0 ? (
                          <span className="successBadge">Excess /{item.variance}</span>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Ended</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="end" gap={1}>

                          <ViewShift shiftId={item.id} isShiftEnd={item.isActive} />
                          {item.isActive ? (
                            update ? (
                              <EditShift fetchItems={fetchShifts} item={item} />
                            ) : null
                          ) : (
                            print ? (
                              <Tooltip title="Print" placement="top">
                                <a
                                  href={`${Report}/PrintShiftEndLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`}
                                  target="_blank"
                                >
                                  <IconButton aria-label="print" size="small">
                                    <LocalPrintshopIcon color="primary" fontSize="inherit" />
                                  </IconButton>
                                </a>
                              </Tooltip>
                            ) : null
                          )}
                        </Box>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
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
