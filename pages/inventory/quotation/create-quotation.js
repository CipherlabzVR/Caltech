import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
  Modal,
  Paper,
  Radio,
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import useApi from "@/components/utils/useApi";
import getNext from "@/components/utils/getNext";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const QuotationCreate = () => {
  const today = new Date();
   const [isDisable, setIsDisable] = useState(false);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [stock, setStock] = useState([]);
  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [quotationDate, setQuotationDate] = useState(formatDate(today));
  const [quoNo, setQuoNo] = useState("");
  const [selectedItem, setSelectedItem] = useState();
  const [remark, setRemark] = useState("");
  const [productId, setProductId] = useState();
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [address3, setAddress3] = useState("");
  const [address4, setAddress4] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [grossTotal, setGrossTotal] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  //API Calls
  const {
    data: customerList,
    loading: customerLoading,
    error: customerError,
  } = useApi("/Customer/GetAllCustomer");
  const {
    data: itemList,
    loading: itemLoading,
    error: itemError,
  } = useApi("/Items/GetAllItems");
  const {
    data: stockBalance,
    loading: stockBalanceLoading,
    error: stockBalanceError,
  } = useApi(
    productId
      ? `/StockBalance/GetAllProductStockBalanceLine?warehouseId=1&productId=${productId}`
      : `/StockBalance/GetAllProductStockBalanceLine?warehouseId=1&productId=1`
  );

  const { data: quotationNo } = getNext(`6`);

  useEffect(() => {
    const gross = selectedRows.reduce((gross, row) => {
      const sellingPrice = Number(row.sellingPrice) || 0; // Replace `sellingPrice` with your field name
      const quantity = Number(row.quantity) || 0; // Replace `quantity` with your field name
      return gross + sellingPrice * quantity;
    }, 0);
    setGrossTotal(gross.toFixed(2));
  }, [selectedRows]);

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/quotation",
    });
  };
  const handleSelect = (item, index) => {
    setSelectedItem(item);
    setSelectedIndex(index);
  };
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {

    if (
      customer != null &&
      selectedRows.some((row) => row.quantity != 0) &&
      quotationDate != ""
    ) {
      const data = {
        CustomerID: 123,
        CustomerCode: "CUST001",
        CustomerName: customer?.firstName || "N/A",
        DocumentNo: "QUO-001",
        DocumentDate: quotationDate,
        Remark: remark,
        BillToline1: address1,
        BillToline2: address2,
        BillToline3: address3,
        BillToline4: address4,
        WarehouseId: 1,
        WarehouseCode: "WH001",
        WarehouseName: "Main Warehouse",
        Discountamount: 50.0,
        DiscountPercentage: 5.0,
        GrossTotal: parseFloat(grossTotal),
        NetTotal: parseFloat(grossTotal),
        QuotationLineDetails: selectedRows.map((row, index) => ({
          DocumentNo: quoNo,
          ProductId: row.id,
          ProductName: row.productName,
          ProductCode: row.productCode,
          WarehouseId: 1,
          WarehouseCode: "WH001",
          WarehouseName: "Main Warehouse",
          UnitPrice: row.unitPrice,
          Qty: row.quantity,
          DiscountAmount: 0.0,
          DiscountPercentage: 0.0,
          LineTotal: row.totalPrice,
          SequanceNo: index + 1,
          StockBalanceId: row.id,
          SellingPrice: row.sellingPrice,
        })),
      };
      if (data.QuotationLineDetails.length === 0) {
        toast.error("At least one item must be added to the table.");
      } else {
        try {
          setIsSubmitting(true);
          const response = await fetch(
            `${BASE_URL}/Quotation/CreateQuotation`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          if (response.ok) {
            const jsonResponse = await response.json();
            if (jsonResponse.result.result != "") {
              setIsDisable(true);
              toast.success(jsonResponse.result.message);
              setTimeout(() => {
                window.location.href = "/inventory/quotation";
              }, 1500);
            } else {
              toast.error(jsonResponse.result.message);
            }
          } else {
            toast.error("Please fill all required fields");
          }
        } catch (error) {
          console.error("Error:", error);
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      if (quotationDate === "") {
        toast.error("Please Select Quotation Date.");
      }
      if (customer === null) {
        toast.error("Please Select Customer.");
      } else {
        toast.error("Quantity cannot be Zero");
      }
    }
  };
  const handleCheckStockBalance = (item) => {
    setOpen(true);
    setProductId(item.id);
    setProductName(item.name);
    setProductCode(item.code);
  };

  const handleAddRow = (item) => {
    const newRow = {
      ...item,
      quantity: 1,
      totalPrice: item.costPrice,
      stockBalanceId: item.id,
      batchNumber: item.batchNumber,
      productName: item.productName,
    };
    setSelectedRows((prevRows) => [...prevRows, newRow]);
    setTotal((prevTotal) => prevTotal + newRow.totalPrice);
    setOpen(false);
  };
  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    const oldTotalPrice = row.totalPrice;

    row.quantity = newQuantity;
    row.totalPrice = parseFloat(row.sellingPrice) * newQuantity;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - row.rowTotal);
  };

  useEffect(() => {
    if (customerList) {
      setCustomers(customerList);
    }
    if (itemList) {
      setItems(itemList);
    }
    if (quotationNo) {
      setQuoNo(quotationNo);
    }
    if (stockBalance) {
      setStock(stockBalance);
      setSelectedItem(stockBalance[0]);
    }
  }, [itemList, itemList, quotationNo, stockBalance]);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Quotation Create</h1>
        <ul>
          <li>
            <Link href="/inventory/quotation">Quotation</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Quotation No: {quoNo}
                </Typography>
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
                Customer
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                options={customers}
                getOptionLabel={(option) => option.firstName || ""}
                value={customer}
                onChange={(event, newValue) => {
                  setCustomer(newValue);
                  if (newValue) {
                    setAddress1(newValue.addressLine1 || "");
                    setAddress2(newValue.addressLine2 || "");
                    setAddress3(newValue.addressLine3 || "");
                  } else {
                    setAddress1("");
                    setAddress2("");
                    setAddress3("");
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    placeholder="Search Customer"
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
                Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
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
              <Grid container>
                <Grid
                  display="flex"
                  justifyContent="space-between"
                  item
                  xs={12}
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
                    Bill to
                  </Typography>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 1"
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                  />
                </Grid>
                <Grid display="flex" justifyContent="end" mt={1} item xs={12}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 2"
                    value={address2}
                    onChange={(e) => setAddress2(e.target.value)}
                  />
                </Grid>
                <Grid display="flex" justifyContent="end" mt={1} item xs={12}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 3"
                    value={address3}
                    onChange={(e) => setAddress3(e.target.value)}
                  />
                </Grid>
                <Grid display="flex" justifyContent="end" mt={1} item xs={12}>
                  <TextField
                    sx={{ width: "60%" }}
                    size="small"
                    fullWidth
                    placeholder="Address Line 4"
                    value={address4}
                    onChange={(e) => setAddress4(e.target.value)}
                  />
                </Grid>
              </Grid>
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
                    handleCheckStockBalance(value);
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
                        Product&nbsp;Code
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Exp&nbsp;Date
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Unit&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Selling&nbsp;Price
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>
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
                          {row.productCode}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.productName}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="text"
                            sx={{ width: "150px" }}
                            fullWidth
                            value={row.batchNumber}
                            disabled
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "150px" }}
                            size="small"
                            type="date"
                            fullWidth
                            name=""
                            value={formatDate(row.expiryDate)}
                            disabled
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
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.unitPrice}
                        </TableCell>

                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            name=""
                            sx={{ width: "150px" }}
                            value={row.sellingPrice}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {(Number(row.totalPrice) || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow>
                      <TableCell align="right" colSpan="9">
                        <Typography fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {grossTotal}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} my={3}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Typography sx={{ fontWeight: "bold", my: 2, fontSize: "1.2rem" }}>
              {productName} - {productCode}
            </Typography>
            <TableContainer component={Paper}>
              <Table
                size="small"
                aria-label="simple table"
                className="dark-table"
              >
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>Batch No</TableCell>
                    <TableCell>EXP Date</TableCell>
                    <TableCell>Stock Balance</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stock
                    .sort(
                      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
                    )
                    .map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.batchNumber}</TableCell>
                        <TableCell>{formatDate(item.expiryDate)}</TableCell>
                        <TableCell>{item.bookBalanceQuantity}</TableCell>
                        <TableCell>
                          <Radio
                            name="stockSelection"
                            onChange={() => handleSelect(item, index)}
                            value={item.id}
                            checked={selectedIndex === index}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box display="flex" mt={3} justifyContent="space-between">
            <Button variant="outlined" onClick={handleClose}>
              <Typography sx={{ fontWeight: "bold" }}>Cancel</Typography>
            </Button>
            <Button
              variant="contained"
              disabled={stock.length === 0}
              onClick={() => handleAddRow(selectedItem)}
            >
              <Typography sx={{ fontWeight: "bold" }}>Add</Typography>
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default QuotationCreate;

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 400 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};
