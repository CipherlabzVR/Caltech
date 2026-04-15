import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import AddFiscalPeriod from "./AddFiscalPeriod";
import EditFiscalPeriod from "./EditFiscalPeriod";
import GetAllCompanies from "@/components/utils/GetAllCompanies";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";
import { getMonth } from "@/components/types/types";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";

export default function FiscalPeriod() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: periods,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchFiscalPeriods,
  } = usePaginatedFetch("Fiscal/GetAllFiscalPeriodsPage", "", 10, false, false);

  const controller = "Fiscal/DeleteFiscalPeriod";
  const { data: companyList } = GetAllCompanies();
  const { data: warehouseList } = GetAllWarehouse();
  const [companyInfo, setCompanyInfo] = useState({});
  const [warehouseInfo, setWarehouseInfo] = useState({});

  useEffect(() => {
    if (companyList) {
      const companyMap = companyList.reduce((acc, company) => {
        acc[company.id] = company;
        return acc;
      }, {});
      setCompanyInfo(companyMap);
    }
    if (warehouseList) {
      const warehouseMap = warehouseList.reduce((acc, warehouse) => {
        acc[warehouse.id] = warehouse;
        return acc;
      }, {});
      setWarehouseInfo(warehouseMap);
    }
  }, [companyList, warehouseList]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchFiscalPeriods(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchFiscalPeriods(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchFiscalPeriods(1, search, size);
  };



  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Fiscal Periods</h1>
        <ul>
          <li>
            <Link href="/administrator/fiscal-periods/">Fiscal Periods</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <ToastContainer />
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
          {create ? <AddFiscalPeriod
            fetchItems={fetchFiscalPeriods}
            warehouses={warehouseList}
            companies={companyList}
          /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Fiscal Year</TableCell>
                  <TableCell>Fiscal Month</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Display Title</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!periods || periods.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={9}>
                      <Typography color="error">
                        No Fiscal Periods Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  periods.map((period, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>{period.fiscalYear}</TableCell>
                      <TableCell>{getMonth(period.fiscalMonth)}</TableCell>
                      <TableCell>{formatDate(period.startDate)}</TableCell>
                      <TableCell>{formatDate(period.endDate)}</TableCell>
                      <TableCell>{period.displayTitle}</TableCell>
                      <TableCell>
                        {companyInfo[period.companyId]
                          ? `${companyInfo[period.companyId].code} - ${companyInfo[period.companyId].name
                          }`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {warehouseInfo[period.warehouseId]
                          ? `${warehouseInfo[period.warehouseId].code} - ${warehouseInfo[period.warehouseId].name
                          }`
                          : "-"}
                      </TableCell>
                      <TableCell align="right" display="flex" gap={2}>
                        {!period.endDate && (
                          update ? (
                            <EditFiscalPeriod
                              item={period}
                              fetchItems={fetchFiscalPeriods}
                              warehouses={warehouseList}
                              companies={companyList}
                            />
                          ) : null
                        )}

                        {remove ? <DeleteConfirmationById
                          id={period.id}
                          controller={controller}
                          fetchItems={fetchFiscalPeriods}
                        /> : ""}
                      </TableCell>
                    </TableRow>
                  ))
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
}
