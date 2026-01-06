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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Modal, Box, Tooltip, IconButton } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";
import IsDayEndDone from "@/components/utils/IsDayEndDone";
import IsDailyDepositDone from "@/components/utils/IsDailyDepositDone";
import { Report } from "Base/report";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";

export default function DailyDeposits() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [deposits, setDeposits] = useState([]);
  const [lineItems, setLineItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState("");
  const [selectedTotal, setSelectedTotal] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();
  const { refetch: refetchDayEndDone } = IsDayEndDone();
  const { refetch: refetchDailyDepositDone } = IsDailyDepositDone();
  const name = localStorage.getItem("name");
  const { data: ReportName } = GetReportSettingValueByName("DailyDeposit");
  const handleClose = () => setOpen(false);
  const handleOpen = async (item) => {
    await setLineItems(item.dailyDepositLineDetails);
    setSelectedTotal(item.totalAmount);
    setSelectedDocument(item.documentNo);
    setOpen(true);
  };
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchDepositList(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchDepositList(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchDepositList(1, searchTerm, newSize);
  };

  const fetchDepositList = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/DailyDeposit/GetAllDailyDeposits?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setDeposits(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchDepositList();
  }, []);

  const navigateToCreate = async () => {
    // const latestDayEndDone = await refetchDayEndDone();

    // if (!latestDayEndDone) {
    //   toast.warning("Please Complete Day End First");
    //   return;
    // }

    router.push({
      pathname: "/sales/deposit/create",
    });
  };

  if (!navigate) {
      return <AccessDenied />;
    }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Daily Deposits</h1>
        <ul>
          <li>
            <Link href="/sales/deposits/">Daily Deposits</Link>
          </li>
        </ul>
      </div>
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
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + New
          </Button> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Document No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total Amount</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color="error">No Data Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deposits.map((item, index) => {
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{formatDate(item.createdOn)}</TableCell>
                        <TableCell>
                          {formatCurrency(item.totalAmount)}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            <Button onClick={() => handleOpen(item)} size="small">Details</Button>
                            {print ? <Tooltip title="Print" placement="top">
                              <a href={`${Report}` + reportLink} target="_blank">
                                <IconButton aria-label="print" size="small">
                                  <LocalPrintshopIcon color="primary" fontSize="medium" />
                                </IconButton>
                              </a>
                            </Tooltip> : ""}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
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

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box sx={{ height: '50vh', overflowY: 'scroll' }}>
            <Grid container>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <Typography variant="h6">Details</Typography>
                <Typography variant="h6">{selectedDocument || ""}</Typography>
              </Grid>
              <Grid item xs={12}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Supplier</TableCell>
                        <TableCell>Bank Details</TableCell>
                        <TableCell>Bank Account No</TableCell>
                        <TableCell>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>{item.bankId}</TableCell>
                          <TableCell>{item.bankAccountNumber}</TableCell>
                          <TableCell>{item.amount}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={4}>Total</TableCell>
                        <TableCell>{formatCurrency(selectedTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
          <Button variant="outlined" onClick={handleClose}>
            <Typography sx={{ fontWeight: "bold" }}>Close</Typography>
          </Button>
        </Box>
      </Modal>
    </>
  );
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 700, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};
