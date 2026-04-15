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
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import EditSetting from "pages/administrator/settings/EditSetting";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import AddWarehouse from "./AddWarehouse";
import EditWarehouse from "./EditWarehouse";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import GetAllCompanies from "@/components/utils/GetAllCompanies";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";

export default function Warehouse() {
  const cId = sessionStorage.getItem("category")
    const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: warehouses,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchWarehouses,
  } = usePaginatedFetch("Warehouse/GetAllWarehousePage", "", 10, false, false);

  const [companies, setCompanies] = useState([]);
  const controller = "Warehouse/DeleteWarehouse";
  const { data: companyList } = GetAllCompanies();
  const [companyInfo, setCompanyInfo] = useState({});

  useEffect(() => {
    if (companyList) {
      const companyMap = companyList.reduce((acc, company) => {
        acc[company.id] = company;
        return acc;
      }, {});
      setCompanyInfo(companyMap);
      setCompanies(companyList);
    }
  }, [companyList]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchWarehouses(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchWarehouses(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchWarehouses(1, search, size);
  };



  if (!navigate) {
      return <AccessDenied />;
    }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Warehouses</h1>
        <ul>
          <li>
            <Link href="/warehouse">Warehouses</Link>
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
          {create ? <AddWarehouse fetchItems={fetchWarehouses} companies={companies} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Warehouse Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Contact Person</TableCell>
                  <TableCell>Contact No</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!warehouses || warehouses.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={7}>
                      <Typography color="error">
                        No Warehouses Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  warehouses.map((warehouse, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>{warehouse.name}</TableCell>
                      <TableCell>{warehouse.code}</TableCell>
                      <TableCell>{warehouse.contactPerson}</TableCell>
                      <TableCell>
                        {warehouse.contactNumber}
                        {warehouse.contactNumber2
                          ? ` /${warehouse.contactNumber2}`
                          : ""}
                        {warehouse.contactNumber3
                          ? ` /${warehouse.contactNumber3}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {warehouse.addressLine1}
                        {warehouse.addressLine2
                          ? ` ,${warehouse.addressLine2}`
                          : ""}
                        {warehouse.addressLine3
                          ? ` ,${warehouse.addressLine3}`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {warehouse.email1}
                        {warehouse.email2 ? ` /${warehouse.email2}` : ""}
                      </TableCell>
                      <TableCell>
                        {companyInfo[warehouse.companyId]
                          ? `${companyInfo[warehouse.companyId].code} - ${
                              companyInfo[warehouse.companyId].name
                            }`
                          : "-"}
                      </TableCell>
                      <TableCell>{warehouse.description}</TableCell>
                      <TableCell align="right" display="flex" gap={2}>
                        {update ? <EditWarehouse
                          item={warehouse}
                          fetchItems={fetchWarehouses}
                          companies={companies}
                        /> : ""}

                        {remove ? <DeleteConfirmationById
                          id={warehouse.id}
                          controller={controller}
                          fetchItems={fetchWarehouses}
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
