import React, { useEffect, useState } from "react";
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
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: 300 },
  bgcolor: "background.paper",
  maxHeight: '90vh',
  overflowY: 'scroll',
  boxShadow: 24,
  p: 3,
};

export default function AddPOProducts({ item, fetchPO, fetchPOTally }) {
  const [open, setOpen] = React.useState(false);
  const [submittingStatus, setSubmittingStatus] = useState({});
  const [totalUnitPrice, setTotalUnitPrice] = useState(null);
  const [totalAdditionalCost, setTotalAdditionalCost] = useState(null);
  const [totalFreightDutyCost, setTotalFreightDutyCost] = useState(null);
  const [averageUnitPrice, setAverageUnitPrice] = useState(null);
  const [averageFreightDutyCost, setAverageFreightDutyCost] = useState(null);
  const [shipments, setShipments] = useState([]);
  const qty = item.poQty - item.orderedQty;
  const [remaining] = useState(qty);
  const handleOpen = () => setOpen(true);
  const [poReceivedQtyValues, setPoReceivedQtyValues] = useState({});

  const handleInputChange = (shipmentId, value, shipmentReceivedQty, poQty) => {
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    const x = parseFloat(poQty) - parseFloat(shipmentReceivedQty);

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
      setShipments(data.result);
      const count = data.result.length;
      const unitPrice = data.result.reduce(
        (sum, shipment) => sum + (shipment.shipmentUnitPrice || 0),
        0
      );
      const additionaCost = data.result.reduce(
        (sum, shipment) => sum + (shipment.shipmentAdditionalCost || 0),
        0
      );
      const freightDutyCost = data.result.reduce(
        (sum, shipment) => sum + (shipment.shipmentFreightDutyCost || 0),
        0
      );

      const avgUnitPrice = unitPrice / count;
      const avgFDCost = (additionaCost + freightDutyCost);
      setTotalUnitPrice(unitPrice);
      setTotalAdditionalCost(additionaCost);
      setTotalFreightDutyCost(freightDutyCost);
      setAverageUnitPrice(avgUnitPrice);
      setAverageFreightDutyCost(avgFDCost);
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);
  const handleClose = () => {
    setOpen(false);
    fetchPO();
    fetchPOTally();
  }

  const handleLineUpdate = async (shipmentId) => {
    const value = poReceivedQtyValues[shipmentId];
    if (value === 0 || !value) {
      toast.error("Please Enter PO Received Quantity");
      return;
    }

    setSubmittingStatus((prev) => ({
      ...prev,
      [shipmentId]: true,
    }));

    try {
      const response = await fetch(
        `${BASE_URL}/GoodReceivedNote/UpdatePOReceivedQuantity?poTallyId=${shipmentId}&poReceivedQty=${value}`,
        {
          method: "POST",
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
      toast.success(data.result.message);
      fetchShipments();
    } catch (error) {
      console.error("Error fetching GSM List:", error);
    } finally {
      setSubmittingStatus((prev) => ({
        ...prev,
        [shipmentId]: false,
      }));
    }
  };
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
                        <TableCell>Shipment Qty</TableCell>
                        <TableCell>Shipment Received Qty</TableCell>
                        <TableCell>PO Received Qty</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Additional Cost</TableCell>
                        <TableCell align="right">Freight Duty Cost</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shipments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3}>
                            <Typography color="error" variant="h6">
                              No data available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        shipments.map((shipment, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography>{shipment.shipmentNoteNo}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography>
                                {shipment.shipmentOrderedQty}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography>
                                {shipment.shipmentReceivedQty}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <TextField
                                // value={
                                //   poReceivedQtyValues[shipment.id] ||
                                //   shipment.poReceivedQty
                                // }
                                value={
                                  poReceivedQtyValues[shipment.id] !== undefined
                                    ? poReceivedQtyValues[shipment.id] || ''
                                    : shipment.poReceivedQty || ''
                                }
                                size="small"
                                type="number"
                                fullWidth
                                onChange={(e) =>
                                  handleInputChange(
                                    shipment.id,
                                    e.target.value,
                                    shipment.shipmentReceivedQty,
                                    shipment.shipmentOrderedQty
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography>
                                {formatCurrency(shipment.shipmentUnitPrice)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography>
                                {formatCurrency(
                                  shipment.shipmentAdditionalCost
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography>
                                {formatCurrency(
                                  shipment.shipmentFreightDutyCost
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                onClick={() => handleLineUpdate(shipment.id)}
                                color="warning"
                                variant="contained"
                                disabled={shipment.isStockUpdated || submittingStatus[shipment.id]}
                              >
                                {submittingStatus[shipment.id]
                                  ? "...Updating"
                                  : "Update"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}

                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography align="right" variant="h6">
                            {formatCurrency(totalUnitPrice || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography align="right" variant="h6">
                            {formatCurrency(totalAdditionalCost || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography align="right" variant="h6">
                            {formatCurrency(totalFreightDutyCost || 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid
                item
                xs={12}
                my={2}
                display="flex"
                justifyContent="space-between"
              >
                <Typography variant="h6">
                  Average Unit Price : {formatCurrency(averageUnitPrice || 0)}
                </Typography>
                <Typography variant="h6">
                  Total Freight Duty Cost :{" "}
                  {formatCurrency(averageFreightDutyCost || 0)}
                </Typography>
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
