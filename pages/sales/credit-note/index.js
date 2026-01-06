import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Tooltip,
  IconButton,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
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
  const [invoice, setInvoice] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const { result: shiftResult, message: shiftMessage } = useShiftCheck();
  const name = localStorage.getItem("name");
  const { data: ReportName } = GetReportSettingValueByName("CustomerCreditDebitNote");

  const navigateToCreate = () => {
    if (shiftResult) {
      toast.warning(shiftMessage);
      return;
    }
    router.push({
      pathname: "/sales/credit-note/create-credit-note",
    });
  };

  const {
    data: ccnList,
    loading: Loading,
    error: Error,
  } = useApi("/CreditNote/GetAllCreditNote");

  useEffect(() => {
    if (ccnList) {
      setInvoice(ccnList);
    }
  }, [ccnList]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const filteredData = invoice.filter(
    (item) =>
      (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.documentNo && item.documentNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

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
              value={searchTerm}
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
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="error">
                        No Customer Notes Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => {
                    const sign = item.noteType === "Credit" ? "+" : "-";
                    const formattedAmount = formatCurrency(item.amount);
                    return (
                    <TableRow key={item.id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
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
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
};

export default CNN;