import React, { useCallback, useEffect, useState } from "react";
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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { ToastContainer } from "react-toastify";
import AddItems from "pages/master/items/AddItems";
import BASE_URL from "Base/api";
import EditItems from "pages/master/items/EditItems";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { formatCurrency } from "@/components/utils/formatHelper";
import GetAllItemDetails from "@/components/utils/GetAllItemDetails";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import useApi from "@/components/utils/useApi";

/**
 * E-commerce Upcoming Products — same item master structure, filtered to IsUpcoming.
 * After GRN, backend clears IsUpcoming and activates the item for normal catalog.
 */
export default function UpcomingProducts() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [itemsList, setItemsList] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const controller = "Items/DeleteItems";
  const { data: isPOSSystem } = IsAppSettingEnabled(`IsPosSystem`);
  const { data: isGarmentSystem } = IsAppSettingEnabled(`IsGarmentSystem`);
  const { data: isBarcodeEnabled } = IsAppSettingEnabled(`IsBarcodeEnabled`);
  const { data: IsEcommerceWebSiteAvailable } = IsAppSettingEnabled(`IsEcommerceWebSiteAvailable`);
  const { data: isSubCategoryNotRequired } = IsAppSettingEnabled("IsSubCategoryNotRequired");
  const { data: isUOMNotRequired } = IsAppSettingEnabled("IsUOMNotRequired");
  const { data: showItemWebDetailFields } = IsAppSettingEnabled("ShowEcomItemWebDetailFieldsInMaster");
  const [searchTerm, setSearchTerm] = useState("");
  const { categories, subCategories, uoms, refetch: refetchItemDetails } = GetAllItemDetails();
  const [catInfo, setCatInfo] = useState({});
  const [subCatInfo, setSubCatInfo] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  useEffect(() => {
    if (categories) {
      const map = categories.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});
      setCatInfo(map);
    }
  }, [categories]);

  useEffect(() => {
    if (subCategories) {
      const map = subCategories.reduce((acc, c) => {
        acc[c.id] = c;
        return acc;
      }, {});
      setSubCatInfo(map);
    }
  }, [subCategories]);

  useEffect(() => {
    if (accountList) {
      setChartOfAccounts(accountList);
    }
  }, [accountList]);

  const fetchItemsList = useCallback(
    async (pageNumber = page, search = searchTerm, size = pageSize) => {
      try {
        const skip = (pageNumber - 1) * size;
        const query = `${BASE_URL}/Items/GetAllItemsSkipAndTake?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}&UpcomingOnly=true`;
        const response = await fetch(query, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch upcoming items");
        const data = await response.json();
        setItemsList(data.result?.items || data.result?.Items || []);
        setTotalCount(data.result?.totalCount ?? data.result?.TotalCount ?? 0);
      } catch (error) {
        console.error(error);
        setItemsList([]);
        setTotalCount(0);
      }
    },
    [page, pageSize, searchTerm]
  );

  useEffect(() => {
    fetchItemsList(page, searchTerm, pageSize);
  }, [fetchItemsList, page, pageSize, searchTerm]);

  const refreshItemTableLookups = useCallback(() => {
    refetchItemDetails?.();
  }, [refetchItemDetails]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(event.target.value);
    setPage(1);
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Upcoming Products</h1>
        <ul>
          <li>
            <Link href="/ecom/upcoming-items/">Upcoming Products</Link>
          </li>
        </ul>
      </div>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, px: 1 }}>
        Create products that appear on the website as <strong>Upcoming</strong>. After a GRN is posted for the item, it is automatically activated and moved into the normal catalog.
      </Typography>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
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
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" alignItems="center" gap={1} order={{ xs: 1, lg: 2 }}>
          {create ? (
            <AddItems
              fetchItems={fetchItemsList}
              onMasterLookupRefresh={refreshItemTableLookups}
              isPOSSystem={isPOSSystem}
              uoms={uoms}
              isGarmentSystem={isGarmentSystem}
              chartOfAccounts={chartOfAccounts}
              barcodeEnabled={isBarcodeEnabled}
              IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable ?? true}
              subCategories={subCategories}
              isSubCategoryNotRequired={isSubCategoryNotRequired}
              isUOMNotRequired={isUOMNotRequired}
              showItemWebDetailFields={showItemWebDetailFields}
              upcomingMode
            />
          ) : null}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="upcoming products" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Sub Category</TableCell>
                  <TableCell>Average Price (LKR)</TableCell>
                  <TableCell>Show In Web</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemsList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography color="error">No Upcoming Products</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  itemsList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{catInfo[item.categoryId]?.name || "-"}</TableCell>
                      <TableCell>{subCatInfo[item.subCategoryId]?.name || "-"}</TableCell>
                      <TableCell>{formatCurrency(item.averagePrice)}</TableCell>
                      <TableCell>
                        {item.isWebView ? (
                          <span className="successBadge">Yes</span>
                        ) : (
                          <span className="dangerBadge">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="warningBadge">Upcoming</span>
                      </TableCell>
                      <TableCell align="right">
                        {update ? (
                          <EditItems
                            fetchItems={() => fetchItemsList(page, searchTerm, pageSize)}
                            item={item}
                            isPOSSystem={isPOSSystem}
                            uoms={uoms}
                            isGarmentSystem={isGarmentSystem}
                            chartOfAccounts={chartOfAccounts}
                            barcodeEnabled={isBarcodeEnabled}
                            IsEcommerceWebSiteAvailable={IsEcommerceWebSiteAvailable ?? true}
                            isSubCategoryNotRequired={isSubCategoryNotRequired}
                            isUOMNotRequired={isUOMNotRequired}
                            showItemWebDetailFields={showItemWebDetailFields}
                            upcomingMode
                          />
                        ) : null}
                        {remove ? (
                          <DeleteConfirmationById
                            id={item.id}
                            controller={controller}
                            fetchItems={fetchItemsList}
                          />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.max(1, Math.ceil(totalCount / pageSize))}
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
