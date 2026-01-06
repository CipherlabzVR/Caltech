import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import AddDeliveryMethodModal from "./create";
import EditDeliveryMethodModal from "./edit";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";
import { DEFAULT_DELIVERY_TYPE_OPTIONS, getDeliveryTypeLabel, normalizeDeliveryTypeOptions } from "@/utils/delivery-methods";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";

const controller = "DeliveryMethods/DeleteDeliveryMethod";

const useDeliveryTypeOptions = () => {
  const [options, setOptions] = useState(DEFAULT_DELIVERY_TYPE_OPTIONS);

  React.useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/EnumLookup/DeliveryTypes`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const normalized = normalizeDeliveryTypeOptions(data);

        if (normalized.length > 0) {
          setOptions(normalized);
        }
      } catch (error) {
        console.warn("Failed to load delivery types:", error);
      }
    };

    fetchOptions();
  }, []);

  return options;
};

export default function DeliveryMethods() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);

  const {
    data: deliveryMethods,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData,
  } = usePaginatedFetch("DeliveryMethods/GetAllDeliveryMethods", "", 10, false, false);

  const deliveryTypeOptions = useDeliveryTypeOptions();

  const refreshList = useCallback(
    (resetToFirstPage = false) => {
      const targetPage = resetToFirstPage ? 1 : page;
      if (resetToFirstPage && page !== 1) {
        setPage(1);
      }
      fetchData(targetPage, search, pageSize, false);
    },
    [fetchData, page, pageSize, search, setPage]
  );

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    setPage(1);
    fetchData(1, value, pageSize, false);
  };

  const handlePageChange = (_, value) => {
    setPage(value);
    fetchData(value, search, pageSize, false);
  };

  const handlePageSizeChange = (event) => {
    const size = Number(event.target.value);
    setPageSize(size);
    setPage(1);
    fetchData(1, search, size, false);
  };

  const paginatedItems = useMemo(() => deliveryMethods || [], [deliveryMethods]);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Delivery Methods</h1>
        <ul>
          <li>
            <Link href="/master/delivery-methods/">Delivery Methods</Link>
          </li>
        </ul>
      </div>
      <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={6} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search delivery methods..."
              inputProps={{ "aria-label": "search delivery methods" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={6} mb={1} display="flex" justifyContent="flex-end" order={{ xs: 1, lg: 2 }}>
          {create && (
            <AddDeliveryMethodModal
              fetchItems={refreshList}
              deliveryTypeOptions={deliveryTypeOptions}
            />
          )}
        </Grid>

        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table className="dark-table" aria-label="delivery methods table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Delivery Type</TableCell>
                  <TableCell>Base Charge</TableCell>
                  <TableCell>Per KM Rate</TableCell>
                  <TableCell>Estimated Days</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell>Supports COD</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color="error" align="center">
                        No delivery methods available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((method, index) => (
                    <TableRow key={method.id || index}>
                      <TableCell>{method.name || "-"}</TableCell>
                      <TableCell>{getDeliveryTypeLabel(method.deliveryType, deliveryTypeOptions)}</TableCell>
                      <TableCell>{Number(method.baseCharge || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {method.perKMRate !== null && method.perKMRate !== undefined
                          ? Number(method.perKMRate).toFixed(2)
                          : "-"}
                      </TableCell>
                      <TableCell>{method.estimatedDeliveryDays ?? "-"}</TableCell>
                      <TableCell>
                        {method.isActive ? <span className="successBadge">Active</span> : <span className="dangerBadge">Inactive</span>}
                      </TableCell>
                      <TableCell>
                        {method.supportsCOD ? <span className="successBadge">Yes</span> : <span className="dangerBadge">No</span>}
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          {update && (
                            <EditDeliveryMethodModal
                              item={method}
                              fetchItems={refreshList}
                              deliveryTypeOptions={deliveryTypeOptions}
                            />
                          )}
                          {remove && (
                            <DeleteConfirmationById
                              id={method.id}
                              controller={controller}
                              fetchItems={refreshList}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil((totalCount || 0) / pageSize))}
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

