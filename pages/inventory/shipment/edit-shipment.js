import React, { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
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
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { useRouter } from "next/router";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const ShipmentEdit = () => {
  const [shipmentLineDetails, setShipmentLineDetails] = useState([]);
  const [isDisable, setIsDisable] = useState(false);
  const [userEnteredZeros, setUserEnteredZeros] = useState(new Set());
  const [order, setOrder] = useState({});
  const [referenceNo, setReferenceNo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remark, setRemark] = useState("");
  const [status, setStatus] = useState(null);
  const [currencyId, setCurrencyId] = useState("");
  const [exchangeRateInput, setExchangeRateInput] = useState("");
  const [localTransport, setLocalTransport] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const router = useRouter();
  const { data: isSupplierInvolvedToShipment } = IsAppSettingEnabled(
    "IsSupplierInvolvedToShipment"
  );
  const showSupplierFields = isSupplierInvolvedToShipment === true;

  const round2 = (value) =>
    Math.round((value + Number.EPSILON) * 100) / 100;

  const sumQtyWeightedCost = (lines, field) =>
    lines.reduce(
      (sum, row) =>
        sum +
        (parseFloat(row[field]) || 0) * (parseFloat(row.qty) || 0),
      0
    );

  const effectiveExchangeRate = useMemo(() => {
    const rate = parseFloat(exchangeRateInput);
    if (isNaN(rate) || rate <= 0) {
      return null;
    }
    return rate;
  }, [exchangeRateInput]);

  const isExchangeRateInvalid =
    showSupplierFields &&
    (!exchangeRateInput ||
      exchangeRateInput === "" ||
      effectiveExchangeRate == null);

  const getCalculatedUnitPrice = (row) => {
    if (!showSupplierFields) {
      return row.unitPrice;
    }
    if (row.supplierUnitPrice == null || effectiveExchangeRate == null) {
      return null;
    }
    return parseFloat(row.supplierUnitPrice) * effectiveExchangeRate;
  };

  const applyLineTotals = (row) => {
    const unitPrice = getCalculatedUnitPrice(row);
    const freightDutyCost = row.freightDutyCost || 0;
    const receivedQty = row.receivedQty || 0;

    if (showSupplierFields) {
      const additionalCost = row.additionalCost || 0;
      const localTransportCost = row.localTransportCost || 0;
      const orderedQty = parseFloat(row.qty) || 0;
      const unitAndFreight = (unitPrice || 0) + freightDutyCost;
      return {
        ...row,
        unitPrice,
        costPrice: unitAndFreight,
        lineTotal:
          receivedQty * unitAndFreight +
          additionalCost * orderedQty +
          localTransportCost * orderedQty,
      };
    }

    const additionalCost = row.additionalCost || 0;
    const cost = (unitPrice || 0) + additionalCost + freightDutyCost;

    return {
      ...row,
      unitPrice,
      costPrice: cost,
      lineTotal: receivedQty * cost,
    };
  };

  const recalculateDistributions = (
    lines,
    overseasTransportVal,
    localTransportVal,
    exchangeRate
  ) => {
    const totalOrderedQty = lines.reduce(
      (sum, row) => sum + (parseFloat(row.qty) || 0),
      0
    );

    if (totalOrderedQty <= 0 || lines.length === 0) {
      return lines.map((row) =>
        applyLineTotals({
          ...row,
          additionalCost: 0,
          localTransportCost: 0,
        })
      );
    }

    const overseasTotal =
      (parseFloat(overseasTransportVal) || 0) * (parseFloat(exchangeRate) || 0);
    const localTotal = parseFloat(localTransportVal) || 0;
    const overseasUnitCost = round2(overseasTotal / totalOrderedQty);
    const localUnitCost = round2(localTotal / totalOrderedQty);

    return lines
      .map((row) => ({
        ...row,
        additionalCost: overseasUnitCost,
        localTransportCost: localUnitCost,
      }))
      .map((row) => applyLineTotals(row));
  };

  const recalculateAllLines = (lines) => lines.map((row) => applyLineTotals(row));
  const shipmentStatusTypes = [
    { name: "Order", value: 1 },
    { name: "Invoice", value: 2 },
    { name: "Warehouse Issued", value: 3 },
    { name: "Dispatched", value: 4 },
    { name: "Arrive", value: 5 },
    { name: "Cusotomer Warehouse", value: 6 },
    { name: "Completed", value: 7 },
  ];

  const navigateToBack = () => {
    router.push({
      pathname: "/inventory/shipment",
    });
  };
  const { id } = router.query;

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Currency/GetAllCurrency?SkipCount=0&MaxResultCount=1000&Search=null`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch currencies");
      }

      const data = await response.json();
      let list = [];
      if (data.result?.items) {
        list = data.result.items;
      } else if (Array.isArray(data.result)) {
        list = data.result;
      }
      setCurrencies(list.filter((currency) => currency.isActive !== false));
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const fetchShipmentNote = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ShipmentNote/GetShipmentOrderById?id=${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      const result = data.result;
      const shipmentDetailsWithLineTotal = result.shipmentNoteLineDetails.map(
        (row) => ({
          ...row,
          receivedQty: row.receivedQty === 0 ? null : row.receivedQty,
          unitPrice: row.unitPrice === 0 ? null : row.unitPrice,
          damagedQty: row.damagedQty || null,
        })
      );

      setOrder(data.result);
      setReferenceNo(result.referanceNo);
      setRemark(result.remark);
      setStatus(result.status);
      setCurrencyId(result.currencyId ?? "");
      setLocalTransport(
        result.localTransport != null && result.localTransport !== ""
          ? String(result.localTransport)
          : ""
      );
      setExchangeRateInput(
        result.exchangeRate != null && result.exchangeRate !== ""
          ? String(result.exchangeRate)
          : ""
      );
      setShipmentLineDetails(shipmentDetailsWithLineTotal);
    } catch (error) {
      console.error("Error fetching :", error);
    }
  };
  useEffect(() => {
    if (id) {
      fetchShipmentNote();
    }
  }, [id]);

  useEffect(() => {
    if (showSupplierFields) {
      fetchCurrencies();
    }
  }, [showSupplierFields]);

  useEffect(() => {
    if (shipmentLineDetails.length === 0) return;
    setShipmentLineDetails((prev) => {
      if (showSupplierFields) {
        return recalculateDistributions(
          prev,
          order.overseasTransport,
          localTransport,
          effectiveExchangeRate
        );
      }
      return recalculateAllLines(prev);
    });
  }, [
    showSupplierFields,
    currencyId,
    effectiveExchangeRate,
    localTransport,
    order.overseasTransport,
  ]);

  const handleCurrencyChange = (newCurrencyId) => {
    setCurrencyId(newCurrencyId);
  };

  const handleChange = (index, field, value) => {
    if (showSupplierFields && field === "unitPrice") {
      return;
    }

    const updatedShipmentLineDetails = [...shipmentLineDetails];
    
    if (field === "damagedQty") {
      const maxDamagedQty =
        updatedShipmentLineDetails[index].qty -
        (updatedShipmentLineDetails[index].receivedQty ?? 0);
      const damagedValue = parseFloat(value) || null;
      if (damagedValue && damagedValue > maxDamagedQty) {
        toast.info("Damaged Quantity cannot exceed the difference between Ordered and Received Quantity.");
        return;
      }
    }
    
    // Allow 0 to be explicitly set, but keep empty fields as null
    let parsedValue;
    if (value === "" || value === null || value === undefined) {
      parsedValue = null;
      // Remove from userEnteredZeros if field is cleared
      if (field === "receivedQty" || field === "unitPrice") {
        setUserEnteredZeros(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${index}-${field}`);
          return newSet;
        });
      }
    } else {
      parsedValue = parseFloat(value);
      parsedValue = isNaN(parsedValue) ? null : parsedValue;
      // Track if user explicitly set 0
      if (parsedValue === 0 && (field === "receivedQty" || field === "unitPrice")) {
        setUserEnteredZeros(prev => new Set(prev).add(`${index}-${field}`));
      } else if (parsedValue !== 0 && (field === "receivedQty" || field === "unitPrice")) {
        // Remove from tracking if value is no longer 0
        setUserEnteredZeros(prev => {
          const newSet = new Set(prev);
          newSet.delete(`${index}-${field}`);
          return newSet;
        });
      }
    }
    updatedShipmentLineDetails[index][field] = parsedValue;

    updatedShipmentLineDetails[index] = applyLineTotals(
      updatedShipmentLineDetails[index]
    );

    setShipmentLineDetails(updatedShipmentLineDetails);
  };

  const finalTotal = shipmentLineDetails.reduce(
    (total, row) => total + row.lineTotal,
    0
  );

  const additionalCostTotal = useMemo(() => {
    if (showSupplierFields) {
      return sumQtyWeightedCost(shipmentLineDetails, "additionalCost");
    }
    return shipmentLineDetails.reduce(
      (sum, row) =>
        sum +
        (parseFloat(row.additionalCost) || 0) *
          (parseFloat(row.receivedQty) || 0),
      0
    );
  }, [shipmentLineDetails, showSupplierFields]);

  const localTransportCostTotal = useMemo(
    () =>
      showSupplierFields
        ? sumQtyWeightedCost(shipmentLineDetails, "localTransportCost")
        : 0,
    [shipmentLineDetails, showSupplierFields]
  );

  const freightDutyTotal = useMemo(
    () =>
      shipmentLineDetails.reduce(
        (sum, row) =>
          sum +
          (parseFloat(row.freightDutyCost) || 0) *
            (parseFloat(row.receivedQty) || 0),
        0
      ),
    [shipmentLineDetails]
  );

  const distributionFormulas = useMemo(() => {
    const totalOrderedQty = shipmentLineDetails.reduce(
      (sum, row) => sum + (parseFloat(row.qty) || 0),
      0
    );
    const overseasTransportVal = parseFloat(order.overseasTransport) || 0;
    const exchangeRate = effectiveExchangeRate || 0;
    const localTransportVal = parseFloat(localTransport) || 0;
    const overseasTotal = round2(overseasTransportVal * exchangeRate);
    const overseasUnitCost =
      totalOrderedQty > 0 ? round2(overseasTotal / totalOrderedQty) : null;
    const localTransportUnitCost =
      totalOrderedQty > 0 ? round2(localTransportVal / totalOrderedQty) : null;

    return {
      totalOrderedQty,
      overseasTransportVal,
      exchangeRate,
      localTransportVal,
      overseasTotal,
      overseasUnitCost,
      localTransportUnitCost,
    };
  }, [
    shipmentLineDetails,
    order.overseasTransport,
    effectiveExchangeRate,
    localTransport,
  ]);

  const columnHeaderFormulaSx = {
    display: "block",
    mt: 0.5,
    fontSize: "10px",
    fontWeight: 400,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.4,
    whiteSpace: "normal",
  };

  const handleSubmit = async () => {
    let hasInvalidReceivedQty = false;
    let hasInvalidUnitPrice = false;

    shipmentLineDetails.forEach((row) => {
      if (row.receivedQty != null && row.receivedQty < 0) {
        hasInvalidReceivedQty = true;
      }

      if (showSupplierFields) {
        const calculatedUnitPrice = getCalculatedUnitPrice(row);
        if (calculatedUnitPrice != null && calculatedUnitPrice < 0) {
          hasInvalidUnitPrice = true;
        }
      } else if (
        row.unitPrice == null ||
        row.unitPrice === undefined ||
        row.unitPrice < 0
      ) {
        hasInvalidUnitPrice = true;
      }
    });

    if (hasInvalidReceivedQty) {
      toast.info("Received Quantity cannot be negative.");
      return;
    }

    if (hasInvalidUnitPrice) {
      toast.info(
        showSupplierFields
          ? "Unit cost requires supplier price and currency exchange rate."
          : "Please enter valid values (0 or greater) for Unit Cost."
      );
      return;
    }

    if (showSupplierFields && !currencyId) {
      toast.error("Please select a currency.");
      return;
    }

    if (showSupplierFields && isExchangeRateInvalid) {
      toast.error("Please enter an exchange rate greater than zero.");
      return;
    }

    const invalidDamagedQty = shipmentLineDetails.find((row) => {
      const maxDamagedQty = row.qty - (row.receivedQty ?? 0);
      return row.damagedQty && row.damagedQty > maxDamagedQty;
    });

    if (invalidDamagedQty) {
      toast.info(
        "Damaged Quantity cannot exceed the difference between Ordered and Received Quantity."
      );
      return;
    }

    if (showSupplierFields) {
      const overseasTransportVal = parseFloat(order.overseasTransport) || 0;

      if (
        overseasTransportVal > 0 &&
        (!effectiveExchangeRate || effectiveExchangeRate <= 0)
      ) {
        toast.error(
          "Exchange Rate is required when Overseas Transport is specified."
        );
        return;
      }

      const overseasExpected =
        overseasTransportVal * (effectiveExchangeRate || 0);
      const overseasActual = sumQtyWeightedCost(
        shipmentLineDetails,
        "additionalCost"
      );
      const localExpected = parseFloat(localTransport) || 0;
      const localActual = sumQtyWeightedCost(
        shipmentLineDetails,
        "localTransportCost"
      );

      if (Math.abs(overseasActual - overseasExpected) > 0.01) {
        toast.error(
          "Overseas Cost lines do not reconcile with Overseas Transport × Exchange Rate. Shipment cannot be saved."
        );
        return;
      }

      if (Math.abs(localActual - localExpected) > 0.01) {
        toast.error(
          "Local Transport Cost lines do not reconcile with Local Transport value. Shipment cannot be saved."
        );
        return;
      }
    }

    const data = {
      Id: id,
      documentNo: order.documentNo,
      supplierCode: "0",
      supplierName: order.supplierName,
      warehouseCode: order.warehouseCode,
      warehouseName: order.warehouseName,
      shipmentDate: order.shipmentDate,
      status: status,
      ...(showSupplierFields && currencyId
        ? {
            CurrencyId: Number(currencyId),
            OverseasTransport: order.overseasTransport ?? null,
            LocalTransport:
              localTransport === "" ? null : parseFloat(localTransport),
            ExchangeRate: effectiveExchangeRate,
          }
        : {}),
      shipmentNoteLineDetails: shipmentLineDetails.map((row) => ({
        Id: row.id,
        shipmentNoteId: row.shipmentNoteId,
        grnHeaderId: row.grnHeaderId,
        purchaseOrderNo: row.purchaseOrderNo,
        documentNo: row.documentNo,
        warehouseCode: row.warehouseCode,
        warehouseName: row.warehouseName,
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        qty: row.qty,
        receivedQty: row.receivedQty ?? 0,
        damagedQty : row.damagedQty,
        freightDutyCost: row.freightDutyCost,
        additionalCost: row.additionalCost,
        ...(showSupplierFields
          ? { LocalTransportCost: row.localTransportCost ?? 0 }
          : {}),
        LineTotal: row.lineTotal,
        CostPrice: row.costPrice,
        UnitPrice: row.unitPrice,
        Remark: row.remark,
      })),
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `${BASE_URL}/ShipmentNote/UpdateShipmentNote`,
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
          toast.success(jsonResponse.result.message);
          await fetchShipmentNote();
        } else {
          toast.error(jsonResponse.result.message);
        }
      } else {
        const errorBody = await response.json().catch(() => ({}));
        toast.error(
          errorBody.message ||
            errorBody.result?.message ||
            "Please fill all required fields"
        );
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Shipment Note Edit</h1>
        <ul>
          <li>
            <Link href="/inventory/shipment">Shipment Note</Link>
          </li>
          <li>Edit</li>
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
                  Shipment No: {order.documentNo}
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
              <TextField
                disabled
                fullWidth
                value={order.supplierName}
                sx={{ width: "60%" }}
                size="small"
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
                value={formatDate(order.shipmentDate)}
                disabled
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
                type="text"
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
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
                fullWidth
              >
                {shipmentStatusTypes.map((statusType) => (
                  <MenuItem key={statusType.value} value={statusType.value}>
                    {statusType.name}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            {showSupplierFields ? (
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
                  Overseas Transport (Supplier)
                </Typography>
                <TextField
                  disabled
                  fullWidth
                  value={order.overseasTransport ?? ""}
                  sx={{ width: "60%" }}
                  size="small"
                />
              </Grid>
            ) : null}
            
            
            {showSupplierFields ? (
              <Grid item xs={12} lg={6} mt={1}>
                <Box display="flex" justifyContent="space-between">
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
                    Currency
                  </Typography>
                  <Box
                    sx={{
                      width: "60%",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Select
                      value={currencyId}
                      onChange={(e) => handleCurrencyChange(e.target.value)}
                      sx={{ width: "50%" }}
                      size="small"
                      displayEmpty
                    >
                      <MenuItem value="">
                        <em>Select Currency</em>
                      </MenuItem>
                      {currencies.map((currency) => (
                        <MenuItem key={currency.id} value={currency.id}>
                          {currency.currencyName || currency.name} ({currency.code})
                        </MenuItem>
                      ))}
                    </Select>
                    <TextField
                      type="number"
                      value={exchangeRateInput}
                      onChange={(e) => setExchangeRateInput(e.target.value)}
                      size="small"
                      placeholder="0.00"
                      label="Exc. Rate"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 0, step: "0.0001" }}
                      error={isExchangeRateInvalid}
                      sx={{
                        width: "50%",
                        "& .MuiInputBase-root": {
                          height: 40,
                        },
                        "& .MuiInputLabel-root": {
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        },
                        "& input": {
                          fontWeight: 700,
                          fontSize: "14px",
                          color: isExchangeRateInvalid ? undefined : "#757fef",
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ) : null}

            {showSupplierFields ? (
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
                  Local Transport
                </Typography>
                <TextField
                  type="number"
                  value={localTransport}
                  onChange={(e) => setLocalTransport(e.target.value)}
                  sx={{ width: "60%" }}
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  placeholder="0.00"
                />
              </Grid>
            ) : null}

            <Grid item xs={12} mt={2}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>#</TableCell>
                      <TableCell sx={{ color: "#fff" }}>PO No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        Product&nbsp;Name{" "}
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Ordered Qty</TableCell>
                      {showSupplierFields ? (
                        <TableCell sx={{ color: "#fff" }}>Supplier Price</TableCell>
                      ) : null}
                      <TableCell sx={{ color: "#fff" }}>Unit Cost</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Received Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Damaged Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>
                        {showSupplierFields ? (
                          <>
                            Overseas Cost
                            <Typography component="span" sx={columnHeaderFormulaSx}>
                              Unit = (Overseas Transport × Exc. Rate) ÷ Total Ordered Qty
                              {distributionFormulas.overseasUnitCost != null
                                ? ` (${formatCurrency(distributionFormulas.overseasUnitCost)})`
                                : ""}
                            </Typography>
                            <Typography component="span" sx={columnHeaderFormulaSx}>
                              Total = Σ(Unit × Ordered Qty)
                            </Typography>
                          </>
                        ) : (
                          "Additional Cost"
                        )}
                      </TableCell>
                      {showSupplierFields ? (
                        <TableCell sx={{ color: "#fff" }}>
                          Local Transport Cost
                          <Typography component="span" sx={columnHeaderFormulaSx}>
                            Unit = Local Transport ÷ Total Ordered Qty
                            {distributionFormulas.localTransportUnitCost != null
                              ? ` (${formatCurrency(distributionFormulas.localTransportUnitCost)})`
                              : ""}
                          </Typography>
                          <Typography component="span" sx={columnHeaderFormulaSx}>
                            Total = Σ(Unit × Ordered Qty)
                          </Typography>
                        </TableCell>
                      ) : null}
                      <TableCell sx={{ color: "#fff" }}>
                        Freight Duty Cost
                        <Typography component="span" sx={columnHeaderFormulaSx}>
                          Unit = Entered per line
                        </Typography>
                        <Typography component="span" sx={columnHeaderFormulaSx}>
                          Line = Unit × Received Qty
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                      <TableCell sx={{ color: "#fff" }} align="right">
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shipmentLineDetails.map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell sx={{ p: 1 }}>{index + 1}</TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.purchaseOrderNo}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.productName}
                        </TableCell>
                        <TableCell sx={{ p: 1 }} component="th" scope="row">
                          {row.qty}
                        </TableCell>
                        {showSupplierFields ? (
                          <TableCell sx={{ p: 1 }} align="right">
                            {row.supplierUnitPrice != null
                              ? formatCurrency(row.supplierUnitPrice)
                              : ""}
                          </TableCell>
                        ) : null}
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={
                              row.unitPrice === null || row.unitPrice === undefined
                                ? ""
                                : row.unitPrice
                            }
                            fullWidth
                            size="small"
                            disabled={showSupplierFields}
                            inputProps={{ min: 0, step: "0.01" }}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "unitPrice",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={
                              row.receivedQty === null || row.receivedQty === undefined
                                ? ""
                                : row.receivedQty === 0 && !userEnteredZeros.has(`${index}-receivedQty`)
                                ? ""
                                : row.receivedQty
                            }
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, step: "0.01" }}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "receivedQty",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                         <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={row.damagedQty === 0 || row.damagedQty === null ? "" : row.damagedQty}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, max: row.qty - row.receivedQty }}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "damagedQty",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={
                              row.additionalCost === 0 || row.additionalCost === null
                                ? ""
                                : row.additionalCost
                            }
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, step: "0.01" }}
                            onChange={(e) =>
                              handleChange(
                                index,
                                "additionalCost",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        {showSupplierFields ? (
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              type="number"
                              value={
                                row.localTransportCost === 0 ||
                                row.localTransportCost === null
                                  ? ""
                                  : row.localTransportCost
                              }
                              fullWidth
                              size="small"
                              inputProps={{ min: 0, step: "0.01" }}
                              onChange={(e) =>
                                handleChange(
                                  index,
                                  "localTransportCost",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                        ) : null}
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={row.freightDutyCost === 0 || row.freightDutyCost === null ? "" : row.freightDutyCost}
                            fullWidth
                            size="small"
                            onChange={(e) =>
                              handleChange(
                                index,
                                "freightDutyCost",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="text"
                            value={row.remark}
                            fullWidth
                            size="small"
                            onChange={(e) =>
                              handleChange(
                                index,
                                "remark",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ p: 1 }}>
                          {formatCurrency(row.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {shipmentLineDetails.length > 0 && (
                <Box
                  sx={{
                    borderTop: "1px solid",
                    borderColor: "divider",
                    bgcolor: "#fff",
                    pr: 1,
                    py: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 2,
                      py: 0.5,
                    }}
                  >
                    <Typography variant="h6">
                      {showSupplierFields
                        ? "Overseas Cost Total"
                        : "Additional Cost Total"}
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(additionalCostTotal)}
                    </Typography>
                  </Box>
                  {showSupplierFields ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 2,
                        py: 0.5,
                      }}
                    >
                      <Typography variant="h6">
                        Local Transport Cost Total
                      </Typography>
                      <Typography variant="h6">
                        {formatCurrency(localTransportCostTotal)}
                      </Typography>
                    </Box>
                  ) : null}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 2,
                      py: 0.5,
                    }}
                  >
                    <Typography variant="h6">Freight Duty Total</Typography>
                    <Typography variant="h6">
                      {formatCurrency(freightDutyTotal)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 2,
                      py: 0.5,
                    }}
                  >
                    <Typography variant="h6">Total</Typography>
                    <Typography variant="h6">
                      {formatCurrency(finalTotal || null)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} my={3}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable || (showSupplierFields && isExchangeRateInvalid)}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ShipmentEdit;
