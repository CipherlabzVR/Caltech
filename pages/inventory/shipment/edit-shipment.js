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
    Tooltip,
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
    const [persistedStatus, setPersistedStatus] = useState(null);
    const [currencyId, setCurrencyId] = useState("");
    const [exchangeRateInput, setExchangeRateInput] = useState("");
    const [localTransport, setLocalTransport] = useState("");
    const [freightDuty, setFreightDuty] = useState("");
    const [currencies, setCurrencies] = useState([]);
    const [costDrafts, setCostDrafts] = useState({});
    const router = useRouter();
    const { data: isSupplierInvolvedToShipment } = IsAppSettingEnabled(
        "IsSupplierInvolvedToShipment"
    );
    const showSupplierFields = isSupplierInvolvedToShipment === true;

  const round2 = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.round((n + Number.EPSILON) * 100) / 100;
  };

  const getOverseasExpectedTotal = (overseasTransportVal, exchangeRate) =>
    round2(round2(overseasTransportVal) * round2(exchangeRate));

  const roundToWhole = (value) => Math.round(round2(value));

  const amountsMatchIgnoringDecimals = (left, right) =>
    roundToWhole(left) === roundToWhole(right);

  const toTwoDecimals = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const number = Number(value);
    if (isNaN(number)) return "";
    return round2(number).toFixed(2);
  };

  const isNegativeInput = (value) => {
    if (value === "" || value === null || value === undefined) return false;
    const raw = String(value).trim();
    if (raw === "-" || raw.startsWith("-")) return true;
    const n = Number(raw);
    return Number.isFinite(n) && n < 0;
  };

  const rejectIfNegative = (value, message) => {
    if (!isNegativeInput(value)) return false;
    toast.info(message);
    return true;
  };

  const LINE_COST_FIELD_MESSAGES = {
    additionalCost: "Overseas Unit Cost must be 0 or greater.",
    localTransportCost: "Local Transport Unit Cost must be 0 or greater.",
    freightDutyCost: "Freight Duty Unit Cost must be 0 or greater.",
  };

  const getCostFieldDisplay = (row, index, field) => {
    const key = `${index}-${field}`;
    if (Object.prototype.hasOwnProperty.call(costDrafts, key)) {
      return costDrafts[key];
    }
    const val = row[field];
    if (val === 0 || val === null || val === undefined) return "";
    return val;
  };

  const getReceivedQtyValue = (row) => parseFloat(row?.receivedQty) || 0;

  const isZeroReceivedQty = (row) => {
    const raw = row?.receivedQty;
    if (raw === 0) return true;
    const qty = parseFloat(raw);
    return !isNaN(qty) && qty === 0;
  };

  const sumQtyWeightedCost = (lines, field) =>
    round2(
      lines.reduce((sum, row) => {
        const receivedQty = getReceivedQtyValue(row);
        if (receivedQty <= 0) return sum;
        return sum + round2((parseFloat(row[field]) || 0) * receivedQty);
      }, 0)
    );

  const getTotalReceivedQty = (lines) =>
    lines.reduce((sum, row) => {
      const receivedQty = getReceivedQtyValue(row);
      return receivedQty > 0 ? sum + receivedQty : sum;
    }, 0);

  const effectiveExchangeRate = useMemo(() => {
    const rate = parseFloat(exchangeRateInput);
    if (isNaN(rate) || rate <= 0) {
      return null;
    }
    return round2(rate);
  }, [exchangeRateInput]);

    const isExchangeRateInvalid =
        showSupplierFields &&
        (!exchangeRateInput ||
            exchangeRateInput === "" ||
            effectiveExchangeRate == null);

  const getCalculatedUnitPrice = (row) => {
    if (!showSupplierFields) {
      return row.unitPrice == null || row.unitPrice === ""
        ? null
        : round2(row.unitPrice);
    }
    if (row.supplierUnitPrice == null || effectiveExchangeRate == null) {
      return null;
    }
    return round2(parseFloat(row.supplierUnitPrice) * effectiveExchangeRate);
  };

  const applyLineTotals = (row) => {
    const unitPrice = getCalculatedUnitPrice(row);
    const receivedQty = getReceivedQtyValue(row);

    if (isZeroReceivedQty(row)) {
      return {
        ...row,
        unitPrice,
        additionalCost: 0,
        ...(showSupplierFields ? { localTransportCost: 0 } : {}),
        freightDutyCost: 0,
        costPrice: round2(unitPrice || 0),
        lineTotal: 0,
      };
    }

    const freightDutyCost = round2(row.freightDutyCost || 0);
    const additionalCost = round2(row.additionalCost || 0);

    if (showSupplierFields) {
      const localTransportCost = round2(row.localTransportCost || 0);
      const cost = round2(
        (unitPrice || 0) + additionalCost + localTransportCost + freightDutyCost
      );
      return {
        ...row,
        unitPrice,
        additionalCost,
        localTransportCost,
        freightDutyCost,
        costPrice: cost,
        lineTotal: round2(receivedQty * cost),
      };
    }

    const cost = round2((unitPrice || 0) + additionalCost + freightDutyCost);

    return {
      ...row,
      unitPrice,
      additionalCost,
      freightDutyCost,
      costPrice: cost,
      lineTotal: round2(receivedQty * cost),
    };
  };

  const recalculateDistributions = (
    lines,
    overseasTransportVal,
    localTransportVal,
    freightDutyVal,
    exchangeRate
  ) => {
    const totalReceivedQty = getTotalReceivedQty(lines);

    if (totalReceivedQty <= 0 || lines.length === 0) {
      return lines.map((row) =>
        applyLineTotals({
          ...row,
          additionalCost: 0,
          localTransportCost: 0,
          freightDutyCost: 0,
        })
      );
    }

    const overseasTotal = getOverseasExpectedTotal(
      overseasTransportVal,
      exchangeRate
    );
    const localTotal = parseFloat(localTransportVal) || 0;
    const freightTotal = parseFloat(freightDutyVal) || 0;
    const overseasUnitCost = round2(overseasTotal / totalReceivedQty);
    const localUnitCost = round2(localTotal / totalReceivedQty);
    const freightUnitCost = round2(freightTotal / totalReceivedQty);

        return lines
            .map((row) => {
                if (isZeroReceivedQty(row) || getReceivedQtyValue(row) <= 0) {
                    return applyLineTotals({
                        ...row,
                        additionalCost: 0,
                        localTransportCost: 0,
                        freightDutyCost: 0,
                    });
                }
                return applyLineTotals({
                    ...row,
                    additionalCost: overseasUnitCost,
                    localTransportCost: localUnitCost,
                    freightDutyCost: freightUnitCost,
                });
            });
    };

  const recalculateAllLines = (lines) => lines.map((row) => applyLineTotals(row));
  const COMPLETED_STATUS = 7;
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
        router.back();
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
                    receivedQty: row.receivedQty,
                    unitPrice: row.unitPrice === 0 ? null : row.unitPrice,
                    damagedQty: row.damagedQty || null,
                })
            );

      setOrder(data.result);
      setReferenceNo(result.referanceNo);
      setRemark(result.remark);
      setStatus(result.status);
      setPersistedStatus(result.status);
      setCurrencyId(result.currencyId ?? "");
      setLocalTransport(
        result.localTransport != null && result.localTransport !== ""
          ? toTwoDecimals(result.localTransport)
          : ""
      );
      const loadedFreightDutyTotal = shipmentDetailsWithLineTotal.reduce(
        (sum, row) =>
          sum +
          (parseFloat(row.freightDutyCost) || 0) *
            (parseFloat(row.receivedQty) || 0),
        0
      );
      setFreightDuty(
        loadedFreightDutyTotal > 0
          ? toTwoDecimals(roundToWhole(loadedFreightDutyTotal))
          : ""
      );
      setExchangeRateInput(
        result.exchangeRate != null && result.exchangeRate !== ""
          ? toTwoDecimals(result.exchangeRate)
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
        setShipmentLineDetails((prev) => recalculateAllLines(prev));
    }, [
        showSupplierFields,
        currencyId,
        effectiveExchangeRate,
    ]);

    const handleCurrencyChange = (newCurrencyId) => {
        setCurrencyId(newCurrencyId);
    };

    const handleChange = (index, field, value) => {
        if (showSupplierFields && field === "unitPrice") {
            return;
        }

    const updatedShipmentLineDetails = [...shipmentLineDetails];

    if (field === "remark") {
      updatedShipmentLineDetails[index].remark = value;
      setShipmentLineDetails(updatedShipmentLineDetails);
      return;
    }
    
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

      if (
        LINE_COST_FIELD_MESSAGES[field] &&
        (isNegativeInput(value) || (parsedValue != null && parsedValue < 0))
      ) {
        toast.info(LINE_COST_FIELD_MESSAGES[field]);
        return;
      }
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

    const handleCostFieldChange = (index, field, value) => {
      if (rejectIfNegative(value, LINE_COST_FIELD_MESSAGES[field])) return;
      setCostDrafts((prev) => ({ ...prev, [`${index}-${field}`]: value }));
      handleChange(index, field, value);
    };

    const handleCostFieldBlur = (index, field, value) => {
      setCostDrafts((prev) => {
        const next = { ...prev };
        delete next[`${index}-${field}`];
        return next;
      });
      if (value === "") {
        handleChange(index, field, "");
        return;
      }
      if (rejectIfNegative(value, LINE_COST_FIELD_MESSAGES[field])) {
        handleChange(index, field, "");
        return;
      }
      handleChange(index, field, round2(value));
    };

    const finalTotal = shipmentLineDetails.reduce(
        (total, row) => total + row.lineTotal,
        0
    );

    const additionalCostTotal = useMemo(
        () => sumQtyWeightedCost(shipmentLineDetails, "additionalCost"),
        [shipmentLineDetails]
    );

    const localTransportCostTotal = useMemo(
        () =>
            showSupplierFields
                ? sumQtyWeightedCost(shipmentLineDetails, "localTransportCost")
                : 0,
        [shipmentLineDetails, showSupplierFields]
    );

    const freightDutyTotal = useMemo(
        () => sumQtyWeightedCost(shipmentLineDetails, "freightDutyCost"),
        [shipmentLineDetails]
    );

  const distributionFormulas = useMemo(() => {
    const totalReceivedQty = getTotalReceivedQty(shipmentLineDetails);
    const overseasTransportVal = parseFloat(order.overseasTransport) || 0;
    const exchangeRate = effectiveExchangeRate || 0;
    const localTransportVal = parseFloat(localTransport) || 0;
    const freightDutyVal = parseFloat(freightDuty) || 0;
    const overseasTotal = getOverseasExpectedTotal(
      overseasTransportVal,
      exchangeRate
    );
    const overseasUnitCost =
      totalReceivedQty > 0 ? round2(overseasTotal / totalReceivedQty) : null;
    const localTransportUnitCost =
      totalReceivedQty > 0 ? round2(localTransportVal / totalReceivedQty) : null;
    const freightDutyUnitCost =
      totalReceivedQty > 0 ? round2(freightDutyVal / totalReceivedQty) : null;

    return {
      totalReceivedQty,
      overseasTransportVal,
      exchangeRate,
      localTransportVal,
      freightDutyVal,
      overseasTotal,
      overseasUnitCost,
      localTransportUnitCost,
      freightDutyUnitCost,
    };
  }, [
    shipmentLineDetails,
    order.overseasTransport,
    effectiveExchangeRate,
    localTransport,
    freightDuty,
  ]);

    const FormulaHeader = ({ label, formula }) => (
        <Box display="flex" alignItems="center" gap={0.5} sx={{ color: "#fff" }}>
            {label}
            <Tooltip
                title={
                    <Box sx={{ whiteSpace: "pre-line", fontSize: "12px", lineHeight: 1.5 }}>
                        {formula}
                    </Box>
                }
                arrow
                placement="top"
            >
                <Box
                    component="span"
                    sx={{
                        cursor: "help",
                        fontWeight: 700,
                        border: "1px solid rgba(255,255,255,0.9)",
                        borderRadius: "50%",
                        width: 16,
                        height: 16,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        lineHeight: 1,
                        flexShrink: 0,
                    }}
                >
                    i
                </Box>
            </Tooltip>
        </Box>
    );

  const areRequiredFieldsFilled = useMemo(() => {
    if (!shipmentLineDetails.length) {
      return false;
    }

    if (showSupplierFields) {
      if (!currencyId || isExchangeRateInvalid) {
        return false;
      }
    }

    return shipmentLineDetails.every((row) => {
      const receivedQty = parseFloat(row.receivedQty);
      if (
        row.receivedQty == null ||
        row.receivedQty === "" ||
        isNaN(receivedQty) ||
        receivedQty < 0
      ) {
        return false;
      }

      const maxDamagedQty = (parseFloat(row.qty) || 0) - receivedQty;
      if (row.damagedQty && row.damagedQty > maxDamagedQty) {
        return false;
      }

      if (showSupplierFields) {
        const calculatedUnitPrice = getCalculatedUnitPrice(row);
        return calculatedUnitPrice != null && calculatedUnitPrice >= 0;
      }

      return row.unitPrice != null && row.unitPrice >= 0;
    });
  }, [
    shipmentLineDetails,
    showSupplierFields,
    currencyId,
    isExchangeRateInvalid,
    effectiveExchangeRate,
  ]);

  const isShipmentAlreadyCompleted = order?.status === COMPLETED_STATUS;
  const showShipmentCompleteButton =
    status === COMPLETED_STATUS && !isShipmentAlreadyCompleted;

  const handleStatusChange = (newStatus) => {
    if (newStatus !== COMPLETED_STATUS) {
      setPersistedStatus(newStatus);
    }
    setStatus(newStatus);
  };

  const handleSubmit = async ({ complete = false } = {}) => {
    if (complete && !areRequiredFieldsFilled) {
      toast.info("Please fill all required fields before completing the shipment.");
      return;
    }

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

        const hasNegativeHeaderCost =
          (localTransport !== "" && Number(localTransport) < 0) ||
          (freightDuty !== "" && Number(freightDuty) < 0) ||
          (order.overseasTransport !== "" &&
            order.overseasTransport != null &&
            Number(order.overseasTransport) < 0);

        const hasNegativeLineCost = shipmentLineDetails.some(
          (row) =>
            (row.additionalCost != null && row.additionalCost < 0) ||
            (row.localTransportCost != null && row.localTransportCost < 0) ||
            (row.freightDutyCost != null && row.freightDutyCost < 0)
        );

        if (hasNegativeHeaderCost || hasNegativeLineCost) {
          toast.info(
            "Local Transport, Overseas Cost and Freight Duty Cost must be 0 or greater."
          );
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

            const overseasExpected = getOverseasExpectedTotal(
                overseasTransportVal,
                effectiveExchangeRate || 0
            );
            const overseasActual = sumQtyWeightedCost(
                shipmentLineDetails,
                "additionalCost"
            );
            const localExpected = round2(localTransport);
            const localActual = sumQtyWeightedCost(
                shipmentLineDetails,
                "localTransportCost"
            );
            const freightExpected = round2(freightDuty);
            const freightActual = sumQtyWeightedCost(
                shipmentLineDetails,
                "freightDutyCost"
            );

      const hasReceivedQty = getTotalReceivedQty(shipmentLineDetails) > 0;

      if (hasReceivedQty && !amountsMatchIgnoringDecimals(overseasActual, overseasExpected)) {
        toast.error(
          "Overseas Cost lines do not reconcile with Overseas Transport × Exchange Rate. Shipment cannot be saved."
        );
        return;
      }

      if (hasReceivedQty && !amountsMatchIgnoringDecimals(localActual, localExpected)) {
        toast.error(
          "Local Transport Cost lines do not reconcile with Local Transport value. Shipment cannot be saved."
        );
        return;
      }

      if (hasReceivedQty && !amountsMatchIgnoringDecimals(freightActual, freightExpected)) {
        toast.error(
          "Freight Duty Cost lines do not reconcile with Freight Duty value. Shipment cannot be saved."
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
      status: complete
        ? COMPLETED_STATUS
        : status === COMPLETED_STATUS
        ? persistedStatus
        : status,
      ...(showSupplierFields && currencyId
        ? {
            CurrencyId: Number(currencyId),
            OverseasTransport:
              order.overseasTransport == null || order.overseasTransport === ""
                ? null
                : round2(order.overseasTransport),
            LocalTransport:
              localTransport === "" ? null : round2(localTransport),
            ExchangeRate:
              effectiveExchangeRate == null
                ? null
                : round2(effectiveExchangeRate),
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
        freightDutyCost: round2(row.freightDutyCost || 0),
        additionalCost: round2(row.additionalCost || 0),
        ...(showSupplierFields
          ? { LocalTransportCost: round2(row.localTransportCost ?? 0) }
          : {}),
        LineTotal: round2(row.lineTotal || 0),
        CostPrice: round2(row.costPrice || 0),
        UnitPrice: row.unitPrice == null ? null : round2(row.unitPrice),
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
                    if (complete) {
                      setTimeout(() => {
                        router.push("/inventory/shipment");
                      }, 1500);
                    } else {
                      await fetchShipmentNote();
                    }
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
                                onChange={(e) => handleStatusChange(e.target.value)}
                                sx={{ width: "60%" }}
                                size="small"
                                fullWidth
                                disabled={isShipmentAlreadyCompleted}
                            >
                                {shipmentStatusTypes.map((statusType) => (
                                    <MenuItem key={statusType.value} value={statusType.value}>
                                        {statusType.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>

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
                    Overseas Transport (Supplier)
                  </Typography>
                  <Box
                    sx={{
                      width: "60%",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <TextField
                      disabled
                      fullWidth
                      value={toTwoDecimals(order.overseasTransport)}
                      sx={{ width: "50%" }}
                      size="small"
                    />
                    <TextField
                      disabled
                      fullWidth
                      value={toTwoDecimals(
                        getOverseasExpectedTotal(
                          order.overseasTransport,
                          effectiveExchangeRate || 0
                        )
                      )}
                      size="small"
                      label="LKR"
                      InputLabelProps={{ shrink: true }}
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
                          color: "#757fef",
                        },
                      }}
                    />
                  </Box>
                </Box>
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
                      onBlur={(e) =>
                        setExchangeRateInput(toTwoDecimals(e.target.value))
                      }
                      size="small"
                      placeholder="0.00"
                      label="Exc. Rate"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: 0, step: "0.01" }}
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
                  onChange={(e) => {
                    if (
                      rejectIfNegative(
                        e.target.value,
                        "Local Transport must be 0 or greater."
                      )
                    ) {
                      return;
                    }
                    setLocalTransport(e.target.value);
                  }}
                  onBlur={(e) => {
                    if (
                      rejectIfNegative(
                        e.target.value,
                        "Local Transport must be 0 or greater."
                      )
                    ) {
                      setLocalTransport("");
                      return;
                    }
                    setLocalTransport(toTwoDecimals(e.target.value));
                  }}
                  sx={{ width: "60%" }}
                  size="small"
                  inputProps={{ min: 0, step: "0.01" }}
                  placeholder="0.00"
                />
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
                  Freight Duty Cost
                </Typography>
                <TextField
                  type="number"
                  value={freightDuty}
                  onChange={(e) => {
                    if (
                      rejectIfNegative(
                        e.target.value,
                        "Freight Duty Cost must be 0 or greater."
                      )
                    ) {
                      return;
                    }
                    setFreightDuty(e.target.value);
                  }}
                  onBlur={(e) => {
                    if (
                      rejectIfNegative(
                        e.target.value,
                        "Freight Duty Cost must be 0 or greater."
                      )
                    ) {
                      setFreightDuty("");
                      return;
                    }
                    setFreightDuty(toTwoDecimals(e.target.value));
                  }}
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
                          <FormulaHeader
                            label="Overseas Unit Cost"
                            formula={`Unit = (Overseas Transport × Exc. Rate) ÷ Total Received Qty${
                              distributionFormulas.overseasUnitCost != null
                                ? ` (${formatCurrency(distributionFormulas.overseasUnitCost)})`
                                : ""
                            }\nTotal = Σ(Unit × Received Qty)`}
                          />
                        ) : (
                          "Additional Cost"
                        )}
                      </TableCell>
                      {showSupplierFields ? (
                        <TableCell sx={{ color: "#fff" }}>
                          <FormulaHeader
                            label="Local Transport Unit Cost"
                            formula={`Unit = Local Transport ÷ Total Received Qty${
                              distributionFormulas.localTransportUnitCost != null
                                ? ` (${formatCurrency(distributionFormulas.localTransportUnitCost)})`
                                : ""
                            }\nTotal = Σ(Unit × Received Qty)`}
                          />
                        </TableCell>
                      ) : null}
                      <TableCell sx={{ color: "#fff" }}>
                        <FormulaHeader
                          label="Freight Duty Unit Cost"
                          formula={
                            showSupplierFields
                              ? `Unit = Freight Duty ÷ Total Received Qty${
                                  distributionFormulas.freightDutyUnitCost != null
                                    ? ` (${formatCurrency(distributionFormulas.freightDutyUnitCost)})`
                                    : ""
                                }\nTotal = Σ(Unit × Received Qty)`
                              : "Unit = Entered per line\nLine = Unit × Received Qty"
                          }
                        />
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
                          {toTwoDecimals(row.qty)}
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
                                : showSupplierFields
                                ? toTwoDecimals(row.unitPrice)
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
                            onBlur={(e) => {
                              if (e.target.value === "") return;
                              handleChange(
                                index,
                                "unitPrice",
                                round2(e.target.value)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={
                              row.receivedQty === null || row.receivedQty === undefined
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
                            onBlur={(e) => {
                              if (e.target.value === "") return;
                              handleChange(
                                index,
                                "receivedQty",
                                round2(e.target.value)
                              );
                            }}
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
                                e.target.value
                              )
                            }
                            onBlur={(e) => {
                              if (e.target.value === "") return;
                              handleChange(
                                index,
                                "damagedQty",
                                round2(e.target.value)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={getCostFieldDisplay(row, index, "additionalCost")}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, step: "0.01" }}
                            onChange={(e) =>
                              handleCostFieldChange(
                                index,
                                "additionalCost",
                                e.target.value
                              )
                            }
                            onBlur={(e) =>
                              handleCostFieldBlur(
                                index,
                                "additionalCost",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        {showSupplierFields ? (
                          <TableCell sx={{ p: 1 }}>
                            <TextField
                              type="number"
                              value={getCostFieldDisplay(row, index, "localTransportCost")}
                              fullWidth
                              size="small"
                              inputProps={{ min: 0, step: "0.01" }}
                              onChange={(e) =>
                                handleCostFieldChange(
                                  index,
                                  "localTransportCost",
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleCostFieldBlur(
                                  index,
                                  "localTransportCost",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                        ) : null}
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="number"
                            value={getCostFieldDisplay(row, index, "freightDutyCost")}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0, step: "0.01" }}
                            onChange={(e) =>
                              handleCostFieldChange(
                                index,
                                "freightDutyCost",
                                e.target.value
                              )
                            }
                            onBlur={(e) =>
                              handleCostFieldBlur(
                                index,
                                "freightDutyCost",
                                e.target.value
                              )
                            }
                          />
                        </TableCell>
                        <TableCell sx={{ p: 1 }}>
                          <TextField
                            type="text"
                            value={row.remark ?? ""}
                            fullWidth
                            size="small"
                            onChange={(e) =>
                              handleChange(
                                index,
                                "remark",
                                e.target.value
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
                      {formatCurrency(
                        showSupplierFields
                          ? roundToWhole(additionalCostTotal)
                          : additionalCostTotal
                      )}
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
                        {formatCurrency(roundToWhole(localTransportCostTotal))}
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
                      {formatCurrency(roundToWhole(freightDutyTotal))}
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
              <Box sx={{ display: "flex", gap: 2 }}>
                <LoadingButton
                  loading={isSubmitting && !showShipmentCompleteButton}
                  handleSubmit={() => handleSubmit({ complete: false })}
                  disabled={
                    isDisable ||
                    isSubmitting ||
                    isShipmentAlreadyCompleted ||
                    status === COMPLETED_STATUS ||
                    (showSupplierFields && isExchangeRateInvalid)
                  }
                  label="Save"
                  loadingLabel="Saving..."
                />
                {showShipmentCompleteButton ? (
                  <Button
                    variant="contained"
                    color="success"
                    disabled={isSubmitting || isDisable}
                    onClick={() => handleSubmit({ complete: true })}
                  >
                    {isSubmitting ? "Completing..." : "Shipment Complete"}
                  </Button>
                ) : null}
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default ShipmentEdit;
