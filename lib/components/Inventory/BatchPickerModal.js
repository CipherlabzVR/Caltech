import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { formatDate } from "@/components/utils/formatHelper";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";
import { fetchBatchLines } from "@/components/Inventory/stockMovementHelpers";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 900, xs: "95%" },
  bgcolor: "background.paper",
  maxHeight: "85vh",
  overflowY: "hidden",
  boxShadow: 24,
  p: 3,
};

const formatQty = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
};

export default function BatchPickerModal({
  open,
  onClose,
  item,
  supplier,
  mode = "adjustment",
  onSelect,
}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled("IsExpireDateAvailable");
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled("IsBatchNumberAvailable");

  useEffect(() => {
    if (!open || !item) {
      setBatches([]);
      return;
    }

    const warehouseId = item.warehouseId;
    const productId = item.id ?? item.productId;

    if (!warehouseId || !productId) {
      setBatches([]);
      return;
    }

    const loadBatches = async () => {
      setLoading(true);
      try {
        const result = await fetchBatchLines(warehouseId, productId, true);
        setBatches(result);
      } catch (error) {
        console.error(error);
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };

    loadBatches();
  }, [open, item]);

  const handleSelectBatch = (batch) => {
    onSelect(batch);
    onClose();
  };

  const productLabel =
    item?.name || item?.productName || item?.code || item?.productCode || "Item";

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} className="bg-black">
        <Typography variant="h6" mb={1}>
          Select Batch Line
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {productLabel}
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "55vh", overflowY: "auto" }}>
            <Table size="small" aria-label="batch picker" className="dark-table">
              <TableHead>
                <TableRow sx={{ background: "#757fef" }}>
                  <TableCell sx={{ color: "#fff" }}>#</TableCell>
                  <TableCell sx={{ color: "#fff" }}>GRN No</TableCell>
                  {IsBatchNumberAvailable && (
                    <TableCell sx={{ color: "#fff" }}>Batch</TableCell>
                  )}
                  {IsExpireDateAvailable && (
                    <TableCell sx={{ color: "#fff" }}>Exp Date</TableCell>
                  )}
                  <TableCell sx={{ color: "#fff" }}>Current Qty</TableCell>
                  <TableCell sx={{ color: "#fff" }} align="center">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="error">No batch lines found for this item</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch, index) => {
                    const currentQty = Number(batch.bookBalanceQuantity ?? 0);
                    const isDispatchDisabled =
                      mode === "dispatch" && currentQty <= 0;

                    return (
                      <TableRow key={batch.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{batch.documentNumber || "-"}</TableCell>
                        {IsBatchNumberAvailable && (
                          <TableCell>{batch.batchNumber || "-"}</TableCell>
                        )}
                        {IsExpireDateAvailable && (
                          <TableCell>{formatDate(batch.expiryDate) || "-"}</TableCell>
                        )}
                        <TableCell>{formatQty(currentQty)}</TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={
                              isDispatchDisabled
                                ? "No stock available to dispatch"
                                : "Add this batch line"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isDispatchDisabled}
                                onClick={() => handleSelectBatch(batch)}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button variant="outlined" color="error" size="small" onClick={onClose}>
            Close
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
