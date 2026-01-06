import React, { } from "react";
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
import LocalPrintshopIcon from "@mui/icons-material/LocalPrintshop";
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, IconButton, Tooltip } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import StatusType from "pages/production/ongoing/Types/StatusType";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";
import GetReportSettingValueByName from "@/components/utils/GetReportSettingValueByName";

export default function ShipmentNote() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const name = localStorage.getItem("name");
  const { data: ReportName } = GetReportSettingValueByName("ShipmentNote");

  const {
    data: shipmentList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchShipmentList,
  } = usePaginatedFetch("ShipmentNote/GetAll");


  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchShipmentList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchShipmentList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchShipmentList(1, search, size);
  };

  const router = useRouter();

  const navigateToCreate = () => {
    router.push({
      pathname: "/inventory/shipment/create-shipment",
    });
  };

  const navigateToEdit = (id) => {
    router.push({
      pathname: `/inventory/shipment/edit-shipment`,
      query: { id: id },
    });
  };


  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shipment Note</h1>
        <ul>
          <li>
            <Link href="/inventory/shipment/">Shipment Note</Link>
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
                  <TableCell>Shipment Date</TableCell>
                  <TableCell>Shipment No</TableCell>
                  <TableCell>PO No.</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipmentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">
                        No Shipment Notes Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  shipmentList.map((item, index) => {
                    const reportLink = `/PrintDocumentsLocal?InitialCatalog=${Catelogue}&documentNumber=${item.documentNo}&reportName=${ReportName}&warehouseId=${item.warehouseId}&currentUser=${name}`;
                    return (
                      <TableRow key={index}>
                        <TableCell>{formatDate(item.shipmentDate)}</TableCell>
                        <TableCell>{item.documentNo}</TableCell>
                        <TableCell>
                          {item.shipmentNoteLineDetails && (
                            [...new Set(item.shipmentNoteLineDetails.map(no => no.purchaseOrderNo))]
                              .join(', ')
                          )}
                        </TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.referanceNo}</TableCell>
                        <TableCell>{item.remark}</TableCell>
                        <TableCell>
                          <StatusType type={item.status} />
                        </TableCell>
                        <TableCell align="right">
                          {item.status != 7 ? (
                            update ? (
                              <Tooltip title="Edit" placement="top">
                                <IconButton
                                  onClick={() => navigateToEdit(item.id)}
                                  aria-label="edit"
                                  size="small"
                                >
                                  <BorderColorIcon color="primary" fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            ) : null
                          ) : (
                            print ?
                              <>
                                {/* <ShipmentReport shipment={item} />  */}
                                <Tooltip title="Print" placement="top">
                                  <a href={`${Report}` + reportLink} target="_blank">
                                    <IconButton aria-label="print" size="small">
                                      <LocalPrintshopIcon color="primary" fontSize="medium" />
                                    </IconButton>
                                  </a>
                                </Tooltip>
                              </>
                              : null
                          )}
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