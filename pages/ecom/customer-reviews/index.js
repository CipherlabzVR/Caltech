import React, { useState } from "react";
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
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Rating from "@mui/material/Rating";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import AddCustomerReview from "./create";
import EditCustomerReview from "./edit";
import BASE_URL from "Base/api";

const TAB_SHOP = "shop";
const TAB_ITEM = "item";

function ReviewImagesCell({ urls }) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (list.length === 0) return "—";
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", maxWidth: 140 }}>
      {list.slice(0, 3).map((url, idx) => (
        <Box
          key={`${url}-${idx}`}
          component="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            display: "block",
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src={url}
            alt=""
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Box>
      ))}
      {list.length > 3 ? (
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
          +{list.length - 3}
        </Typography>
      ) : null}
    </Box>
  );
}

export default function CustomerReviews() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const controller = "ECommerce/DeleteCustomerReview";
  const [tab, setTab] = useState(TAB_SHOP);
  const [approvingId, setApprovingId] = useState(null);

  const listFilter = tab === TAB_ITEM ? "product" : "shop";

  const {
    data,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    setFilter,
    fetchData,
  } = usePaginatedFetch("ECommerce/GetAllCustomerReviews", "", 10, false, false, listFilter);

  const isItemTab = tab === TAB_ITEM;

  const handleTabChange = (_event, newTab) => {
    setTab(newTab);
    const nextFilter = newTab === TAB_ITEM ? "product" : "shop";
    setFilter(nextFilter);
    setPage(1);
    fetchData(1, search, pageSize, false, nextFilter);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchData(1, event.target.value, pageSize, false, listFilter);
    setPage(1);
  };

  const handlePageChange = (_event, value) => {
    setPage(value);
    fetchData(value, search, pageSize, false, listFilter);
  };

  const handlePageSizeChange = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchData(1, search, size, false, listFilter);
  };

  const handleApprove = async (item) => {
    const id = item.id ?? item.Id;
    const locRaw = item.location ?? item.Location;
    const emailRaw = item.submitterEmail ?? item.SubmitterEmail;
    const productIdRaw = item.productId ?? item.ProductId;
    const body = {
      id,
      reviewerDisplayName: String(item.reviewerDisplayName ?? item.ReviewerDisplayName ?? "").trim(),
      location:
        locRaw == null || String(locRaw).trim() === "" ? null : String(locRaw).trim(),
      rating: Math.min(5, Math.max(1, Number(item.rating ?? item.Rating) || 1)),
      reviewText: String(item.reviewText ?? item.ReviewText ?? "").trim(),
      submitterEmail:
        emailRaw == null || String(emailRaw).trim() === "" ? null : String(emailRaw).trim(),
      productId: productIdRaw != null && Number(productIdRaw) > 0 ? Number(productIdRaw) : null,
      imageUrls: item.imageUrls ?? item.ImageUrls ?? [],
      isApproved: true,
      displayOrder: Number(item.displayOrder ?? item.DisplayOrder ?? 0) || 0,
    };
    try {
      setApprovingId(id);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/ECommerce/SaveCustomerReviewStaff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      const ok = data.statusCode === 200 || data.statusCode === "200";
      if (ok) {
        toast.success(data.message || "Review approved");
        fetchData(page, search, pageSize, false, listFilter);
      } else {
        toast.error(data.message || "Could not approve review");
      }
    } catch (e) {
      toast.error(e.message || "Could not approve review");
    } finally {
      setApprovingId(null);
    }
  };

  const field = (row, camel, pascal) => row[camel] ?? row[pascal] ?? "";

  if (!navigate) {
    return <AccessDenied />;
  }

  const colSpan = isItemTab ? 10 : 9;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Customer Reviews</h1>
        <ul>
          <li>
            <Link href="/ecom/customer-reviews/">Customer Reviews</Link>
          </li>
        </ul>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} aria-label="Review type tabs">
          <Tab value={TAB_SHOP} label="Shop reviews" />
          <Tab value={TAB_ITEM} label="Item reviews" />
        </Tabs>
      </Box>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder={isItemTab ? "Search name, text, product…" : "Search name, text, email…"}
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {!isItemTab && create ? <AddCustomerReview fetchItems={() => fetchData(page, search, pageSize, false, listFilter)} /> : null}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {isItemTab
              ? "Product reviews from the storefront are published immediately and listed here."
              : "Website shop testimonials start as not approved. Approve them to show on the homepage carousel."}
          </Typography>
          <TableContainer component={Paper}>
            <Table aria-label="customer reviews" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  {isItemTab ? <TableCell>Product</TableCell> : null}
                  <TableCell>Name</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>Review</TableCell>
                  {isItemTab ? <TableCell>Photos</TableCell> : null}
                  {!isItemTab ? <TableCell>Approved</TableCell> : null}
                  {!isItemTab ? <TableCell>Order</TableCell> : null}
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell colSpan={colSpan} component="th" scope="row">
                      <Typography color="text.secondary">
                        {isItemTab ? "No item reviews yet." : "No shop reviews yet."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => {
                    const id = item.id ?? item.Id;
                    const approved = item.isApproved ?? item.IsApproved;
                    const ratingVal = Math.min(
                      5,
                      Math.max(1, Number(item.rating ?? item.Rating) || 1),
                    );
                    const text = field(item, "reviewText", "ReviewText");
                    const excerpt = String(text).length > 80 ? `${String(text).slice(0, 80)}…` : text;
                    const productName = field(item, "productName", "ProductName");
                    const productCode = field(item, "productCode", "ProductCode");
                    const productId = item.productId ?? item.ProductId;
                    const imageUrls = item.imageUrls ?? item.ImageUrls ?? [];

                    return (
                      <TableRow key={id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                        <TableCell component="th" scope="row">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        {isItemTab ? (
                          <TableCell sx={{ maxWidth: 160 }}>
                            <Typography variant="body2" fontWeight={600} noWrap title={productName}>
                              {productName || `Item #${productId}`}
                            </Typography>
                            {productCode ? (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {productCode}
                              </Typography>
                            ) : null}
                          </TableCell>
                        ) : null}
                        <TableCell>{field(item, "reviewerDisplayName", "ReviewerDisplayName")}</TableCell>
                        <TableCell>{field(item, "location", "Location") || "—"}</TableCell>
                        <TableCell>
                          <Rating
                            name={`rating-${id}`}
                            value={ratingVal}
                            readOnly
                            size="small"
                            precision={1}
                            sx={{ verticalAlign: "middle" }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }} title={text}>
                          {excerpt}
                        </TableCell>
                        {isItemTab ? (
                          <TableCell>
                            <ReviewImagesCell urls={imageUrls} />
                          </TableCell>
                        ) : null}
                        {!isItemTab ? (
                          <TableCell>
                            <span className={approved ? "successBadge" : "warningBadge"}>
                              {approved ? "Yes" : "Pending"}
                            </span>
                          </TableCell>
                        ) : null}
                        {!isItemTab ? (
                          <TableCell>{item.displayOrder ?? item.DisplayOrder ?? 0}</TableCell>
                        ) : null}
                        <TableCell>{formatDate(item.createdOn ?? item.CreatedOn)}</TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 0.5,
                              flexWrap: "wrap",
                            }}
                          >
                            {!isItemTab && update && !approved ? (
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                onClick={() => handleApprove(item)}
                                disabled={approvingId === id}
                                sx={{ textTransform: "none", minWidth: "auto" }}
                              >
                                {approvingId === id ? "…" : "Approve"}
                              </Button>
                            ) : null}
                            {update ? (
                              <EditCustomerReview
                                item={item}
                                fetchItems={() => fetchData(page, search, pageSize, false, listFilter)}
                                isItemReview={isItemTab}
                              />
                            ) : null}
                            {remove ? (
                              <DeleteConfirmationById
                                id={id}
                                controller={controller}
                                fetchItems={() => fetchData(page, search, pageSize, false, listFilter)}
                              />
                            ) : null}
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
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
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
