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
import { Pagination, FormControl, InputLabel, MenuItem, Select, Button, Box, Tooltip, Typography, IconButton, Chip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { Report } from "Base/report";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";
import { Catelogue } from "Base/catelogue";

export default function MaterialIssuedNotes() {
  const router = useRouter();
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const name = localStorage.getItem("name");
  const { data: ReportName } = GetReportSettingValueByName("MaterialIssuedNote");

  const {
    data: issuedNotes,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchIssuedNotes,
  } = usePaginatedFetch("MaterialIssuedNote/GetAllMaterialIssuedNotes");

  const controller = "MaterialIssuedNote/DeleteMaterialIssuedNote";

  const [issuedNotesList, setIssuedNotesList] = React.useState([]);

  React.useEffect(() => {
    if (issuedNotes && issuedNotes.length > 0) {
      setIssuedNotesList(issuedNotes);
    }
  }, [issuedNotes]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchIssuedNotes(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchIssuedNotes(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchIssuedNotes(1, search, size);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const navigateToCreate = () => {
    router.push({
      pathname: "/manufacture/material-issued-note/create",
    });
  };

  const navigateToEdit = (id) => {
    router.push({
      pathname: `/manufacture/material-issued-note/edit`,
      query: { id: id },
    });
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 1:
        return <Chip label="Pending" color="warning" size="small" />;
      case 2:
        return <Chip label="Approved" color="success" size="small" />;
      case 3:
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return "-";
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Material Issued Note</h1>
        <ul>
          <li>
            <Link href="/manufacture/material-issued-note/">Material Issued Note</Link>
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
          {create ? <Button variant="outlined" onClick={() => navigateToCreate()}>
            + Add New
          </Button> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>                  
                  <TableCell>Note No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issuedNotesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="error">
                        No Material Issued Note Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  issuedNotesList.map((item, index) => {
                    const canEditDelete = item.status === 1;
                    return (
                      <TableRow key={index}>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{item.projectName || "-"}</TableCell>
                        <TableCell>{item.warehouseName || "-"}</TableCell>
                        <TableCell>{item.referenceNo}</TableCell>
                        <TableCell>{item.remark || "-"}</TableCell>
                        <TableCell>{item.assignedUserName || "-"}</TableCell>
                        <TableCell>
                          <Box>
                            {getStatusDisplay(item.status)}
                            {item.status === 3 && item.statusRemark && (
                              <Typography sx={{ mt: 0.5, fontSize: "12px", color: "error.main" }}>
                                {item.statusRemark}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.createdOn ? formatDate(item.createdOn) : "-"}
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            {print ? (() => {
                              const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId || 0}&currentUser=${name}`;
                              return (
                                <Tooltip title="Print" placement="top">
                                  <a href={`${Report}` + reportLink} target="_blank" rel="noopener noreferrer">
                                    <IconButton aria-label="print" size="small">
                                      <LocalPrintshopIcon color="primary" fontSize="medium" />
                                    </IconButton>
                                  </a>
                                </Tooltip>
                              );
                            })() : ""}
                            {update && canEditDelete ? (
                              <Tooltip title="Edit" placement="top">
                                <IconButton onClick={() => navigateToEdit(item.id)} aria-label="edit" size="small">
                                  <BorderColorIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              update && (
                                <Tooltip title="Edit" placement="top">
                                  <span>
                                    <IconButton disabled aria-label="edit" size="small">
                                      <BorderColorIcon fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            )}
                            {remove && canEditDelete ? (
                              <DeleteConfirmationById
                                id={item.id}
                                controller={controller}
                                fetchItems={fetchIssuedNotes}
                              />
                            ) : (
                              remove && (
                                <Tooltip title="Delete" placement="top">
                                  <span>
                                    <IconButton disabled aria-label="delete" size="small">
                                      <DeleteIcon fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              )
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
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

