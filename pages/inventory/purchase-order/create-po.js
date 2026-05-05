import React, { useEffect, useRef, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import getNext from "@/components/utils/getNext";
import useApi from "@/components/utils/useApi";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchDropdown from "@/components/utils/SearchDropdown";
import { v4 as uuidv4 } from 'uuid';
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import AddSupplier from "@/pages/master/supplier/AddSupplier";

const POCreate = () => {
  var isSubmitted = false;
  const guidRef = useRef(uuidv4());
  const today = new Date();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [poDate, setPODate] = useState(formatDate(today));
  const [remark, setRemark] = useState("");
  const [purchaseOrderNo, setPurchaseOrderNo] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const router = useRouter();
  const { data: pOrderNo } = getNext(`9`);
  const [poType, setPOType] = useState("");
  const [isDisable, setIsDisable] = useState(false);
  const [isCredit, setIsCredit] = useState(false);
  const supplierButtonRef = useRef(null);

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/purchase-order",
    });
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

  const { data: IsEnableCreditGRN } =
    IsAppSettingEnabled("IsEnableCreditGRN");
  const { data: banks } = useApi("/Bank/GetAllBanks");
  const { data: chartOfAccounts } = useApi("/ChartOfAccounts/GetAllChartOfAccountsForDropdown");
  const { data: IsPOSSystem } = IsAppSettingEnabled("IsPOSSystem");
  const { data: IsBankRequired } = IsAppSettingEnabled("IsBankRequired");

  const refreshSupplierList = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/Supplier/GetAllSupplier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const json = await response.json();
        const list = json?.result || json?.data || json || [];
        setSuppliers(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Error refreshing suppliers:", err);
    }
  };

  const handleOpenSupplierModal = () => {
    if (supplierButtonRef.current) {
      const button = supplierButtonRef.current.querySelector("button");
      if (button) {
        button.click();
      }
    }
  };

  const handleSubmit = async () => {
    if (!isSubmitted) {
      const data = {
        SupplierId: supplier ? supplier.id : "",
        SupplierCode: "2",
        SupplierName: supplier ? supplier.name : "",
        ReferanceNo: referenceNo,
        PODate: poDate,
        Remark: remark,
        PurchasingOrderType: parseInt(poType),
        WarehouseId: 102,
        WarehouseCode: "WH002",
        WarehouseName: "Secondary Warehouse",
        InventoryPeriodId: 1,
        PurchaseOrderNo: purchaseOrderNo,
        GRNQty: 0,
        TotalQty: 0,
        IsPurchasingOrderComplete: false,
        FormSubmitId: guidRef.current,
        IsCredit: IsEnableCreditGRN ? isCredit : false,
        GoodReceivedNoteLineDetails: selectedRows.map((row, index) => ({
          GRNHeaderID: 2,
          PurchaseOrderNo: purchaseOrderNo,
          SequenceNumber: index + 1,
          WarehouseId: 102,
          WarehouseCode: "WH002",
          WarehouseName: "Secondary Warehouse",
          ProductId: row.id,
          ProductCode: row.code,
          ProductName: row.name,
          Batch: row.batchNumber,
          ExpDate: row.expDate,
          Qty: row.quantity,
          UnitPrice: row.unitPrice ? parseFloat(row.unitPrice) : 0,
          AdditionalCost: row.freightDutyCost ? parseFloat(row.freightDutyCost) : 0,
          CostPrice: row.costPrice ? parseFloat(row.costPrice) : 0,
          Status: "Approval",
          Remark: row.remark,
          ReceivedQty: 0,
          isAllReceived: false,
        })),
      };

      if (data.GoodReceivedNoteLineDetails.length === 0) {
        toast.error("At least one item must be added to the table.");
        return;
      }

      if (!data.PurchasingOrderType) {
        toast.error("Please select purchasing order type.");
        return;
      }

      try {
        setIsSubmitting(true);
        const response = await fetch(
          `${BASE_URL}/GoodReceivedNote/CreatePurchaseOrder`,
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
          isSubmitted = true;
          const jsonResponse = await response.json();
          if (jsonResponse.result.result != "") {
            setIsDisable(true);
            toast.success(jsonResponse.result.message);
            setTimeout(() => {
              window.location.href = "/inventory/purchase-order";
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
  };

  useEffect(() => {
    if (pOrderNo) {
      setPurchaseOrderNo(pOrderNo);
    }
    if (supplierList) {
      setSuppliers(supplierList);
    }
    if (itemList) {
      setItems(itemList);
    }
  }, [pOrderNo, supplierList, itemList]);

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

  const handleAddRow = (item) => {
    if (supplier !== "") {
      const newRow = {
        ...item,
        quantity: 1,
        status: "Approval",
        remark: "",
      };
      setSelectedRows((prevRows) => [...prevRows, newRow]);
    } else {
      toast.error("Supplier information is missing!");
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows[index];

    row.quantity = newQuantity;

    setSelectedRows(updatedRows);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...selectedRows];
    const row = updatedRows.splice(index, 1)[0];

    setSelectedRows(updatedRows);
  };
  const handlePOTypeChange = (value) => {
    setPOType(value);
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Purchase Order Create</h1>
        <ul>
          <li>
            <Link href="/inventory/purchase-order">Purchase Order</Link>
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
                  PO No: {purchaseOrderNo}
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
                getOptionLabel={(option) => {
                  if (option?.isCreateOption) return "";
                  return option.name || "";
                }}
                value={supplier}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                disableClearable
                filterOptions={(options, params) => {
                  const hasInput = params.inputValue?.trim();
                  let filtered;
                  if (!hasInput) {
                    filtered = options.slice(0, 5);
                  } else {
                    filtered = options.filter((option) =>
                      option.name?.toLowerCase().includes(params.inputValue.toLowerCase())
                    );
                  }
                  return [...filtered, { isCreateOption: true, id: "create-supplier" }];
                }}
                ListboxProps={{
                  sx: { maxHeight: 280, "& .create-option-sticky": { position: "sticky", bottom: 0, background: "background.paper", borderTop: "1px solid", borderColor: "divider", zIndex: 1 } },
                }}
                renderOption={(props, option) => {
                  if (option.isCreateOption) {
                    return (
                      <Box
                        component="li"
                        {...props}
                        className="create-option-sticky"
                        sx={{
                          color: "primary.main",
                          fontWeight: 500,
                          py: 1.25,
                          px: 2,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                      >
                        <AddIcon sx={{ mr: 1, fontSize: "1.2rem", verticalAlign: "middle" }} />
                        Create Supplier
                      </Box>
                    );
                  }
                  return (
                    <Box component="li" {...props}>
                      {option.name}
                    </Box>
                  );
                }}
                onChange={(event, newValue) => {
                  if (newValue?.isCreateOption) {
                    handleOpenSupplierModal();
                    return;
                  }
                  setSupplier(newValue || "");
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
                PO Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                fullWidth
                value={poDate}
                onChange={(e) => setPODate(e.target.value)}
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
            </Grid>{" "}
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
                PO Type
              </Typography>
              <Select
                value={poType}
                name="POType"
                sx={{ width: "60%" }}
                size="small"
                onChange={(event) => {
                  handlePOTypeChange(event.target.value);
                }}
              >
                <MenuItem value="1"> Local </MenuItem>
                <MenuItem value="2"> Import </MenuItem>
              </Select>
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
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Exp&nbsp;Date
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Qty</TableCell>
                      {poType === "1" && (
                        <>
                          <TableCell sx={{ color: "#fff" }}>Unit&nbsp;Price</TableCell>
                          <TableCell sx={{ color: "#fff" }}>Freight&nbsp;Duty && Transport</TableCell>
                          <TableCell sx={{ color: "#fff" }}>Cost&nbsp;Price</TableCell>
                        </>
                      )}
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
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
                        </TableCell>
                        {poType === "1" && (
                          <>
                            <TableCell sx={{ p: 1 }}>
                              <TextField
                                sx={{ width: "120px" }}
                                type="number"
                                size="small"
                                value={row.unitPrice || ""}
                                onChange={(e) => {
                                  const updatedRows = [...selectedRows];
                                  const unitPrice = parseFloat(e.target.value) || 0;
                                  const freightCost = parseFloat(updatedRows[index].freightDutyCost) || 0;
                                  updatedRows[index].unitPrice = e.target.value;
                                  updatedRows[index].costPrice = (unitPrice + freightCost).toFixed(2);
                                  setSelectedRows(updatedRows);
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              <TextField
                                sx={{ width: "120px" }}
                                type="number"
                                size="small"
                                value={row.freightDutyCost || ""}
                                onChange={(e) => {
                                  const updatedRows = [...selectedRows];
                                  const freightCost = parseFloat(e.target.value) || 0;
                                  const unitPrice = parseFloat(updatedRows[index].unitPrice) || 0;
                                  updatedRows[index].freightDutyCost = e.target.value;
                                  updatedRows[index].costPrice = (unitPrice + freightCost).toFixed(2);
                                  setSelectedRows(updatedRows);
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ p: 1 }}>
                              {row.costPrice || "0.00"}
                            </TableCell>
                          </>
                        )}
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            size="small"
                            type="text"
                            fullWidth
                            name=""
                            onChange={(e) =>
                              handleRemarkChange(index, e.target.value)
                            }
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

      <Box sx={{ display: "none" }}>
        <div ref={supplierButtonRef}>
          <AddSupplier
            fetchItems={refreshSupplierList}
            isPOSSystem={IsPOSSystem}
            banks={banks || []}
            isBankRequired={IsBankRequired}
            chartOfAccounts={chartOfAccounts || []}
            onCreated={(created) => {
              if (created?.id != null) {
                setSupplier(created);
                refreshSupplierList();
              }
            }}
          />
        </div>
      </Box>
    </>
  );
};

export default POCreate;
