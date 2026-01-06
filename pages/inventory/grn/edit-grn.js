import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";

const GRNCreate = () => {
  const router = useRouter();
  const { id } = router.query;
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [grnDate, setGrnDate] = useState("");
  const [remark, setRemark] = useState("");
  

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/grn/",
    });
  };

  const handleSubmit = async () => {
   
  };

  const handleRemarkChange = (index, value) => {
    const updatedRows = [...selectedRows];
    updatedRows[index].remark = value;
    setSelectedRows(updatedRows);
  };
  const handleStatusChange = (index, value) => {
    const updatedRows = [...selectedRows];
    updatedRows[index].status = value;
    setSelectedRows(updatedRows);
  };
  const handleAddRow = (item) => {
    const newRow = {
      ...item,
      quantity: 1,
      totalPrice: item.averagePrice,
      status: 1,
      remark: "",
    };
    setSelectedRows((prevRows) => [...prevRows, newRow]);
    setTotal((prevTotal) => prevTotal + newRow.totalPrice);
  };
  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    const oldTotalPrice = row.totalPrice;

    row.quantity = newQuantity;
    row.totalPrice = parseFloat(row.averagePrice) * newQuantity;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - row.rowTotal);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Supplier/GetAllSupplier`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setSuppliers(data.result);
    } catch (error) {
      console.error("Error fetching", error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Items/GetAllItems`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();
      setItems(data.result);
    } catch (error) {
      console.error("Error fetching", error);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchItems();
  }, []);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Goods Receive Note Create</h1>
        <ul>
          <li>
            <Link href="/inventory/grn/">GRN</Link>
          </li>
          <li>Goods Receive Note Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} gap={1} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>GRN NO : {id}</Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
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
              <Autocomplete
                sx={{ width: "60%" }}
                options={suppliers}
                getOptionLabel={(option) => option.name || ""}
                value={supplier}
                onChange={(event, newValue) => setSupplier(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    placeholder="Search Supplier"
                  />
                )}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
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
                Reference No:
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
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
                GRN Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={grnDate}
                onChange={(e) => setGrnDate(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
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
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} mt={3}>
              <Autocomplete
                sx={{ mt: 3, mb: 1 }}
                options={items}
                getOptionLabel={(option) => option.name || ""}
                onChange={(event, value) => {
                  if (value) {
                    handleAddRow(value);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    placeholder="Search Items"
                  />
                )}
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
                      <TableCell
                        sx={{ color: "#fff" }}
                        align="right"
                      ></TableCell>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Exp&nbsp;Date
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Free</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Unit&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Cost&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Selling&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Maximum&nbsp;Selling&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Discount</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Status</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Total&nbsp;Price
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRows.map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ p: 1 }}>
                          <Tooltip title="Delete" placement="top">
                            <IconButton
                              onClick={() => handleDeleteRow(index)}
                              aria-label="delete"
                              size="small"
                            >
                              <DeleteIcon color="error" fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="text"
                            sx={{ width: "150px" }}
                            fullWidth
                            value={row.batchNumber || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].batchNumber = e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "150px" }}
                            size="small"
                            type="date"
                            fullWidth
                            name=""
                            value={row.expDate || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].expDate = e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "100px" }}
                            type="number"
                            size="small"
                            min={1}
                            value={row.quantity}
                            onChange={(e) =>
                              handleQuantityChange(
                                index,
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "100px" }}
                            size="small"
                            type="number"
                            fullWidth
                            name=""
                            value={row.free || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].free = e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            name=""
                            sx={{ width: "150px" }}
                            value={row.averagePrice}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: "150px" }}
                            fullWidth
                            name=""
                            value={row.costPrice || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].costPrice = e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            sx={{ width: "150px" }}
                            fullWidth
                            name=""
                            value={row.sellingPrice || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].sellingPrice = e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            sx={{ width: "150px" }}
                            name=""
                            value={row.maxSellingPrice || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].maxSellingPrice =
                                e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            sx={{ width: "150px" }}
                            name=""
                            value={row.discount || ""}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].discount = e.target.value;
                              setSelectedRows(updatedRows);
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            label="Status"
                            value={row.status}
                            name="Status"
                            sx={{ width: "150px" }}
                            size="small"
                            onChange={(e) =>
                              handleStatusChange(index, e.target.value)
                            }
                          >
                            <MenuItem value="Approval"> Approval </MenuItem>
                            <MenuItem value="Damage"> Damage </MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell sx={{ p: 1 }} align="right">
                          <TextField
                            size="small"
                            type="text"
                            fullWidth
                            sx={{ width: "150px" }}
                            name=""
                            onChange={(e) =>
                              handleRemarkChange(index, e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {(Number(row.totalPrice) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  {/* <TableFooter>
                    <TableHead>
                      <TableRow>
                        <TableCell align="right" colSpan="9">
                          Total
                        </TableCell>
                        <TableCell>1000</TableCell>
                      </TableRow>
                    </TableHead>
                  </TableFooter> */}
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} my={3}>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  textTransform: "capitalize",
                  borderRadius: "2px",
                  m: "0 5px",
                  color: "#fff !important",
                }}
                onClick={() => handleSubmit()}
              >
                submit
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default GRNCreate;
