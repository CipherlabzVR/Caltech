import React from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddCashFlowType from "./create";
import EditCashFlowType from "./edit";
import { getCashType } from "@/components/types/types";
import AddContact from "./create";

export default function Contacts() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: contacts,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchContacts,
  } = usePaginatedFetch("Contact/GetAllContacts");

  const controller = "Contact/DeleteContact";

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchContacts(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchContacts(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchContacts(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Contact</h1>
        <ul>
          <li>
            <Link href="/contact/contact/">Contact</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? <AddContact fetchItems={fetchContacts} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <Box display="flex" justifyContent="start" alignItems="center" mb={1} gap={1}>
            <Box
              component="span"
              sx={(theme) => ({
                width: 16,
                height: 16,
                backgroundColor: alpha(theme.palette.warning.main, 0.15),
                border: `0.5px solid ${theme.palette.warning.main,0.1}`,
              })}
            />
            <Typography variant="body2" color="text.secondary">
              Feedback
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={12} order={{ xs: 4, lg: 4 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone Number</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Package / Service</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error">No Data Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((item, index) => {
                    const createdDate = item.createdOn ? new Date(item.createdOn) : null;
                    return (
                      <TableRow
                        key={index}
                        hover
                        sx={(theme) =>
                          item.isFeedback
                            ? {
                                backgroundColor: alpha(theme.palette.warning.main, 0.15),
                                "&:hover": {
                                  backgroundColor: alpha(theme.palette.warning.main, 0.3),
                                },
                              }
                            : {}
                        }
                      >
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.phoneNumber}</TableCell>
                        <TableCell>{item.company}</TableCell>
                        <TableCell>{item.package}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{createdDate ? createdDate.toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{createdDate ? createdDate.toLocaleTimeString() : 'N/A'}</TableCell>
                        <TableCell align="right">
                          {update ? <EditCashFlowType item={item} fetchItems={fetchContacts} /> : ""}
                          {remove ? <DeleteConfirmationById id={item.id} controller={controller} fetchItems={fetchContacts} /> : ""}
                        </TableCell>
                      </TableRow>
                    )
                  })
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