import styles from "@/styles/PageTitle.module.css";
import React from "react";
import { ToastContainer } from "react-toastify";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
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
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import CreateOTTypeModal from "./create";
import EditOTType from "./edit";

const Index = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: OTTypeList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchOTTypeList,
  } = usePaginatedFetch("OTType/GetAllOTType");

  const controller = "OTType/DeleteOTType";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchOTTypeList(1, event.target.value, pageSize);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchOTTypeList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchOTTypeList(1, search, size);
  };

  // const handleCreated = () => {
  //   handlePageChange({}, 1);
  // };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>OT Type</h1>
        <ul>
          <li>
            <Link href="/master/ot-type/">OT Type</Link>
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
          {create ? <CreateOTTypeModal fetchItems={fetchOTTypeList} /> : ""}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Is Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {OTTypeList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">
                        No OT Type Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  OTTypeList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditOTType
                            fetchItems={fetchOTTypeList}
                            item={item}
                          />
                        ) : (
                          ""
                        )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchOTTypeList}
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
};

export default Index;
