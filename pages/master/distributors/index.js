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
import {
  Pagination,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import AddDistributorDialog from "./create";
import EditDistributorDialog from "./edit";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";

export default function Distributors() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [warehouseInfo, setWarehouseInfo] = useState({});
  const { data: warehouseList } = GetAllWarehouse();

  const controller = "Distributor/DeleteDistributor";

  const {
    data: distributorList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchDistributorList,
  } = usePaginatedFetch("Distributor/GetAllDistributors", "", 10, true, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchDistributorList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchDistributorList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchDistributorList(1, search, size);
  };

  useEffect(() => {
    if (warehouseList) {
      const warehouseMap = warehouseList.reduce((acc, warehouse) => {
        acc[warehouse.id] = warehouse;
        return acc;
      }, {});
      setWarehouseInfo(warehouseMap);
    }
  }, [warehouseList]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Distributors</h1>
        <ul>
          <li>
            <Link href="/master/Distributor/">Distributors</Link>
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
          <AddDistributorDialog
            fetchItems={() => {
              setPage(1);
              fetchDistributorList(1, search, pageSize);
            }}
          />
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile No</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {distributorList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">
                        No Distributors Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  distributorList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.code || ""}</TableCell>
                      <TableCell>{item.name || ""}</TableCell>
                      <TableCell>{item.mobileNo || ""}</TableCell>
                      <TableCell>
                        {item.warehouseId && warehouseInfo[item.warehouseId]
                          ? `${warehouseInfo[item.warehouseId].code} - ${warehouseInfo[item.warehouseId].name}`
                          : "All Warehouses"}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <EditDistributorDialog
                          fetchItems={fetchDistributorList}
                          item={item}
                        />
                        <DeleteConfirmationById
                          id={item.id}
                          controller={controller}
                          fetchItems={fetchDistributorList}
                        />
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
}
