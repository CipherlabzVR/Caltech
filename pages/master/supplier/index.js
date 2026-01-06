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
import AddSupplier from "pages/master/supplier/AddSupplier";
import { FormControl, InputLabel, MenuItem, Pagination, Select, Typography } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import EditSupplier from "pages/master/supplier/EditSupplier";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import useApi from "@/components/utils/useApi";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";

export default function Supplier() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [banks, setBanks] = useState([]);
  const controller = "Supplier/DeleteSupplier";
  const [isPOSSystem, setIsPOSSystem] = useState(false);
  const { data: isSettingEnabled } = IsAppSettingEnabled(`IsPosSystem`);
  const { data: isBankAccountRequiredToSupplier } = IsAppSettingEnabled(`IsBankAccountRequiredToSupplier`);
  const { data: warehouseList } = GetAllWarehouse();
  const [warehouseInfo, setWarehouseInfo] = useState({});
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [chartOfAccInfo, setChartOfAccInfo] = useState({});
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  const {
    data: supplierList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSupplierList,
  } = usePaginatedFetch("Supplier/GetAll");

  useEffect(() => {
    if (isSettingEnabled) {
      setIsPOSSystem(isSettingEnabled);
    }
  }, [isSettingEnabled]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchSupplierList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchSupplierList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSupplierList(1, search, size);
  };

  useEffect(() => {
    if (warehouseList) {
      const warehouseMap = warehouseList.reduce((acc, warehouse) => {
        acc[warehouse.id] = warehouse;
        return acc;
      }, {});
      setWarehouseInfo(warehouseMap);
    }
    if (accountList) {
      const accMap = accountList.reduce((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});
      setChartOfAccInfo(accMap);
      setChartOfAccounts(accountList);
    }
  }, [warehouseList, accountList]);

  const fetchBanks = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Bank/GetAllBanks`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setBanks(data.result);
    } catch (error) {
      console.error("Error fetching:", error);
    }
  };


  useEffect(() => {
    fetchBanks();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Supplier</h1>
        <ul>
          <li>
            <Link href="/master/supplier/">Supplier</Link>
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
          {create ? <AddSupplier
            fetchItems={fetchSupplierList}
            isPOSSystem={isPOSSystem}
            isBankRequired={isBankAccountRequiredToSupplier}
            banks={banks}
            chartOfAccounts={chartOfAccounts}
          /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Supplier Name</TableCell>
                  <TableCell>Mobile No</TableCell>
                  {isPOSSystem && (
                    <>
                      <TableCell>Email</TableCell>
                      <TableCell>Warehouse</TableCell>
                    </>
                  )}
                  {isBankAccountRequiredToSupplier && (
                    <TableCell>Bank</TableCell>
                  )}
                  <TableCell>Payable Acc</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplierList.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={7} component="th" scope="row">
                      <Typography color="error">
                        No Suppliers Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  supplierList.map((supplier, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {supplier.name}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {supplier.mobileNo}
                      </TableCell>
                      {isPOSSystem && (
                        <>
                          <TableCell component="th" scope="row">
                            {supplier.email}
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {warehouseInfo[supplier.warehouseId]
                              ? `${warehouseInfo[supplier.warehouseId].code
                              } - ${warehouseInfo[supplier.warehouseId].name}`
                              : "All Warehouses"}
                          </TableCell>
                        </>
                      )}
                      {isBankAccountRequiredToSupplier && (
                        <TableCell>{supplier.bankName} - {supplier.bankAccountNo}</TableCell>
                      )}
                      <TableCell>{chartOfAccInfo[supplier.payableAccount]?.code || "-"} - {chartOfAccInfo[supplier.payableAccount]?.description || "-"}</TableCell>
                      <TableCell component="th" scope="row">
                        {formatDate(supplier.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {supplier.isActive == true ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? <EditSupplier
                          fetchItems={fetchSupplierList}
                          item={supplier}
                          isPOSSystem={isPOSSystem}
                          isBankRequired={isBankAccountRequiredToSupplier}
                          banks={banks}
                          chartOfAccounts={chartOfAccounts}
                        /> : ""}
                        {remove ? <DeleteConfirmationById
                          id={supplier.id}
                          controller={controller}
                          fetchItems={fetchSupplierList}
                        /> : ""}
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
