import React from "react";
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
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import AddPackage from "./create";
import EditPackage from "./edit";
import { formatCurrency } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const CATEGORY_ID = 302;

export default function PhotographyPackageList() {
  const sessionCategory =
    typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const cId = sessionCategory ? parseInt(sessionCategory, 10) : CATEGORY_ID;
  const { navigate, create, update, remove } = IsPermissionEnabled(
    Number.isFinite(cId) ? cId : CATEGORY_ID
  );
  const controller = "PhotographyPackage/DeletePackage";

  const {
    data: list,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchList,
  } = usePaginatedFetch("PhotographyPackage/GetAllPackagePaged", "", 10, false, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchList(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchList(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchList(1, search, size);
  };

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>📦 Packages</h1>
        <ul>
          <li>
            <Link href="/photography/reservations/">Photography</Link>
          </li>
          <li>Packages</li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by name or category…"
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <AddPackage fetchItems={() => fetchList()} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="packages" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Event Type</TableCell>
                  <TableCell>Base Price</TableCell>
                  <TableCell>Recommended</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!list || list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No packages available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  list.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{(page - 1) * pageSize + index + 1}</TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.eventTypeName}</TableCell>
                      <TableCell>{formatCurrency(item.basePrice)}</TableCell>
                      <TableCell>
                        {item.isRecommended ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>{item.displayOrder}</TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? <EditPackage item={item} fetchItems={fetchList} /> : ""}
                        {remove ? (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchList}
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
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handleChangeRowsPerPage}>
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
