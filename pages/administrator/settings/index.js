import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Pagination,
  FormControl,
  Typography,
  InputLabel,
  MenuItem,
  Select,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import EditSetting from "pages/administrator/settings/EditSetting";
import { toast, ToastContainer } from "react-toastify";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";
import BASE_URL from "Base/api";

export default function Settings() {
  const cId = sessionStorage.getItem("category")
    const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const {
    data: settings,
    totalCount,
    page,
    pageSize,
    search,
    setPage,
    setPageSize,
    setSearch,
    fetchData: fetchSettings,
  } = usePaginatedFetch("AppSetting/GetAllAppSettingsPage", "", 10, false, false);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    fetchSettings(1, event.target.value, pageSize);
    setPage(1);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
    fetchSettings(value, search, pageSize);
  };

  const handleChangeRowsPerPage = (event) => {
    const size = event.target.value;
    setPageSize(size);
    setPage(1);
    fetchSettings(1, search, size);
  };

  const handleChangeSwitch = (value, item) => {
    const data = {
      SettingName: item.settingName,
      Value: item.value,
      IsEnabled: value,
    }
    const token = localStorage.getItem("token");
    fetch(`${BASE_URL}/AppSetting/UpdateAppSetting`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.statusCode == 200) {
          toast.success(data.message);
          fetchSettings();
          // setTimeout(() => {
          //   window.location.reload();
          // }, 2000);
        } else {
          toast.error(data.message);
        }
      })
      .catch((error) => {
        toast.error(error.message || "");
      });
  }

  if (!navigate) {
      return <AccessDenied />;
    }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Settings</h1>
        <ul>
          <li>
            <Link href="/settings">Settings</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} lg={4}>
          <ToastContainer />
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={search}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Setting Name</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Document Link</TableCell>
                  <TableCell>Enable</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!settings || settings.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={7}>
                      <Typography color="error">
                        No Settings Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  settings.map((setting, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell>{setting.settingName}</TableCell>
                      <TableCell>{setting.value}</TableCell>
                      <TableCell>{setting.description || "-"}</TableCell>
                      <TableCell>
                        {setting.documentLink ? (
                          <a href={setting.documentLink} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>
                            View Document
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <FormControlLabel control={<Switch checked={setting.isEnabled} onChange={(e) => handleChangeSwitch(e.target.checked, setting)} />} />
                      </TableCell>
                      <TableCell align="right">
                        {update ? <EditSetting
                          item={setting}
                          fetchItems={fetchSettings}
                        /> : ""}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={totalCount ? Math.ceil(totalCount / pageSize) : 1}
                page={page}
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={pageSize}
                  label="Page Size"
                  onChange={handleChangeRowsPerPage}
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
