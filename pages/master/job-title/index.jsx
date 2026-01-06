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
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { ToastContainer } from "react-toastify";
import BASE_URL from "Base/api";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import GetAllSuppliers from "@/components/utils/GetAllSuppliers";
import EditJobTitle from "./edit";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddJobTitle from "./create";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";


const Index = () => {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const { data: supplierList } = GetAllSuppliers();
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierInfo, setSupplierInfo] = useState({});
  
  const {
    data: JobTitleList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchJobTitleList,
  } = usePaginatedFetch("JobTitle/GetAllJobTitle");

  const controller = "JobTitle/DeleteJobTitle";

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchJobTitleList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchJobTitleList(1, search, size);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setSearch(event.target.value);
    fetchJobTitleList(1, event.target.value, pageSize);
  };

  useEffect(() => {
    if (supplierList) {
      // console.log("Supplier list loaded:", supplierList);
      const supplierMap = supplierList.reduce((acc, supplier) => {
        acc[supplier.id] = supplier;
        return acc;
      }, {});
      setSupplierInfo(supplierMap);
    } else {
      // console.log("Supplier list not loaded yet or empty");
    }
  }, [supplierList]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Job Title</h1>
        <ul>
          <li>
            <Link href="/master/job-title/">Job Title</Link>
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
           {create ? (
             <AddJobTitle
               fetchItems={fetchJobTitleList}
               suppliers={supplierList || []}
             />
           ) : (
             ""
           )}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  {/* <TableCell>Company</TableCell> */}
                  <TableCell>Description</TableCell>
                  <TableCell>Rank Order</TableCell>
                  <TableCell>IsActive</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {JobTitleList && JobTitleList.length > 0 ? (
                  JobTitleList.map((jobTitle, index) => (
                    <TableRow
                      key={jobTitle.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                     > 
                       <TableCell>{jobTitle.name}</TableCell>
                       {/* <TableCell>
                         {supplierInfo[jobTitle.supplierId]
                           ? supplierInfo[jobTitle.supplierId].name
                           : "-"}
                       </TableCell> */}
                       <TableCell>{jobTitle.description}</TableCell>
                      <TableCell>{jobTitle.rankOrder}</TableCell>
                      <TableCell>{jobTitle.isActive ? "Yes" : "No"}</TableCell>
                      <TableCell align="right">
                         {update ? (
                           <EditJobTitle
                             item={jobTitle}
                             fetchItems={fetchJobTitleList}
                             suppliers={supplierList || []}
                           />
                         ) : (
                           ""
                         )}
                        {remove ? (
                          <DeleteConfirmationById
                            id={jobTitle.id}
                            controller={controller}
                            fetchItems={fetchJobTitleList}
                          />
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                     <TableCell colSpan={6} component="th" scope="row">
                      <Typography color="error">
                        No Job Title Available
                      </Typography>
                    </TableCell>
                  </TableRow>
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
