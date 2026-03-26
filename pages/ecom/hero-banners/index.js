import React, { useEffect, useState, useCallback } from "react";
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
  Select,
  MenuItem,
  Typography,
  Box,
  AvatarGroup,
  Avatar,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import { formatDate } from "@/components/utils/formatHelper";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import BASE_URL from "Base/api";
import AddHeroBanner from "./create";
import EditHeroBanner from "./edit";

export default function HeroBanners() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const controller = "ECommerce/DeleteHeroBanner";

  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const skip = page * pageSize;
      const searchParam = search || "null";
      const response = await fetch(
        `${BASE_URL}/ECommerce/GetAllHeroBanners?SkipCount=${skip}&MaxResultCount=${pageSize}&Search=${searchParam}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const result = await response.json();
      if (result.statusCode === 200) {
        setData(result.result?.items || []);
        setTotalCount(result.result?.totalCount || 0);
      }
    } catch (error) {
      console.error("Error fetching hero banners:", error);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Hero Banners</h1>
        <ul>
          <li>
            <Link href="/ecom/hero-banners/">Hero Banners</Link>
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
              placeholder="Search by title.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
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
          {create ? <AddHeroBanner fetchItems={fetchData} /> : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Images</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created On</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell colSpan={8} component="th" scope="row">
                      <Typography color="error">
                        No Hero Banners Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item, index) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      <TableCell component="th" scope="row">
                        {page * pageSize + index + 1}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {item.title}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ maxWidth: 200 }}
                      >
                        {item.description}
                      </TableCell>
                      <TableCell>
                        {item.bannerImages && item.bannerImages.length > 0 ? (
                          <AvatarGroup max={4} sx={{ justifyContent: "start" }}>
                            {item.bannerImages.map((img) => (
                              <Avatar
                                key={img.id}
                                src={img.imgUrl}
                                variant="rounded"
                                sx={{ width: 48, height: 32 }}
                              />
                            ))}
                          </AvatarGroup>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No images
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {item.displayOrder}
                      </TableCell>
                      <TableCell>
                        {item.isActive ? (
                          <span className="successBadge">Active</span>
                        ) : (
                          <span className="dangerBadge">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {formatDate(item.createdOn)}
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditHeroBanner
                            item={item}
                            fetchItems={fetchData}
                          />
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
                  ))
                )}
              </TableBody>
            </Table>
            <Grid
              container
              p={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Grid item display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">Rows per page:</Typography>
                <Select
                  size="small"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value);
                    setPage(0);
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
                  page={page + 1}
                  onChange={(e, value) => setPage(value - 1)}
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
