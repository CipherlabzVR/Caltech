import React from "react";
import Grid from "@mui/material/Grid";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import CreditNoteReport from "@/components/UIElements/Modal/Reports/CreditNote";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import useShiftCheck from "@/components/utils/useShiftCheck";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";

const CNN = () => {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const router = useRouter();
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const name = typeof window !== 'undefined' ? localStorage.getItem("name") : "";
  const { data: ReportName } = GetReportSettingValueByName("CustomerCreditDebitNote");

  const {
    data: invoice,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchCCNList,
  } = usePaginatedFetch("CreditNote/GetAllCreditNotePage", "", 10, false, false);

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({
      pathname: "/sales/credit-note/create-credit-note",
    });
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchCCNList(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchCCNList(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchCCNList(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Customer Notes</h1>
        <ul>
          <li>
            <Link href="/sales/credit-note">Customer Notes</Link>
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
          {create ? <Button variant="outlined" onClick={navigateToCreate}>
            + Add New
          </Button> : ""}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Document Number</TableCell>
                  <TableCell>Credit/Debit</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Sales Person Name</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!invoice || invoice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">
                        No Customer Notes Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoice.map((item, index) => {
                    const sign = item.noteType === "Credit" ? "+" : "-";
                    const formattedAmount = formatCurrency(item.amount);
                    return (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{item.documentNo}</TableCell>
                      <TableCell>{item.noteType}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{sign}{formattedAmount}</TableCell>
                      <TableCell>{formatDate(item.date)}</TableCell>
                      <TableCell>{item.salesPersonName}</TableCell>
                      <TableCell>{item.remark || "-"}</TableCell>
                      <TableCell align="right">
                        {print ?
                          //<CreditNoteReport note={item} />
                          <Tooltip title="Print" placement="top">
                            <a
                              href={`${Report}/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`}
                              target="_blank"
                            >
                              <IconButton aria-label="print" size="small">
                                <LocalPrintshopIcon color="primary" fontSize="inherit" />
                              </IconButton>
                            </a>
                          </Tooltip>
                          : ""}
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handleChangeRowsPerPage}
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

export default CNN;