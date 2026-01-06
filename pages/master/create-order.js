import React from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";

const CreateBillOfMaterials = () => {
  const router = useRouter();

  const navigateToBack = () => {
    router.push({
      pathname: "/master/orders",
    });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Order</h1>
        <ul>
          <li>
            <Link href="/master/orders">Orders</Link>
          </li>
          <li> Create Order</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" justifyContent="end">
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Go Back
              </Button>
            </Grid>
            <Grid
              item
              xs={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Supplier
              </Typography>
              <FormControl
                sx={{
                  width: "60%",
                }}
              >
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  size="small"
                >
                  <MenuItem value={1}>Supplier 1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid
              item
              xs={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                name="FirstName"
              />
            </Grid>
            <Grid
              item
              xs={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Remark
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                name="FirstName"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ mt: 1, mb: 1 }}
                size="small"
                fullWidth
                placeholder="Search"
              />
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Item</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Quantity</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Total Amount</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        Item Name
                      </TableCell>
                      <TableCell>
                        <input
                          value="1"
                          style={{
                            width: "80px",
                            height: "30px",
                            border: "1px solid #e5e5e5",
                          }}
                          type="number"
                        />
                      </TableCell>
                      <TableCell>200</TableCell>
                      <TableCell>200</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete" placement="top">
                          <IconButton aria-label="delete" size="small">
                            <DeleteIcon color="error" fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CreateBillOfMaterials;
