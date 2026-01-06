import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
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
  Modal,
  Box,
  Radio,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import getNext from "@/components/utils/getNext";
import useApi from "@/components/utils/useApi";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchItemByName from "@/components/utils/SearchItemByName";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const StockTransferCreate = () => {
  const today = new Date();
  const warehouse = localStorage.getItem("warehouse");
  const [isDisable, setIsDisable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productId, setProductId] = useState(null);
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [warehouses, setWarehouses] = useState([]);
  const [fromWarehouse, setFromWarehouse] = useState(warehouse);
  const [toWarehouse, setToWarehouse] = useState(null);
  const [referenceNo, setReferenceNo] = useState("");
  const [transferDate, setTransferDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [transferNo, setTransfertNo] = useState("");
  const [stockBalance, setStockBalance] = useState([]);
  const [selectedItem, setSelectedItem] = useState();
  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const { data: warehouseList } = useApi("/Warehouse/GetAllWarehouse");
  const router = useRouter();
  const { data: transferNum } = getNext(`27`);
  const [selectedRows, setSelectedRows] = useState([]);
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled(
    "IsExpireDateAvailable"
  );
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled(
    "IsBatchNumberAvailable"
  );

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/stock-transfer",
    });
  };
  const handleSubmit = async () => {
    if (toWarehouse == null) {
      toast.warning("Please Select Warehouse to Transfer");
      return;
    }
    const invalidCCQty = selectedRows.some(r => !r.quantity || r.quantity <= 0);
    if (invalidCCQty) return toast.error("Please add quantity for all Items.");

    const data = {
      DocumentNo: transferNum,
      FromWarehouse: warehouse,
      FromWarehouseName: "",
      ToWarehouse: toWarehouse,
      ToWarehouseName: "",
      RefferanceNo: referenceNo || "",
      TransferDate: transferDate,
      Remark: remark || "",
      InventoryPeriodId: 1,
      WarehouseId: warehouse,
      StockTransferNoteLineDetails: selectedRows.map((row, index) => ({
        TransferHeaderID: 1,
        DocumentNo: transferNum,
        SequenceNumber: row.seqNumber,
        WarehouseId: row.warehouseId,
        StockBalanceId: row.stockBalanceId,
        WarehouseCode: row.warehouseCode,
        WarehouseName: row.warehouseName,
        ProductId: row.productId,
        ProductCode: row.productCode,
        ProductName: row.productName,
        Batch: row.batchNumber,
        ExpDate: row.expDate,
        UnitPrice: row.unitPrice,
        CostPrice: row.costPrice,
        SellingPrice: row.sellingPrice,
        MaximumRetailPrice: row.maximumRetailPrice,
        TransferQuantity: row.quantity,
        DiscountRate: row.discount,
        DiscountAmount: row.discountAmount,
        AdditionalCost: row.additionalCost,
        AverageCostPrice: 0.0,
        IsNonInventoryItem: row.isNonInventoryItem,
        SupplierId: row.supplierID,
        SupplierName: row.supplierName
      })),
    }

    if (data.StockTransferNoteLineDetails.length === 0) {
      toast.error("At least one item must be added to the table.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/StockTransferNote/CreateStockTransferNote`,
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
            window.location.href = "/inventory/stock-transfer";
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

  };
  const handleAddRow = (item) => {
    item = stockBalance[selectedIndex];
    const isDuplicate = selectedRows.some(
      (row) => row.stockBalanceId === item.id
    );

    if (isDuplicate) {
      toast.warning("This item is already added.");
      return;
    }
    const newRow = {
      ...item,
      quantity: "",
      stockBalanceId: item.id,
      productName: item.productName || "",
      seqNumber: item.sequenceNumber,
      remark: "",
    };

    setSelectedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      return updatedRows;
    });

    setOpen(false);
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    row.quantity = parseInt(newQuantity);
    setSelectedRows(updatedRows);
  };

  useEffect(() => {
    if (transferNum) {
      setTransfertNo(transferNum);
    }
    if (warehouseList) {
      setWarehouses(warehouseList);
    }
  }, [transferNum, warehouseList]);

  const handleSelect = (item, index) => {
    setSelectedItem(item);
    setSelectedIndex(index);
  };

  const fetchStockList = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=1&productId=${id}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch items");

      const data = await response.json();
      setStockBalance(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };


  const handleCheckStockBalance = (item) => {
    setOpen(true);
    setProductId(item.id);
    fetchStockList(item.id);
    setProductName(item.name);
    setProductCode(item.code);
    setSelectedIndex(0);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    setSelectedRows(updatedRows);
  };


  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Stock Transfer Note Create</h1>
        <ul>
          <li>
            <Link href="/inventory/stock-transfer">Stock Transfer Note</Link>
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
          <Grid container p={1} spacing={1}>
            <Grid item gap={2} xs={12} display="flex" justifyContent="space-between">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Transfer No: {transferNo}
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
            >
              <Typography display="flex" alignItems="center">
                Transfer Date :
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
            >
              <Typography display="flex" alignItems="center">
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
            >
              <Typography display="flex" alignItems="center">
                From:
              </Typography>
              <Select disabled sx={{ width: "60%" }} size="small" fullWidth value={fromWarehouse} onChange={(e) => setFromWarehouse(e.target.value)}>
                {warehouses.length === 0 ?
                  <MenuItem>No Warehouses Available</MenuItem>
                  : (warehouses.map((warehouse, index) => (
                    <MenuItem disabled={warehouse.id == toWarehouse} key={index} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  )))}
              </Select>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
            >
              <Typography display="flex" alignItems="center">
                To:
              </Typography>
              <Select sx={{ width: "60%" }} size="small" fullWidth value={toWarehouse} onChange={(e) => setToWarehouse(e.target.value)}>
                {warehouses.length === 0 ?
                  <MenuItem>No Warehouses Available</MenuItem>
                  : (warehouses.map((warehouse, index) => (
                    <MenuItem disabled={warehouse.id == fromWarehouse} key={index} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  )))}
              </Select>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
            >
              <Typography display="flex" alignItems="center">
                Remark:
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} mt={2}>
              <SearchItemByName
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsWithoutZeroQty`}
                onSelect={(item) => {
                  handleCheckStockBalance(item);
                }}
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
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Supplier</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Cost Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Selling Price</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Stock Balance</TableCell>
                      <TableCell align="right" sx={{ color: "#fff" }}>Transfer Qty</TableCell>
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
                          {row.productName}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.supplierName}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {formatCurrency(row.costPrice)}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {formatCurrency(row.sellingPrice)}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.bookBalanceQuantity}
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }} component="th" scope="row">
                          <TextField
                            sx={{ width: '150px' }}
                            size="small"
                            type="number"
                            value={row.quantity}
                            inputProps={{
                              min: 1,
                              max: row.bookBalanceQuantity,
                            }}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);

                              if (!isNaN(value)) {
                                const newValue = Math.min(value, row.bookBalanceQuantity);
                                handleQuantityChange(index, newValue);
                              } else {
                                handleQuantityChange(index, '');
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
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
          <Grid item xs={12}>
            <Typography sx={{ fontWeight: "bold", my: 1, fontSize: "1.2rem" }}>
              {productName} - {productCode}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    {IsBatchNumberAvailable && (
                      <TableCell>Batch No</TableCell>
                    )}
                    {IsExpireDateAvailable && (
                      <TableCell>EXP Date</TableCell>
                    )}
                    <TableCell>Stock Balance</TableCell>
                    <TableCell>Selling Price</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stockBalance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="error">No stock available</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockBalance
                      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))
                      .map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          {IsBatchNumberAvailable && (
                            <TableCell>{item.batchNumber}</TableCell>
                          )}
                          {IsExpireDateAvailable && (
                            <TableCell>{formatDate(item.expiryDate)}</TableCell>
                          )}
                          <TableCell>{item.bookBalanceQuantity}</TableCell>
                          <TableCell>Rs. {formatCurrency(item.sellingPrice)}</TableCell>
                          <TableCell>
                            <Radio
                              name="stockSelection"
                              onChange={() => handleSelect(item, index)}
                              value={item.id}
                              checked={selectedIndex === index}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          <Grid
            item
            xs={12}
            mt={2}
            display="flex"
            justifyContent="space-between"
          >
            <Button variant="contained" color="error" onClick={handleClose}>
              CLOSE
            </Button>
            <Button
              variant="contained"
              disabled={stockBalance.length === 0}
              onClick={() => handleAddRow(selectedItem)}
            >
              <Typography sx={{ fontWeight: "bold" }}>Add</Typography>
            </Button>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default StockTransferCreate;
