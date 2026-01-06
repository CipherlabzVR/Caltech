import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import BASE_URL from "Base/api";
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";

export default function ViewUserDialog({ userEmail }) {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  const [user, setUser] = useState();

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/User/GetUserDetailByEmail?email=${userEmail}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Users");
      }
      const responseData = await response.json();
      const userData = responseData.result;
      setUser(userData);
    } catch (error) {
      console.error("Error fetching Users:", error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const formatDateOfBirth = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    return date.toLocaleDateString("en-US", options);
  };

  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);
  return (
    <>
      <Button
        variant="contained"
        color="primary"
        sx={{
          textTransform: "capitalize",
          borderRadius: "8px",
          m: "0 5px",
          color: "#fff !important",
        }}
        onClick={handleClickOpen("paper")}
      >
        View User Details
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <div className="bg-black">
          <DialogTitle id="scroll-dialog-title">User Details</DialogTitle>
          <DialogContent>
            <Grid container>
              <Grid item xs={12}>
                <TableContainer component={Paper} sx={{ boxShadow: "none" }}>
                  <Table aria-label="simple table" className="dark-table">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Full Name
                        </TableCell>
                        <TableCell align="right">
                          {user && user.firstName} {user && user.lastName}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Address
                        </TableCell>
                        <TableCell align="right">
                          {user && user.address}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          User Name
                        </TableCell>
                        <TableCell align="right">
                          {user && user.userName}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Phone Number
                        </TableCell>
                        <TableCell align="right">
                          {user && user.phoneNumber}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          User Type
                        </TableCell>
                        <TableCell align="right">
                        {user && user.userType === 1 ? <i className="ri-shield-user-fill" /> : <i className="ri-macbook-line" />} {user && user.userType === 1 ? 'Admin' : 'User'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Created On
                        </TableCell>
                        <TableCell align="right">
                          {user && formatDateOfBirth(user.createdAt)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Phone Number Confirmed
                        </TableCell>
                        <TableCell align="right">
                        {user && user.userType === true ? <span class="successBadge">True</span> : <span class="dangerBadge">True</span>}

                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Email Confirmed
                        </TableCell>
                        <TableCell align="right">
                        {user && user.emailConfirmed === true ? <span class="successBadge">True</span> : <span class="dangerBadge">True</span>}

                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Age Verified
                        </TableCell>
                        <TableCell align="right">
                        {user && user.isAgeVerified === true ? <span class="successBadge">True</span> : <span class="dangerBadge">True</span>}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Status
                        </TableCell>
                        <TableCell align="right">
                        {user && user.status === true ? <span class="successBadge">Active</span> : <span class="dangerBadge">Inactive</span>}

                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleClose}
                  sx={{
                    mt: 2,
                    textTransform: "capitalize",
                    borderRadius: "8px",
                    fontWeight: "500",
                    fontSize: "13px",
                    padding: "12px 20px",
                  }}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
        </div>
      </Dialog>
    </>
  );
}
