import React, { useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  Pagination,
  InputLabel,
  MenuItem,
  Select,
  Chip,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { formatDate } from "@/components/utils/formatHelper";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import AddItemType from "./AddItemType";
import EditItemType from "./EditItemType";

const ItemTypeMaster = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const controller = "ItemType/DeleteItemType";

  const {
    data: itemTypeList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchItemTypeList,
  } = usePaginatedFetch("ItemType/GetAllItemTypePage");

  const handleSearchChange = (event) => {
    const val = event.target.value;
    setSearch(val);
    setPage(1);
    fetchItemTypeList(1, val, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchItemTypeList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchItemTypeList(1, search, size);
  };

  useEffect(() => {
    fetchItemTypeList();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Item Type</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Item Type</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12}>
          <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Grid item xs={12} md={6} lg={5} order={{ xs: 2, lg: 1 }}>
              <Search className="search-form" style={{ width: "100%" }}>
                <StyledInputBase
                  placeholder="Search here.."
                  inputProps={{ "aria-label": "search" }}
                  value={search}
                  onChange={handleSearchChange}
                />
              </Search>
            </Grid>
            <Grid display="flex" justifyContent="end" item xs={12} md={6} lg={7} order={{ xs: 1, lg: 2 }}>
              {create ? <AddItemType fetchItems={() => fetchItemTypeList()} /> : ""}
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Features</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!itemTypeList || itemTypeList.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} component="th" scope="row">
                      <Typography color="error">No Item Types Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  itemTypeList.map((it, index) => (
                    <TableRow key={index} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell>{it.name}</TableCell>
                      <TableCell>{it.description}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {(it.features || []).map((f) => (
                            <Chip
                              key={f.id}
                              size="small"
                              label={`${f.name} (${(f.options || []).length})`}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{formatDate(it.createdOn)}</TableCell>
                      <TableCell>
                        {it.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditItemType fetchItems={fetchItemTypeList} itemType={it} />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={it.id}
                            controller={controller}
                            fetchItems={fetchItemTypeList}
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
                count={Math.max(1, Math.ceil((totalCount || 0) / (pageSize || 10)))}
                page={page || 1}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "120px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize || 10} label="Page Size" onChange={handlePageSizeChange}>
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

export default ItemTypeMaster;
