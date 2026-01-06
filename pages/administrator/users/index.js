import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { Box, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, IconButton, Tooltip } from "@mui/material";
import AddUserDialog from "pages/administrator/users/AddUserDialog";
import BASE_URL from "Base/api";
import GetAllWarehouse from "@/components/utils/GetAllWarehouse";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import EditUserDialog from "./EditUserDialog";
import DeleteUserConfirmationById from "@/components/UIElements/Modal/DeleteUserConfirmationById";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import SendIcon from "@mui/icons-material/Send";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Users() {
  const cId = sessionStorage.getItem("category")
  const { navigate, create, update, remove, print } = IsPermissionEnabled(cId);
  const [usersList, setUsersLists] = useState([]);
  const [roles, setRoles] = useState([]);
  const { data: warehouseList } = GetAllWarehouse();
  const controller = "User/DeleteUser";
  const [warehouseInfo, setWarehouseInfo] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserType, setSelectedUserType] = useState("all");
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [selectedUserForVerification, setSelectedUserForVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/User/GetAllUser`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }

      const data = await response.json();
      setUsersLists(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchRolesList = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/User/GetAllRoles`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (warehouseList) {
      const warehouseMap = warehouseList.reduce((acc, warehouse) => {
        acc[warehouse.id] = warehouse;
        return acc;
      }, {});
      setWarehouseInfo(warehouseMap);
    }
  }, [warehouseList]);

  useEffect(() => {
    fetchUsers();
    fetchRolesList();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const userTypeOptions = useMemo(() => {
    const byId = new Map();
    usersList.forEach((user) => {
      if (user?.userType !== null && user?.userType !== undefined) {
        const key = String(user.userType);
        if (!byId.has(key)) {
          byId.set(key, user.userTypeName || "Unknown");
        }
      }
    });
    return Array.from(byId, ([value, label]) => ({ value, label }));
  }, [usersList]);

  const handleUserTypeFilterChange = (event) => {
    setSelectedUserType(event.target.value);
    setPage(0);
  };

  const filteredData = usersList.filter((item) => {
    const username = item?.userName || "";
    const firstName = item?.firstName || "";
    const lastName = item?.lastName || "";
    const matchesSearch =
      username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${firstName} ${lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUserType =
      selectedUserType === "all"
        ? true
        : String(item?.userType) === selectedUserType;

    return matchesSearch && matchesUserType;
  });

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleSendVerificationClick = (user) => {
    setSelectedUserForVerification(user);
    setIsVerificationDialogOpen(true);
  };

  const handleCloseVerificationDialog = () => {
    setIsVerificationDialogOpen(false);
    setSelectedUserForVerification(null);
  };

  const handleConfirmSendVerification = async () => {
    if (!selectedUserForVerification?.userName) {
      toast.error("Unable to determine user email for verification.");
      return;
    }

    try {
      setVerificationLoading(true);
      
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const verificationLink = `${baseUrl}/userverified?userId=${selectedUserForVerification.id}`;
      const email = selectedUserForVerification.userName;
      const accountName = `${selectedUserForVerification.firstName || ""} ${selectedUserForVerification.lastName || ""}`.trim();
      
      const apiUrl = `${BASE_URL}/Email/SendAccountVerificationEmail?email=${encodeURIComponent(email)}&accountName=${encodeURIComponent(accountName)}&verificationLink=${encodeURIComponent(verificationLink)}`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to send verification email");
      }

      toast.success(data?.message || "Verification email sent successfully.");
      handleCloseVerificationDialog();
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Unable to send verification email");
    } finally {
      setVerificationLoading(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Users</h1>
        <ul>
          <li>
            <Link href="/administrator/users/">Users</Link>
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
              placeholder="Search here.."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid
          item
          xs={12}
          lg={4}
          mb={1}
          display="flex"
          justifyContent="end"
          order={{ xs: 1, lg: 3 }}
        >
          {create ? <AddUserDialog fetchItems={fetchUsers} warehouses={warehouseList} roles={roles} /> : ""}
        </Grid>
        <Grid
          item
          xs={12}
          lg={4}
          order={{ xs: 3, lg: 2 }}
          display="flex"
          justifyContent={{ xs: "flex-start", lg: "center" }}
        >
          <FormControl fullWidth sx={{ minWidth: 200 }}>
            <InputLabel id="user-type-filter-label">User Type</InputLabel>
            <Select
              labelId="user-type-filter-label"
              id="user-type-filter"
              label="User Type"
              value={selectedUserType}
              onChange={handleUserTypeFilterChange}
            >
              <MenuItem value="all">All User Types</MenuItem>
              {userTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="simple table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Mobile No</TableCell>
                  <TableCell>Warehouse</TableCell>
                  <TableCell>User Role</TableCell>
                  <TableCell>User Type</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row" colSpan={8}>
                      <Typography color="error">
                        No Users Available
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((user, index) => (
                    <TableRow
                      key={index}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell>{user.firstName} {user.lastName}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{user.userName || "-"}</Typography>
                          {user.isEmailVerified === true ? (
                            <Chip
                              label="Verified"
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                              }}
                            />
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell>{user.address}</TableCell>
                      <TableCell>
                        {user.phoneNumber}
                      </TableCell>
                      <TableCell>
                        {warehouseInfo[user.warehouseId]
                          ? `${warehouseInfo[user.warehouseId].code} - ${warehouseInfo[user.warehouseId].name
                          }`
                          : "-"}
                      </TableCell>
                      <TableCell>{user.userRoleName}</TableCell>
                      <TableCell>{user.userTypeName}</TableCell>
                      <TableCell align="right">
                        <Box display="flex" gap={1} justifyContent="flex-end">
                          {update ? <EditUserDialog
                            item={user}
                            fetchItems={fetchUsers}
                            roles={roles}
                            warehouses={warehouseList}
                          /> : ""}
                          <Tooltip title="Send Verification">
                            <IconButton
                              size="small"
                              color="primary"
                              aria-label="send verification"
                              onClick={() => handleSendVerificationClick(user)}
                            >
                              <SendIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          {remove ? <DeleteUserConfirmationById
                            id={user.id}
                            controller={controller}
                            fetchItems={fetchUsers}
                          /> : ""}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Grid>
      </Grid>

      <Dialog open={isVerificationDialogOpen} onClose={handleCloseVerificationDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Send Verification Email</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            Are you sure you want to send a verification email to{" "}
            <strong>{selectedUserForVerification ? selectedUserForVerification.userName || selectedUserForVerification.firstName + " " + selectedUserForVerification.lastName : "this user"}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerificationDialog} color="inherit" disabled={verificationLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmSendVerification} color="primary" variant="contained" disabled={verificationLoading}>
            {verificationLoading ? "Sending..." : "Send"}
          </Button>
        </DialogActions>
      </Dialog>

      {typeof window !== "undefined" && (
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      )}
    </>
  );
}
