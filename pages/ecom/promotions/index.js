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
import { Pagination, Select, MenuItem, Typography } from "@mui/material";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddPromotion from "./create";
import EditPromotion from "./edit";
import { PROMOTION_CATEGORIES, PROMOTION_TYPES } from "@/components/eCommerce/promotions/promotionConfig";

export default function Promotions() {
  const [cId, setCId] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCId(sessionStorage.getItem("category"));
    }
  }, []);

  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const controller = "ECommerce/DeletePromotion";

  const {
    data,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData,
  } = usePaginatedFetch("ECommerce/GetAllPromotions", "", 10, true, false);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const getTypeLabel = (category, type) => {
    const types = PROMOTION_TYPES[category];
    if (!types) return type || "";
    const t = types.find((x) => x.value === type);
    return t ? t.label : type || "";
  };

  const getCategoryLabel = (category) => {
    const c = PROMOTION_CATEGORIES.find((x) => x.value === category);
    return c ? c.label : category || "";
  };

  const getStatus = (item) => {
    if (!item.isActive) return { label: "Inactive", className: "dangerBadge" };
    const now = new Date();
    const start = item.startDate ? new Date(item.startDate) : null;
    const end = item.endDate ? new Date(item.endDate) : null;
    if (start && now < start) return { label: "Scheduled", className: "warningBadge" };
    if (end && now > end) return { label: "Expired", className: "dangerBadge" };
    if ((!start || now >= start) && (!end || now <= end)) return { label: "Active", className: "successBadge" };
    return { label: "Active", className: "successBadge" };
  };

  const handlePageChange = (e, value) => {
    setPage(value - 1);
    fetchData(value, search, pageSize);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Promotions</h1>
        <ul>
          <li>
            <Link href="/ecom/promotions/">Promotions</Link>
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
              placeholder="Search by name, description or coupon code.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          {create ? <AddPromotion fetchItems={fetchData} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="promotions table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Coupon Code</TableCell>
                  <TableCell>Start / End</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell colSpan={9} component="th" scope="row">
                      <Typography color="error">No Promotions Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const status = getStatus(item);
                    return (
                      <TableRow
                        key={item.id}
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {(page || 0) * pageSize + index + 1}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>{item.name}</TableCell>
                        <TableCell>{getCategoryLabel(item.promotionCategory)}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {getTypeLabel(item.promotionCategory, item.promotionType)}
                        </TableCell>
                        <TableCell>{item.couponCode || "—"}</TableCell>
                        <TableCell>
                          {item.startDate ? formatDate(item.startDate) : "—"} /{" "}
                          {item.endDate ? formatDate(item.endDate) : "—"}
                        </TableCell>
                        <TableCell>
                          <span className={status.className}>{status.label}</span>
                        </TableCell>
                        <TableCell>{item.createdOn ? formatDate(item.createdOn) : "—"}</TableCell>
                        <TableCell align="right">
                          {update ? (
                            <EditPromotion item={item} fetchItems={fetchData} />
                          ) : (
                            ""
                          )}
                          {remove ? (
                            <DeleteConfirmationById
                              id={item.id}
                              controller={controller}
                              fetchItems={fetchData}
                            />
                          ) : (
                            ""
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <Grid container p={2} alignItems="center" justifyContent="space-between">
              <Grid item display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Rows per page:</Typography>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setPage(0);
                    fetchData(1, search, e.target.value);
                  }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
                <Typography variant="body2" ml={2}>
                  Total: {totalCount}
                </Typography>
              </Grid>
              <Grid item>
                <Pagination
                  count={totalPages}
                  page={(page || 0) + 1}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                />
              </Grid>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
