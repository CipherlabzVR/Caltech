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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AddOutlet from "./create";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { formatCurrency } from "@/components/utils/formatHelper";
import EditOutlet from "./edit";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function OutletNote() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [outletList, setOutletList] = useState([]);
  const controller = "Outlet/DeleteOutlet";
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled(
    "IsExpireDateAvailable"
  );
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled(
    "IsBatchNumberAvailable"
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    setPage(1);
    fetchOutlets(1, value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchOutlets(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchOutlets(1, searchTerm, newSize);
  };

  const fetchOutlets = async (page = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (page - 1) * size;
      const query = `${BASE_URL}/Outlet/GetAllOutlet?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setOutletList(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Outlet Note</h1>
        <ul>
          <li>
            <Link href="/inventory/outlet-note/">Outlet Note</Link>
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
          {create ? <AddOutlet fetchItems={fetchOutlets} isExpDateAvailable={IsExpireDateAvailable} isBatchAvailable={IsBatchNumberAvailable} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Product</TableCell>
                  {IsBatchNumberAvailable && (
                    <>
                      <TableCell>Batch No</TableCell>
                    </>
                  )}
                  {IsExpireDateAvailable && (
                    <>
                      <TableCell>Exp Date</TableCell>
                    </>
                  )}

                  <TableCell>Added Qty</TableCell>
                  <TableCell>Added Value</TableCell>
                  <TableCell>Available Value</TableCell>
                  <TableCell>Cost Price</TableCell>
                  <TableCell>Selling Price</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {outletList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography color="error">No Outlets Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  outletList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.productName}</TableCell>
                      {IsBatchNumberAvailable && (
                        <>
                          <TableCell>{item.batchNumber}</TableCell>
                        </>
                      )}
                      {IsExpireDateAvailable && (
                        <>
                          <TableCell>{item.expiryDate}</TableCell>
                        </>
                      )}

                      <TableCell>{item.addedQuantity}</TableCell>
                      <TableCell>{item.addedQuantityValue}</TableCell>
                      <TableCell>{item.currentQuantityValue}</TableCell>
                      <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                      <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
                      <TableCell>{item.supplierName}</TableCell>
                      <TableCell align="right">
                        {update ? <EditOutlet fetchItems={fetchOutlets} item={item} /> : ""}
                        {remove ? <DeleteConfirmationById id={item.id} controller={controller} fetchItems={fetchOutlets} /> : ""}
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
