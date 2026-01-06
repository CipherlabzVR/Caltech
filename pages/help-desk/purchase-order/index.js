import React, { useEffect } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Box,
  Pagination,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { toast } from "react-toastify";
import BASE_URL from "Base/api";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { Catelogue } from "Base/catelogue";
import IsFiscalPeriodAvailable from "@/components/utils/IsFiscalPeriodAvailable";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

export default function HelpDeskPurchaseOrder() {
  useEffect(() => {
    sessionStorage.setItem("category", "18"); // Purchase Order category
  }, []);

  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const router = useRouter();
  const { data: fiscalPeriodData } = IsFiscalPeriodAvailable();
  const isFiscalPeriodAvailable = fiscalPeriodData?.result === true || fiscalPeriodData === true;

  const navigateToCreate = () => {
    // Help Desk Purchase Orders don't require fiscal period check
    router.push("/help-desk/purchase-order/create");
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const navigateToEdit = (id) => {
    router.push(`/help-desk/purchase-order/edit?id=${id}`);
  };

  const {
    data: poList,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchPOList,
  } = usePaginatedFetch("HelpDesk/GetAllPurchaseOrders", "", 10, true, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
    fetchPOList(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchPOList(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchPOList(1, search, size);
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Purchase Order</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>
            <Link href="/help-desk/help-desk">Help Desk</Link>
          </li>
          <li>Purchase Order</li>
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
          {create ? (
            <Button 
              variant="outlined" 
              onClick={navigateToCreate}
            >
              + Add New
            </Button>
          ) : (
            ""
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>PO Date</TableCell>
                  <TableCell>PO No</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Reference No</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {poList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="error">
                        No Purchase Orders Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  poList.map((item, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell>{formatDate(item.poDate)}</TableCell>
                        <TableCell>{item.poNo}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.referenceNo || "N/A"}</TableCell>
                        <TableCell>{item.remark || "N/A"}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={1}>
                            {update ? (
                              <Tooltip title="Edit" placement="top">
                                <IconButton
                                  onClick={() => navigateToEdit(item.id)}
                                  aria-label="edit"
                                  size="small"
                                >
                                  <BorderColorIcon
                                    color="primary"
                                    fontSize="medium"
                                  />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
                            )}
                            {remove ? (
                              <Tooltip title="Delete" placement="top">
                                <IconButton
                                  onClick={async () => {
                                    if (window.confirm("Are you sure you want to delete this purchase order?")) {
                                      try {
                                        const token = localStorage.getItem("token");
                                        const response = await fetch(
                                          `${BASE_URL}/HelpDesk/DeletePurchaseOrder?id=${item.id}`,
                                          {
                                            method: "POST",
                                            headers: {
                                              Authorization: `Bearer ${token}`,
                                              "Content-Type": "application/json",
                                            },
                                          }
                                        );
                                        if (response.ok) {
                                          toast.success("Purchase Order deleted successfully");
                                          fetchPOList(page, search, pageSize);
                                        } else {
                                          toast.error("Failed to delete Purchase Order");
                                        }
                                      } catch (error) {
                                        toast.error("An error occurred while deleting");
                                      }
                                    }
                                  }}
                                  aria-label="delete"
                                  size="small"
                                >
                                  <DeleteIcon color="error" fontSize="medium" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              ""
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

