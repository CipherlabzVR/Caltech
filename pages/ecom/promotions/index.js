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
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddPromotion from "./create";
import EditPromotion from "./edit";
import {
  PROMOTION_CATEGORIES,
  PROMOTION_TYPES,
  humanizePromotionCategoryEnumKey,
  normalizePromotionCategoryKey,
} from "@/components/eCommerce/promotions/promotionConfig";

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
  } = usePaginatedFetch("ECommerce/GetAllPromotions", "", 10, false, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchData(1, event.target.value, pageSize);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchData(value, search, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchData(1, search, size);
  };

  const getTypeLabel = (category, type) => {
    const types = PROMOTION_TYPES[category];
    if (!types) return type || "";
    const t = types.find((x) => x.value === type);
    return t ? t.label : type || "";
  };

  const getCategoryLabel = (category) => {
    const key = normalizePromotionCategoryKey(category);
    const c = PROMOTION_CATEGORIES.find((x) => x.value === key);
    if (c) return c.label;
    if (key) return humanizePromotionCategoryEnumKey(key);
    return category || "";
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
                  <TableCell>Start</TableCell>
                  <TableCell>End</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell colSpan={10} component="th" scope="row">
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
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>{item.name}</TableCell>
                        <TableCell>{getCategoryLabel(item.promotionCategory)}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          {(() => {
                            const catKey = normalizePromotionCategoryKey(item.promotionCategory);
                            if (catKey === "CategoryBased" || catKey === "ProductBased") {
                              return "—";
                            }
                            return getTypeLabel(catKey, item.promotionType);
                          })()}
                        </TableCell>
                        <TableCell>{item.couponCode || "—"}</TableCell>
                        <TableCell>{item.startDate ? formatDate(item.startDate) : "—"}</TableCell>
                        <TableCell>{item.endDate ? formatDate(item.endDate) : "—"}</TableCell>
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
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
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
