import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import { v4 as uuidv4 } from 'uuid';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Modal,
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import getNext from "@/components/utils/getNext";
import useApi from "@/components/utils/useApi";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import GetAllSalesPersons from "@/components/utils/GetAllSalesPerson";
import SearchDropdown from "@/components/utils/SearchDropdown";
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CloseIcon from '@mui/icons-material/Close';


const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 400, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const GRNCreate = () => {
  const { data: salesPersonList } = GetAllSalesPersons();
  const guidRef = useRef(uuidv4());
  const today = new Date();
  const [grossTotal, setGrossTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [freight, setFreight] = useState(0);
  const [suppliers, setSuppliers] = useState([]);
  const [serialNumbers, setSerialNumbers] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [salesPerson, setSalesPerson] = useState({});
  const [items, setItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [total, setTotal] = useState(0);
  const [finalDiscountPercent, setFinalDiscountPercent] = useState(0);
  const [finalDiscountAmount, setFinalDiscountAmount] = useState(0);
  const [finalGrossTotal, setFinalGrossTotal] = useState(0);
  const [supplier, setSupplier] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [grnDate, setGrnDate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [isCredit, setIsCredit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grnNo, setGrnNo] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const router = useRouter();
  const [isDisable, setIsDisable] = useState(false);
  const { data: goodsRNo } = getNext(`4`);
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled(
    "IsExpireDateAvailable"
  );
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled(
    "IsBatchNumberAvailable"
  );
  const { data: IsFreightDutyEnabled } = IsAppSettingEnabled(
    "IsFreightDutyEnabled"
  );
  const { data: IsSupplierSalesRef } =
    IsAppSettingEnabled("IsSupplierSalesRef");

  const { data: IsEnableCreditGRN } =
    IsAppSettingEnabled("IsEnableCreditGRN");

  const handleDiscountChange = (e) => {
    let value = parseFloat(e.target.value) || 0;
    if (value > 100) value = 100;
    if (value < 0) value = 0;

    setFinalDiscountPercent(value);

    const discountAmt = (grossTotal * value) / 100;
    setFinalDiscountAmount(discountAmt);

    const finalTotal = parseFloat(grossTotal) - parseFloat(discountAmt);
    setFinalGrossTotal(finalTotal);
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/grn",
    });
  };

  const handleOpenSerialNo = (list, rowIndex) => {
    setOpen(true);
    setEditingRowIndex(rowIndex);
    setSerialNumbers(list);
  }

  const handleSaveSerials = () => {
    const updatedRows = [...selectedRows];
    updatedRows[editingRowIndex].itemsSerialNo = serialNumbers;
    setSelectedRows(updatedRows);

    const emptySerials = serialNumbers.filter(
      (item, index) => !item.SerialNo || item.SerialNo.trim() === ""
    );

    if (emptySerials.length > 0) {
      toast.warning("Please Enter Serial No For All");
    } else {
      setOpen(false);
    }
  };

  const {
    data: itemList,
    loading: itemLoading,
    error: itemError,
  } = useApi("/Items/GetAllItems");

  const {
    data: supplierList,
    loading: supplierListLoading,
    error: supplierListError,
  } = useApi("/Supplier/GetAllSupplier");


  const handleSubmit = async () => {
    const data = {
      DocumentNo: grnNo,
      SupplierId: supplier ? supplier.id : "",
      SupplierCode: "2",
      SupplierName: supplier ? supplier.name : "",
      ReferanceNo: referenceNo,
      GRNDate: grnDate,
      Remark: remark,
      WarehouseId: 102,
      WarehouseCode: "WH002",
      WarehouseName: "Secondary Warehouse",
      InventoryPeriodId: 1,
      TotalAmount: grossTotal,
      Discount: parseFloat(finalDiscountPercent),
      SalesPerson: salesPerson ? salesPerson.id : null,
      FormSubmitId: guidRef.current,
      isCredit: IsEnableCreditGRN ? isCredit : false,
      GoodReceivedNoteLineDetails: selectedRows.map((row, index) => ({
        GRNHeaderID: 2,
        DocumentNo: "GRN-0002",
        SequenceNumber: index + 1,
        WarehouseId: row.warehouseId,
        WarehouseCode: "WH002",
        WarehouseName: "Secondary Warehouse",
        ProductId: row.id,
        ProductCode: row.code,
        ProductName: row.name,
        Batch: row.batchNumber,
        ExpDate: row.expDate,
        UnitPrice: row.averagePrice,
        AdditionalCost: freight,
        CostPrice: row.costPrice,
        SellingPrice: row.sellingPrice,
        MaximumSellingPrice: row.maxSellingPrice,
        Qty: row.quantity,
        Free: row.free || 0,
        DiscountRate: row.discount,
        DiscountAmount: row.discountAmount,
        Status: row.status,
        Remark: row.remark,
        LineTotal: row.totalPrice,
        ItemsSerialNo: row.itemsSerialNo || null,
        AverageCostPrice: 0.0,
        IsNonInventoryItem: row.isNonInventoryItem,
      })),
    };


    if (data.GoodReceivedNoteLineDetails.length === 0) {
      toast.error("At least one item must be added to the table.");
      return;
    }
    if (
      IsSupplierSalesRef &&
      (!salesPerson || Object.keys(salesPerson).length === 0)
    ) {
      toast.warning("Please Select Sales Person");
      return;
    }

    let hasEmptySerial = false;

    data.GoodReceivedNoteLineDetails.forEach((line) => {
      if (Array.isArray(line.ItemsSerialNo)) {
        for (const serial of line.ItemsSerialNo) {
          if (!serial.SerialNo || serial.SerialNo.trim() === "") {
            hasEmptySerial = true;
            break;
          }
        }
      }
    });

    if (hasEmptySerial) {
      toast.warning("Please Enter Serial Numbers");
      return;
    }
    const invalidRows = data.GoodReceivedNoteLineDetails.filter(
      (line) => line.SellingPrice === undefined || line.SellingPrice <= 0
    );

    if (invalidRows.length > 0) {
      toast.error("All line details must have a selling price.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/CreateGoodReceivedNote`,
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
            window.location.href = "/inventory/grn";
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

  const handleSupplierChange = (supplierId) => {
    const filteredSalespersons = salesPersonList.filter(
      (person) => person.supplier === supplierId
    );
    setSalesPersons(filteredSalespersons);
  };

  useEffect(() => {
    const gross = selectedRows.reduce(
      (gross, row) => gross + (Number(row.totalPrice) || 0),
      0
    );
    const totalDis = (gross * finalDiscountPercent) / 100;
    const finalGross = parseFloat(gross) - parseFloat(totalDis);
    setFinalDiscountAmount(totalDis);
    setFinalGrossTotal(finalGross);
    setGrossTotal(gross.toFixed(2));
  }, [selectedRows]);

  useEffect(() => {
    if (goodsRNo) {
      setGrnNo(goodsRNo);
    }
    if (itemList) {
      setItems(itemList);
    }
    if (supplierList) {
      setSuppliers(supplierList);
    }
  }, [goodsRNo, itemList]);

  useEffect(() => {
    if (supplier && supplier.id) {
      setLoadingItems(true);

      const fetchItemsBySupplier = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            toast.error("Unauthorized access. Please login.");
            return;
          }

          const response = await fetch(
            `${BASE_URL}/Items/GetAllItemsBySupplierId?supplierId=${supplier.id}`,
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
            } else {
              toast.error("No data available for this supplier.");
            }
          } else {
            toast.error("Failed to fetch items for the selected supplier.");
          }
        } catch (error) {
          console.error("Error fetching items:", error);
          toast.error("An error occurred while fetching items.");
        } finally {
          setLoadingItems(false);
        }
      };

      fetchItemsBySupplier();
    } else {
      setFilteredItems([]);
    }
  }, [supplier]);

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
    if (supplier !== "") {
      const newRow = {
        ...item,
        quantity: "",
        totalPrice: item.averagePrice,
        costPrice: item.averagePrice,
        status: "Approved",
        remark: "",
      };
      setSelectedRows((prevRows) => [...prevRows, newRow]);
      setTotal((prevTotal) => prevTotal + newRow.totalPrice);
    } else {
      toast.error("Supplier information is missing!");
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];
    const oldTotalPrice = parseFloat(row.totalPrice) || 0;

    row.quantity = newQuantity;

    const avg = Number(row.averagePrice) || 0;
    const discount = Number(row.discount) || 0;
    const discountAmount = ((avg * newQuantity * discount) / 100).toFixed(2);
    row.discountAmount = discountAmount;
    const total = row.averagePrice * newQuantity - parseFloat(discountAmount);
    row.totalPrice = total;

    const x = parseFloat(avg);
    const y = x * parseFloat(newQuantity) - parseFloat(discountAmount);
    const z = parseFloat(newQuantity) + parseFloat(row.free || 0);

    const costP = y / z;

    row.costPrice = costP;

    if (!Array.isArray(row.itemsSerialNo)) row.itemsSerialNo = [];

    if (row.hasSerialNumbers) {
      if (row.itemsSerialNo.length > newQuantity) {
        row.itemsSerialNo = row.itemsSerialNo.slice(0, newQuantity);
      } else {
        for (let i = row.itemsSerialNo.length; i < newQuantity; i++) {
          row.itemsSerialNo.push({
            ProductId: row.id,
            ProductName: row.name,
            SerialNo: "",
            GRNId: null,
            GRNLineId: null,
            GRNDocumentNo: "",
            WarehouseId: null,
            GRNDate: null
          });
        }
      }
    }

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);


  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - row.rowTotal);
  };
  const handleFreightChange = (index, newPrice) => {
    setFreight(newPrice);
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];

    const oldTotalPrice = parseFloat(row.totalPrice) || 0;
    const averagePrice = parseFloat(row.averagePrice) || 0;
    const quantity = parseFloat(row.quantity) || 0;
    // const costPF = averagePrice + (parseFloat(newPrice) || 0);
    const x = parseFloat(averagePrice) + parseFloat(newPrice);
    const y = x * row.quantity - parseFloat(row.discountAmount);
    const z = parseFloat(row.quantity) + parseFloat(row.free || 0);

    const costP = y / z;

    row.costPrice = costP;
    row.freight = newPrice;
    row.totalPrice = costP * quantity;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);
  };

  const handleUnitPriceChange = (index, newPrice) => {
    const updatedRows = [...selectedRows];
    const row = { ...updatedRows[index] };

    const oldTotalPrice = parseFloat(row.totalPrice) || 0;
    const quantity = parseFloat(row.quantity) || 0;
    const freightCost = parseFloat(freight) || 0;
    const unitPrice = parseFloat(newPrice) || 0;
    const avg = Number(unitPrice) || 0;
    const discount = Number(row.discount) || 0;
    const discountAmount = ((avg * row.quantity * discount) / 100).toFixed(2);
    row.discountAmount = discountAmount;
    const x = Number(newPrice) + parseFloat(freightCost || 0);
    const y = x * row.quantity - parseFloat(row.discountAmount);
    const z = parseFloat(row.quantity) + parseFloat(row.free || 0);

    const costP = y / z;
    row.costPrice = costP;
    row.averagePrice = unitPrice;
    const total = newPrice * row.quantity - parseFloat(discountAmount);
    row.totalPrice = total;

    updatedRows[index] = row;

    setSelectedRows(updatedRows);
    setTotal((prevTotal) => prevTotal - oldTotalPrice + row.totalPrice);
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Goods Receive Note Create</h1>
        <ul>
          <li>
            <Link href="/inventory/grn">Goods Receive Note</Link>
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
            <Grid item gap={2} xs={12} display="flex" justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  GRN No: {grnNo}
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
                disableClearable
                onChange={(event, newValue) => {
                  setSupplier(newValue);
                  if (newValue?.id) {
                    handleSupplierChange(newValue.id);
                  }
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
            {IsSupplierSalesRef && (
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
                  Sales Person
                </Typography>
                <TextField
                  select
                  sx={{ width: "60%" }}
                  size="small"
                  fullWidth
                  value={salesPerson?.id || ""}
                  onChange={(e) => {
                    const selected = salesPersons.find(
                      (p) => p.id === e.target.value
                    );
                    setSalesPerson(selected);
                  }}
                  placeholder="Search Sales Person"
                >
                  <MenuItem value="">Select Sales Person</MenuItem>
                  {salesPersons.map((person) => (
                    <MenuItem key={person.id} value={person.id}>
                      {person.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

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
            {IsEnableCreditGRN ? <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Box sx={{ marginLeft: '10px' }}>
                <FormControlLabel control={<Checkbox checked={isCredit} onChange={(e) => setIsCredit(e.target.checked)} />} label="Credit Payment" />
              </Box>
            </Grid> : ""}

            <Grid item xs={12} mt={3} mb={1}>
              <SearchDropdown
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsBySupplierIdAndName`}
                queryParams={{ supplierId: supplier?.id }}
                onSelect={(item) => handleAddRow(item)}
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
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name
                      </TableCell>
                      {IsBatchNumberAvailable && (
                        <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      )}
                      {IsExpireDateAvailable && (
                        <TableCell sx={{ color: "#fff" }}>
                          Exp&nbsp;Date
                        </TableCell>
                      )}
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Free</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Unit&nbsp;Price
                      </TableCell>

                      <TableCell sx={{ color: "#fff" }}>Discount (%)</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Discount</TableCell>
                      {IsFreightDutyEnabled && (
                        <TableCell sx={{ color: "#fff" }}>
                          Freight&nbsp;Duty & Transport
                        </TableCell>
                      )}
                      <TableCell sx={{ color: "#fff" }}>
                        Cost&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Selling&nbsp;Price
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Status</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Total&nbsp;Cost
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
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.name}
                        </TableCell>
                        {IsBatchNumberAvailable && (
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
                        )}
                        {IsExpireDateAvailable && (
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
                        )}
                        <TableCell sx={{ p: 1, display: 'flex', gap: '5px' }}>
                          <TextField
                            sx={{ width: "100px" }}
                            type="number"
                            size="small"
                            value={row.quantity}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              if (inputValue === "") {
                                handleQuantityChange(index, "");
                                return;
                              }
                              const newValue = Number(inputValue);
                              handleQuantityChange(
                                index,
                                newValue > 0 ? newValue : 1
                              );
                            }}
                            onBlur={(e) => {
                              const value = Number(e.target.value);
                              if (!value || value <= 0) {
                                handleQuantityChange(index, 1);
                              }
                            }}
                            inputProps={{
                              min: 1,
                            }}
                          />
                          {row.hasSerialNumbers && row.quantity > 0 ?
                            <IconButton onClick={() => handleOpenSerialNo(row.itemsSerialNo, index)}>
                              <FormatListNumberedIcon color="primary" fontSize="inherit" />
                            </IconButton>
                            : ""}
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            sx={{ width: "100px" }}
                            size="small"
                            type="number"
                            fullWidth
                            name=""
                            value={row.free || "0"}
                            onChange={(e) => {
                              const updatedRows = [...selectedRows];
                              updatedRows[index].free = e.target.value;
                              setSelectedRows(updatedRows);
                              const x = parseFloat(
                                updatedRows[index].averagePrice
                              );
                              const y =
                                x * updatedRows[index].quantity -
                                parseFloat(
                                  updatedRows[index].discountAmount || 0
                                );
                              const z =
                                parseFloat(row.quantity) +
                                parseFloat(e.target.value || 0);

                              const costP = y / z;

                              row.costPrice = costP;
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
                            value={selectedRows[index]?.averagePrice || ""}
                            onChange={(e) =>
                              handleUnitPriceChange(
                                index,
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>

                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="number"
                            fullWidth
                            sx={{ width: "150px" }}
                            name=""
                            inputProps={{ max: 100, min: 0 }}
                            value={row.discount === 0 ? 0 : row.discount || ""}
                            onChange={(e) => {
                              const input = e.target.value;
                              const value =
                                input === "" ? "" : Math.max(0, Math.min(100, parseFloat(input)));

                              const updatedRows = [...selectedRows];
                              updatedRows[index].discount = value;

                              if (value === "") {
                                setSelectedRows(updatedRows);
                                return;
                              }

                              const quantity = Number(updatedRows[index].quantity) || 0;
                              const averagePrice = Number(updatedRows[index].averagePrice) || 0;

                              const totalPrice = averagePrice * quantity;
                              const discountAmount = (totalPrice * value) / 100;

                              const total = totalPrice - discountAmount;
                              row.totalPrice = total;

                              const y = averagePrice * quantity - discountAmount;
                              const z =
                                parseFloat(row.quantity) + parseFloat(updatedRows[index].free || 0);
                              const costP = y / z;

                              row.costPrice = costP;
                              updatedRows[index].discountAmount = discountAmount.toFixed(2);
                              setSelectedRows(updatedRows);
                            }}
                          />

                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          {row.discountAmount || "0"}
                        </TableCell>
                        {IsFreightDutyEnabled && (
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              size="small"
                              type="number"
                              fullWidth
                              name=""
                              sx={{ width: "150px" }}
                              value={selectedRows[index]?.freight || ""}
                              onChange={(e) =>
                                handleFreightChange(index, e.target.value)
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell sx={{ p: 1 }}>
                          {formatCurrency(selectedRows[index]?.costPrice) || 0}
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
                            <MenuItem value="Approved"> Approved </MenuItem>
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
                    <TableRow>
                      <TableCell
                        align="right"
                        colSpan={
                          11 +
                          (IsBatchNumberAvailable ? 1 : 0) +
                          (IsExpireDateAvailable ? 1 : 0) +
                          (IsFreightDutyEnabled ? 1 : 0)
                        }
                      >
                        <Typography fontWeight="bold">Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {grossTotal}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        align="right"
                        colSpan={
                          11 +
                          (IsBatchNumberAvailable ? 1 : 0) +
                          (IsExpireDateAvailable ? 1 : 0) +
                          (IsFreightDutyEnabled ? 1 : 0)
                        }
                      >
                        <Typography fontWeight="bold">Discount(%)</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={finalDiscountPercent}
                          onChange={handleDiscountChange}
                          inputProps={{ max: 100, min: 0 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        align="right"
                        colSpan={
                          11 +
                          (IsBatchNumberAvailable ? 1 : 0) +
                          (IsExpireDateAvailable ? 1 : 0) +
                          (IsFreightDutyEnabled ? 1 : 0)
                        }
                      >
                        <Typography fontWeight="bold">
                          Discount Amount
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {formatCurrency(finalDiscountAmount)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        align="right"
                        colSpan={
                          11 +
                          (IsBatchNumberAvailable ? 1 : 0) +
                          (IsExpireDateAvailable ? 1 : 0) +
                          (IsFreightDutyEnabled ? 1 : 0)
                        }
                      >
                        <Typography fontWeight="bold">Gross Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ p: 1 }}>
                        {finalGrossTotal === 0 && finalDiscountPercent != 100
                          ? formatCurrency(grossTotal)
                          : formatCurrency(finalGrossTotal)}
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
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Grid container>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: "12px" }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "500",
                  }}
                >
                  Enter Serial Numbers
                </Typography>
                <IconButton
                  onClick={() => setOpen(false)}
                  size="small"
                  sx={{ color: "text.primary" }}
                  aria-label="close"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ maxHeight: "50vh", overflowY: "scroll" }}>
                <Grid container>
                  <Grid item xs={12}>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>#</TableCell>
                            <TableCell>Serial Number</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {serialNumbers.map((item, index) => (
                            <TableRow>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={item.SerialNo}
                                  onChange={(e) => {
                                    const updatedSerials = [...serialNumbers];
                                    updatedSerials[index].SerialNo = e.target.value;
                                    setSerialNumbers(updatedSerials);
                                  }} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid
              display="flex"
              justifyContent="space-between"
              item
              xs={12}
              p={1}
            >
              <Button onClick={() => setOpen(false)} variant="outlined" size="small">
                Close
              </Button>
              <Button onClick={handleSaveSerials} variant="contained" size="small">
                Save
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
};

export default GRNCreate;
