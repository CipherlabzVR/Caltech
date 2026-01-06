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
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Modal,
  Box,
  Checkbox,
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
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

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

const ShipmentCreate = () => {
  const today = new Date();
   const [isDisable, setIsDisable] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [shipmentDate, setShipmentDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [shipmentNo, setShipmentNo] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [open, setOpen] = React.useState(false);
  const [status] = useState(1);
  const [selectedPOProducts, setSelectedPOProducts] = React.useState();
  const handleClose = () => setOpen(false);
  const router = useRouter();
  const { data: shipmentNum } = getNext(`11`);
  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/shipment",
    });
  };

  const { data: supplierList } = useApi("/Supplier/GetAllSupplier");

  const handleAlert = (event) => {
    if (!supplier) {
      toast.info("Please Select Supplier");
    }
  };
  const handleSubmit = async () => {
    const data = {
      DocumentNo: shipmentNo,
      SupplierId: supplier.id,
      SupplierCode: "0",
      SupplierName: supplier.name,
      WarehouseId: 1,
      WarehouseCode: "WH001",
      WarehouseName: "Main Warehouse",
      ShipmentDate: shipmentDate,
      InventoryPeriodId: "1",
      TotalAmount: "0",
      Status: 1,
      ReferanceNo: referenceNo,
      Remark: remark,
      shipmentNoteLineDetails: selectedRows.map((row, index) => ({
        ShipmentNoteId: 1,
        GRNHeaderId: row.grnHeaderID,
        PurchaseOrderNo: row.purchaseOrderNo,
        DocumentNo: shipmentNo,
        SequenceNumber: 20,
        WarehouseId: row.warehouseId,
        Batch: row.batch,
        ExpDate: row.expDate,
        WarehouseCode: row.warehouseCode,
        warehouseName: row.warehouseName,
        productId: row.id,
        productCode: row.productCode,
        productName: row.name,
        qty: row.requestQty,
      })),
    };

    if (!supplier) {
      toast.error("Please Select Supplier");
      return;
    }

    if (data.shipmentNoteLineDetails.length === 0) {
      toast.error("At least one item must be added to the table.");
      return;
    }

    try {
        setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/ShipmentNote/CreateShipmentNote`,
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
            window.location.href = "/inventory/shipment";
          }, 1500);
        } else {
          toast.error(jsonResponse.result.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    }finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQty = (event, index) => {
    const value = Number(event.target.value);
    const updatedPOProducts = [...selectedPOProducts];

    const getMax =
      selectedPOProducts[index].qty -
      (selectedPOProducts[index].orderedQty || 0);
    updatedPOProducts[index].requestQty = value > getMax ? getMax : value;
    updatedPOProducts[index].isChecked =
      value > getMax ? false : updatedPOProducts[index].isChecked;

    setSelectedPOProducts(updatedPOProducts);
  };

  const handleCheckboxChange = (event, index) => {
    const updatedPOProducts = [...selectedPOProducts];
    const getMax =
      selectedPOProducts[index].qty -
      (selectedPOProducts[index].orderedQty || 0);
    if (updatedPOProducts[index].requestQty <= getMax) {
      updatedPOProducts[index].isChecked = event.target.checked;
      setSelectedPOProducts(updatedPOProducts);
    }
  };
  const handleContinue = () => {
    const selectedProducts = selectedPOProducts
      .filter((product) => product.isChecked)
      .map((product) => ({
        id: product.productId,
        itemId: product.id,
        name: product.productName,
        batch: product.batch,
        expDate : product.expDate,
        code: product.productCode,
        quantity: product.qty,
        requestQty: product.requestQty,
        purchaseOrderNo: product.purchaseOrderNo,
        productCode: product.productCode,
        warehouseCode: product.warehouseCode,
        warehouseId: product.warehouseId,
        warehouseName: product.warehouseName,
        documentNo: product.documentNo,
        grnHeaderID: product.grnHeaderID,
      }));

    if (selectedProducts.length === 0) {
      toast.error("Select at least one item to continue.");
      return;
    }

    let isDuplicate = false;
    setSelectedRows((prev) => {
      const newRows = selectedProducts.filter((product) => {
        if (prev.some((row) => row.itemId === product.id)) {
          isDuplicate = true;
          return false;
        }
        return true;
      });

      return [...prev, ...newRows];
    });

    handleClose();
  };

  useEffect(() => {
    if (shipmentNum) {
      setShipmentNo(shipmentNum);
    }
    if (supplierList) {
      setSuppliers(supplierList);
    }
  }, [shipmentNum, supplierList]);

  const handleGetOrderList = (item) => {
    if (item) {
      fetchItemsBySupplier(item.id);
    }
  };

  const fetchItemsBySupplier = async (supplier) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Unauthorized access. Please login.");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/GetAllPurchaseOrderBySupplierId?supplierId=${supplier}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse && jsonResponse.result) {
          setFilteredItems(jsonResponse.result);
        }
      }
    } catch (error) {
      console.error("Error fetching Purchase Orders:", error);
      toast.error("An error occurred while fetching Purchase Orders.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenModel = (value) => {
    const productsWithRequestQty = value.goodReceivedNoteLineDetails.map(
      (product) => {
        const matchingRow = selectedRows.find(
          (row) =>
            row.purchaseOrderNo === product.purchaseOrderNo &&
            row.itemId === product.id
        );

        if (matchingRow) {
          return {
            ...product,
            requestQty: matchingRow.requestQty,
            isAdded: true,
          };
        }

        return product;
      }
    );
    setSelectedPOProducts(productsWithRequestQty);
    setOpen(true);
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
        <h1>Shipment Note Create</h1>
        <ul>
          <li>
            <Link href="/inventory/shipment">Shipment Note</Link>
          </li>
          <li>Shipment Note Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item gap={2} xs={12} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Shipment No: {shipmentNo}
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
                Supplier
              </Typography>
              <Autocomplete
                sx={{ width: "60%" }}
                options={suppliers}
                getOptionLabel={(option) => option.name || ""}
                value={supplier}
                onChange={(event, newValue) => {
                  setSupplier(newValue);
                  handleGetOrderList(newValue);
                }}
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
                Shipment Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
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
                Status
              </Typography>
              <Select
                disabled
                value={status}
                sx={{ width: "60%" }}
                size="small"
                fullWidth
              >
                <MenuItem value={1}>Order</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} mt={3}>
              <Autocomplete
                sx={{ mt: 3, mb: 1 }}
                options={filteredItems}
                getOptionLabel={(option) => option.purchaseOrderNo || ""}
                loading={loadingItems}
                onChange={(event, value) => {
                  if (value) {
                    handleOpenModel(value);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    fullWidth
                    onChange={(event) => handleAlert(event)}
                    placeholder="Search Purchase Order"
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
                      <TableCell sx={{ color: "#fff" }}>PO Number</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name{" "}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
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
                          {row.purchaseOrderNo}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.name}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>{row.requestQty}</TableCell>
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
          <Grid>
            <TableContainer 
              component={Paper}
              sx={{ maxHeight: 400, overflow: "auto" }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Requested Qty</TableCell>
                    <TableCell>Ordered Qty</TableCell>
                    <TableCell>Shipment Qty</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedPOProducts?.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Typography>
                          {product.productCode} - {product.productName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={product.qty}
                          disabled
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          disabled
                          fullWidth
                          type="number"
                          value={product.orderedQty ? product.orderedQty : 0}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth
                          type="number"
                          min="1"
                          max="10"
                          size="small"
                          disabled={product.isAdded ? product.isAdded : false}
                          value={product.requestQty}
                          onChange={(e) => handleUpdateQty(e, index)}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          disabled={product.isAdded ? product.isAdded : false}
                          checked={product.isChecked || false}
                          onChange={(event) => handleCheckboxChange(event, index)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
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
            <Button variant="contained" onClick={handleContinue}>
              CONTINUE
            </Button>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default ShipmentCreate;
