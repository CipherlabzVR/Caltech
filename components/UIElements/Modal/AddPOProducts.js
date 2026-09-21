import React, { useEffect, useMemo, useState } from "react";
import {
  IconButton,
  Modal,
  Box,
  Grid,
  Tooltip,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  Paper,
  Button,
} from "@mui/material";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import EditIcon from "@mui/icons-material/Edit";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 1100, xs: 300 },
  bgcolor: "background.paper",
  maxHeight: "90vh",
  overflowY: "scroll",
  boxShadow: 24,
  p: 3,
};

export default function AddPOProducts({
  item,
  fetchPO,
  fetchPOTally,
  isPOComplete = false,
}) {
  const { data: IsProfitVisibleOnGRNAndPO } = IsAppSettingEnabled(
    "IsProfitVisibleOnGRNAndPO"
  );
  const showProfitColumns = IsProfitVisibleOnGRNAndPO === true;

  const [open, setOpen] = React.useState(false);
  const [submittingStatus, setSubmittingStatus] = useState({});
  const [shipments, setShipments] = useState([]);
  const handleOpen = () => {
    setOrderQtyEditIds({});
    setOpen(true);
    fetchShipments();
  };
  const [poReceivedQtyValues, setPoReceivedQtyValues] = useState({});
  const [sellingPriceValues, setSellingPriceValues] = useState({});
  const [orderQtyValues, setOrderQtyValues] = useState({});
  const [orderQtyEditIds, setOrderQtyEditIds] = useState({});

  const getShipmentId = (shipment) => shipment?.id ?? shipment?.Id;

  const getShipmentOrderedQty = (shipment) =>
    Number(
      shipment?.shipmentOrderedQty ??
        shipment?.ShipmentOrderedQty ??
        0
    );

  const getShipmentReceivedQty = (shipment) =>
    Number(
      shipment?.shipmentReceivedQty ??
        shipment?.ShipmentReceivedQty ??
        0
    );

  const remaining = useMemo(
    () => (Number(item.poQty) || 0) - (Number(item.orderedQty) || 0),
    [item.poQty, item.orderedQty]
  );
  const poTotalQty = useMemo(() => Number(item.poQty) || 0, [item.poQty]);

  const getShipmentTotalUnitCost = (shipment) => {
    const unitPrice = Number(
      shipment?.shipmentUnitPrice ?? shipment?.ShipmentUnitPrice ?? 0
    );
    const overseasCost = Number(
      shipment?.shipmentAdditionalCost ?? shipment?.ShipmentAdditionalCost ?? 0
    );
    const freightDutyCost = Number(
      shipment?.shipmentFreightDutyCost ?? shipment?.ShipmentFreightDutyCost ?? 0
    );
    const localTransportCost = Number(
      shipment?.shipmentLocalTransportCost ??
        shipment?.ShipmentLocalTransportCost ??
        0
    );
    return unitPrice + overseasCost + freightDutyCost + localTransportCost;
  };

  const calculateProfit = (sellingPrice, costPrice) => {
    const sp = parseFloat(sellingPrice);
    const cp = parseFloat(costPrice);
    if (Number.isNaN(sp) || Number.isNaN(cp)) return 0;
    return sp - cp;
  };

  const calculateProfitMargin = (sellingPrice, costPrice) => {
    const sp = parseFloat(sellingPrice);
    const cp = parseFloat(costPrice);
    if (Number.isNaN(sp) || Number.isNaN(cp) || sp <= 0) return 0;
    return ((sp - cp) / sp) * 100;
  };

  const totalUnitCostSum = useMemo(
    () => shipments.reduce((sum, shipment) => sum + getShipmentTotalUnitCost(shipment), 0),
    [shipments]
  );

  const resolveShipmentSellingPrice = (shipment) => {
    const candidates = [
      shipment?.shipmentSellingPrice,
      shipment?.ShipmentSellingPrice,
    ];
    for (const value of candidates) {
      if (value !== null && value !== undefined && value !== "" && Number(value) > 0) {
        return value;
      }
    }
    return "";
  };

  const isOrderQtyBelowReceived = (orderQty, receivedQty) =>
    Number(orderQty) + 1e-9 < Number(receivedQty);

  const handleOrderQtyEdit = (shipmentId, shipment) => {
    const currentQty = getShipmentOrderedQty(shipment);
    setOrderQtyValues((prev) => ({
      ...prev,
      [shipmentId]: currentQty > 0 ? String(currentQty) : "",
    }));
    setOrderQtyEditIds((prev) => ({
      ...prev,
      [shipmentId]: true,
    }));
  };

  const handleOrderQtyChange = (shipmentId, value) => {
    setOrderQtyValues((prev) => ({
      ...prev,
      [shipmentId]: value,
    }));
  };

  const validateOrderQtyValue = (shipment, rawValue) => {
    const shipmentReceivedQty = getShipmentReceivedQty(shipment);
    const currentOrderQty = getShipmentOrderedQty(shipment);

    if (rawValue === "" || rawValue === null || rawValue === undefined) {
      return {
        valid: false,
        message: "Please enter a valid Order Quantity",
        normalized: currentOrderQty,
      };
    }

    const parsed = parseFloat(rawValue);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return {
        valid: false,
        message: "Please enter a valid Order Quantity",
        normalized: currentOrderQty,
      };
    }

    if (isOrderQtyBelowReceived(parsed, shipmentReceivedQty)) {
      return {
        valid: false,
        message:
          "Order Quantity must be greater than or equal to Shipment Received Quantity",
        normalized: currentOrderQty,
      };
    }

    return { valid: true, normalized: parsed };
  };

  const handleOrderQtyBlur = (shipmentId, shipment, rawValue) => {
    const value =
      rawValue !== undefined ? rawValue : orderQtyValues[shipmentId];
    const result = validateOrderQtyValue(shipment, value);

    if (!result.valid) {
      toast.error(result.message);
      setOrderQtyValues((prev) => ({
        ...prev,
        [shipmentId]: result.normalized,
      }));
      return;
    }

    setOrderQtyValues((prev) => ({
      ...prev,
      [shipmentId]: result.normalized,
    }));
  };

  const handleInputChange = (
    shipmentId,
    value,
    shipmentReceivedQty
  ) => {
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (parseFloat(value) > shipmentReceivedQty) {
      toast.error(
        "Entered value cannot be more than Shipment Received Quantity"
      );
      return;
    }
    setPoReceivedQtyValues((prev) => ({
      ...prev,
      [shipmentId]: value,
    }));
  };

  const handleSellingPriceChange = (shipmentId, value) => {
    if (value !== "" && (isNaN(value) || Number(value) < 0)) {
      toast.error("Please enter a valid selling price");
      return;
    }
    setSellingPriceValues((prev) => ({
      ...prev,
      [shipmentId]: value,
    }));
  };

  const getSellingPriceValue = (shipment) => {
    const id = getShipmentId(shipment);
    if (id !== undefined && sellingPriceValues[id] !== undefined) {
      return sellingPriceValues[id] === "" || sellingPriceValues[id] === null
        ? ""
        : sellingPriceValues[id];
    }
    return resolveShipmentSellingPrice(shipment);
  };

  const getOrderQtyValue = (shipment) => {
    const id = getShipmentId(shipment);
    if (id !== undefined && orderQtyValues[id] !== undefined) {
      return orderQtyValues[id] === "" || orderQtyValues[id] === null
        ? ""
        : orderQtyValues[id];
    }
    return getShipmentOrderedQty(shipment) || "";
  };

  const fetchShipments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/GetShipmentOrdersByProducts?productId=${item.productId}&poNumber=${item.purchaseOrderNo}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch GSM List");
      }

      const data = await response.json();
      const list = data.result || [];
      setShipments(list);

      const seededPrices = {};
      const seededQty = {};
      const seededOrderQty = {};
      list.forEach((shipment) => {
        const id = getShipmentId(shipment);
        if (id === undefined || id === null) return;
        const price = resolveShipmentSellingPrice(shipment);
        if (price !== "") {
          seededPrices[id] = price;
        }
        const qtyValue = shipment.poReceivedQty ?? shipment.POReceivedQty;
        if (qtyValue !== null && qtyValue !== undefined && Number(qtyValue) > 0) {
          seededQty[id] = qtyValue;
        }
        const orderQty = getShipmentOrderedQty(shipment);
        if (orderQty > 0) {
          seededOrderQty[id] = orderQty;
        }
      });
      setSellingPriceValues(seededPrices);
      setPoReceivedQtyValues(seededQty);
      setOrderQtyValues(seededOrderQty);
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleClose = () => {
    setOrderQtyEditIds({});
    setOpen(false);
    fetchPO();
    fetchPOTally();
  };

  const updateShipmentOrderQty = async (shipmentId, newOrderQty) => {
    const response = await fetch(
      `${BASE_URL}/GoodReceivedNote/UpdateShipmentOrderQty?poTallyId=${shipmentId}&newOrderQty=${newOrderQty}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update Order Quantity");
    }

    const data = await response.json();
    const result = data.result ?? data;
    const failed =
      result?.statusCode === -99 ||
      result?.statusCode === "FAILED" ||
      data?.statusCode === -99 ||
      data?.statusCode === "FAILED";

    if (failed) {
      throw new Error(result?.message || data?.message || "Order Quantity update failed");
    }

    return result?.message || data?.message || "Order Quantity updated successfully";
  };

  const updatePOReceivedQuantity = async (shipmentId, value, sellingPrice) => {
    const response = await fetch(
      `${BASE_URL}/GoodReceivedNote/UpdatePOReceivedQuantity?poTallyId=${shipmentId}&poReceivedQty=${value}&sellingPrice=${sellingPrice}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update PO received quantity");
    }

    const data = await response.json();
    const result = data.result;
    const failed = result?.statusCode === -99 || result?.statusCode === "FAILED";

    if (failed) {
      throw new Error(result?.message || "Update failed");
    }

    return result?.message || "PO Updated Successfully";
  };

  const handleLineUpdate = async (shipmentId) => {
    const shipment = shipments.find((s) => getShipmentId(s) === shipmentId);
    if (!shipment) {
      toast.error("Shipment not found");
      return;
    }

    const currentOrderQty = getShipmentOrderedQty(shipment);
    const orderQtyRaw = orderQtyValues[shipmentId];
    let parsedOrderQty =
      orderQtyRaw !== undefined && orderQtyRaw !== ""
        ? parseFloat(orderQtyRaw)
        : currentOrderQty;
    const orderQtyChanged = parsedOrderQty !== currentOrderQty;

    const receivedQtyRaw = poReceivedQtyValues[shipmentId];
    const hasReceivedQtyUpdate =
      receivedQtyRaw !== undefined &&
      receivedQtyRaw !== "" &&
      Number(receivedQtyRaw) > 0;

    const isStockUpdated = !!(
      shipment.isStockUpdated ?? shipment.IsStockUpdated
    );

    if (orderQtyChanged) {
      const orderQtyValidation = validateOrderQtyValue(shipment, orderQtyRaw);
      if (!orderQtyValidation.valid) {
        toast.error(orderQtyValidation.message);
        return;
      }

      parsedOrderQty = orderQtyValidation.normalized;

      const otherOrdered = shipments
        .filter((s) => getShipmentId(s) !== shipmentId)
        .reduce((sum, s) => sum + getShipmentOrderedQty(s), 0);

      if (otherOrdered + parsedOrderQty > poTotalQty) {
        toast.error(
          `Total shipment order qty cannot exceed PO qty (${poTotalQty}).`
        );
        return;
      }
    }

    if (hasReceivedQtyUpdate && !isStockUpdated) {
      const otherPOReceived = shipments
        .filter((s) => getShipmentId(s) !== shipmentId)
        .reduce(
          (sum, s) => sum + Number(s.poReceivedQty ?? s.POReceivedQty ?? 0),
          0
        );

      if (otherPOReceived + Number(receivedQtyRaw) > poTotalQty) {
        toast.error(
          `Total received qty cannot exceed PO qty (${poTotalQty}).`
        );
        return;
      }
    }

    if (!orderQtyChanged && !hasReceivedQtyUpdate) {
      toast.error("Please enter Order Qty or PO Received Quantity to update");
      return;
    }

    let sellingPrice;
    if (hasReceivedQtyUpdate && !isStockUpdated) {
      const sellingPriceRaw = sellingPriceValues[shipmentId];
      sellingPrice =
        sellingPriceRaw !== undefined && sellingPriceRaw !== ""
          ? sellingPriceRaw
          : getSellingPriceValue(shipment);

      if (!sellingPrice || Number(sellingPrice) <= 0) {
        toast.error("Please Enter Selling Price");
        return;
      }
    }

    setSubmittingStatus((prev) => ({
      ...prev,
      [shipmentId]: true,
    }));

    try {
      if (orderQtyChanged) {
        const orderMessage = await updateShipmentOrderQty(
          shipmentId,
          parsedOrderQty
        );
        toast.success(orderMessage);
        setOrderQtyValues((prev) => ({
          ...prev,
          [shipmentId]: parsedOrderQty,
        }));
        setOrderQtyEditIds((prev) => {
          const next = { ...prev };
          delete next[shipmentId];
          return next;
        });
      }

      if (hasReceivedQtyUpdate && !isStockUpdated) {
        const receivedMessage = await updatePOReceivedQuantity(
          shipmentId,
          receivedQtyRaw,
          sellingPrice
        );
        toast.success(receivedMessage);
        setSellingPriceValues((prev) => ({
          ...prev,
          [shipmentId]: sellingPrice,
        }));
        setPoReceivedQtyValues((prev) => ({
          ...prev,
          [shipmentId]: receivedQtyRaw,
        }));
      }

      fetchShipments();
      fetchPO();
      fetchPOTally();
    } catch (error) {
      console.error("Error updating shipment line:", error);
      toast.error(error.message || "Failed to update");
    } finally {
      setSubmittingStatus((prev) => ({
        ...prev,
        [shipmentId]: false,
      }));
    }
  };

  const tableColSpan = 7 + (showProfitColumns ? 2 : 0);

  return (
    <>
      <Tooltip title="Add Products" placement="top">
        <IconButton onClick={handleOpen} aria-label="addProducts" size="small">
          <PlaylistAddIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box mt={2}>
            <Grid container>
              <Grid item xs={12} display="flex" justifyContent="space-between">
                <Typography variant="h6">
                  Product:{item.productName + "-" + item.productCode}
                </Typography>
                <Typography variant="h6">PO Qty: {item.poQty}</Typography>
                <Typography variant="h6">
                  Ordered Qty: {item.orderedQty}
                </Typography>
                <Typography variant="h6">Remaining Qty: {remaining}</Typography>
              </Grid>
              <Grid item xs={12} my={2}>
                <TableContainer component={Paper}>
                  <Table aria-label="simple table" className="dark-table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Shipment No</TableCell>
                        <TableCell>Order Qty</TableCell>
                        <TableCell>Shipment Received Qty</TableCell>
                        <TableCell>PO Received Qty</TableCell>
                        <TableCell align="right">Total Unit Cost</TableCell>
                        <TableCell align="right">Selling Price</TableCell>
                        {showProfitColumns ? (
                          <>
                            <TableCell align="right">Profit</TableCell>
                            <TableCell align="right">Profit Margin (%)</TableCell>
                          </>
                        ) : null}
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={tableColSpan}>
                            <Typography color="error" variant="h6">
                              No data available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        shipments.map((shipment, index) => {
                          const shipmentId = getShipmentId(shipment);
                          const isStockUpdated = !!(
                            shipment.isStockUpdated ?? shipment.IsStockUpdated
                          );
                          const isSubmitting = submittingStatus[shipmentId];
                          const isOrderQtyEditing = !!orderQtyEditIds[shipmentId];
                          const canEditOrderQty =
                            isOrderQtyEditing &&
                            !isPOComplete &&
                            !isSubmitting;
                          const canEditReceivedQty =
                            !isPOComplete && !isStockUpdated && !isSubmitting;
                          const canUpdate =
                            !isPOComplete &&
                            !isSubmitting &&
                            (canEditReceivedQty || isOrderQtyEditing);
                          const canEditOrderQtyButton =
                            !isPOComplete &&
                            !isSubmitting &&
                            !isOrderQtyEditing;
                          const shipmentTotalUnitCost =
                            getShipmentTotalUnitCost(shipment);
                          const shipmentSellingPrice =
                            getSellingPriceValue(shipment);

                          return (
                          <TableRow key={shipmentId ?? index}>
                            <TableCell>
                              <Typography>{shipment.shipmentNoteNo}</Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={getOrderQtyValue(shipment)}
                                size="small"
                                type="number"
                                fullWidth
                                disabled={!canEditOrderQty}
                                inputProps={{ min: 0, step: "any" }}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  handleOrderQtyChange(shipmentId, e.target.value)
                                }
                                onBlur={(e) =>
                                  handleOrderQtyBlur(
                                    shipmentId,
                                    shipment,
                                    e.target.value
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Typography>
                                {shipment.shipmentReceivedQty}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={
                                  poReceivedQtyValues[shipmentId] !== undefined
                                    ? poReceivedQtyValues[shipmentId] || ""
                                    : shipment.poReceivedQty || ""
                                }
                                size="small"
                                type="number"
                                fullWidth
                                disabled={!canEditReceivedQty}
                                onChange={(e) =>
                                  handleInputChange(
                                    shipmentId,
                                    e.target.value,
                                    getShipmentReceivedQty(shipment)
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 600 }}>
                                {formatCurrency(shipmentTotalUnitCost)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                value={shipmentSellingPrice}
                                size="small"
                                type="number"
                                fullWidth
                                disabled={!canEditReceivedQty}
                                inputProps={{ min: 0, step: "0.01" }}
                                onChange={(e) =>
                                  handleSellingPriceChange(
                                    shipmentId,
                                    e.target.value
                                  )
                                }
                              />
                            </TableCell>
                            {showProfitColumns ? (
                              <>
                                <TableCell align="right">
                                  <Typography>
                                    {formatCurrency(
                                      calculateProfit(
                                        shipmentSellingPrice,
                                        shipmentTotalUnitCost
                                      )
                                    )}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography>
                                    {calculateProfitMargin(
                                      shipmentSellingPrice,
                                      shipmentTotalUnitCost
                                    ).toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </>
                            ) : null}
                            <TableCell align="right">
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 0.5,
                                  justifyContent: "flex-end",
                                  alignItems: "center",
                                }}
                              >
                                <Tooltip title="Edit Order Qty" placement="top">
                                  <span>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      aria-label="edit order qty"
                                      disabled={!canEditOrderQtyButton}
                                      onClick={() =>
                                        handleOrderQtyEdit(shipmentId, shipment)
                                      }
                                    >
                                      <EditIcon fontSize="inherit" />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Button
                                  size="small"
                                  onClick={() => handleLineUpdate(shipmentId)}
                                  color="warning"
                                  variant="contained"
                                  disabled={!canUpdate}
                                >
                                  {isSubmitting ? "...Updating" : "Update"}
                                </Button>
                              </Box>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}

                      <TableRow>
                        <TableCell colSpan={4} />
                        <TableCell>
                          <Typography align="right" variant="h6">
                            {formatCurrency(totalUnitCostSum || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={1 + (showProfitColumns ? 2 : 0)} />
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid item xs={12}>
                <Button
                  color="error"
                  variant="contained"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
