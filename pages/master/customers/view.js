import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import BASE_URL from "Base/api";
import {
  Box,
  Grid,
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
} from "@mui/material";
import Link from "next/link";
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ViewCustomerDialog({ customerId }) {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState("paper");
  const [customer, setCustomer] = useState();

  console.log(customer);
  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Customer/GetCustomerDetailByID?customerId=${customerId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }
      const responseData = await response.json();
      const customerData = responseData.result.result[0];
      setCustomer(customerData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
    fetchCustomerDetails();
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
      <Tooltip title="View" placement="top">
        <IconButton onClick={handleClickOpen("paper")} aria-label="View" size="small">
          <VisibilityIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <div className="bg-black">
          <DialogTitle id="scroll-dialog-title">Customer Details</DialogTitle>
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
                          {customer && customer.firstName}{" "}
                          {customer && customer.lastName}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Address
                        </TableCell>
                        <TableCell align="right">
                          {customer && (
                            [customer.addressLine1, customer.addressLine2, customer.addressLine3]
                              .filter(Boolean)
                              .join(', ')
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Designation
                        </TableCell>
                        <TableCell align="right">
                          {customer && customer.designation}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Company
                        </TableCell>
                        <TableCell align="right">
                          {customer && customer.company}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Date Of Birth
                        </TableCell>
                        <TableCell align="right">
                          {customer && formatDateOfBirth(customer.dateofBirth)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ width: "30%", px: 0 }}>
                          Created On
                        </TableCell>
                        <TableCell align="right">
                          {customer && formatDateOfBirth(customer.createdOn)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12} mt={2}>
                <Typography
                  as="h4"
                  sx={{
                    fontSize: 16,
                    fontWeight: 500,
                    mt: "10px",
                    mb: "10px",
                  }}
                >
                  Contact Details
                </Typography>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" className="dark-table">
                    <TableHead style={{ backgroundColor: "#7884ef" }}>
                      <TableRow>
                        <TableCell sx={{ color: "#fff", width: "30%" }}>
                          Contact Name
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          Mobile Number
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          Email Address
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customer &&
                        customer.customerContactDetails.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell>{contact.contactName}</TableCell>
                            <TableCell>{contact.contactNo}</TableCell>
                            <TableCell>
                              <Link
                                style={{
                                  textDecoration: "none",
                                  color: "#A9A9C8",
                                }}
                                href={`mailto:${contact.emailAddress}`}
                              >
                                {contact.emailAddress}
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
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
