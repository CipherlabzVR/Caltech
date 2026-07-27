import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import { formatDateWithTime } from "@/components/utils/formatHelper";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 1100, xs: 350 },
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "90vh",
  overflowY: "auto",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 3,
};

const formatQty = (value) => {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
};

const renderDifference = (value) => {
  const num = Number(value || 0);
  if (num < 0) {
    return <span className="dangerBadge">Short / {num.toFixed(2)}</span>;
  }
  if (num > 0) {
    return <span className="successBadge">Excess / {num.toFixed(2)}</span>;
  }
  return <span>Matched</span>;
};

export default function ShiftStockVariance({ shift }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchVariance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/Shift/GetShiftItemStockVariance?shiftId=${shift.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to load stock variance");
      const result = await response.json();
      setData(result?.result || null);
    } catch (error) {
      toast.error(error.message || "Unable to load stock variance");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchVariance();
  };

  const handleClose = () => {
    setOpen(false);
    setData(null);
  };

  const rows = data?.items || [];

  return (
    <>
      <Tooltip title="Stock Matching" placement="top">
        <IconButton onClick={handleOpen} aria-label="stock-matching" size="small">
          <CompareArrowsIcon color="primary" fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style} className="bg-black">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={500}>
              Stock Matching
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {shift?.documentNo}
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : !data ? (
            <Typography color="error">No stock variance data found.</Typography>
          ) : (
            <>
              <Box mb={2}>
                <Typography variant="body2">
                  <strong>Warehouse:</strong> {data.warehouseName || "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>Start Date:</strong> {data.startDate ? formatDateWithTime(data.startDate) : "-"}
                </Typography>
                <Typography variant="body2">
                  <strong>End Date:</strong> {data.endDate ? formatDateWithTime(data.endDate) : "-"}
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small" className="dark-table">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="right">Start Qty</TableCell>
                      <TableCell align="right">System Start Qty</TableCell>
                      <TableCell align="right">Start Difference</TableCell>
                      <TableCell align="right">End Qty</TableCell>
                      <TableCell align="right">System End Qty</TableCell>
                      <TableCell align="right">End Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No items found for this shift.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((item, index) => (
                        <TableRow key={`${item.itemId}-${index}`}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{item.itemCode}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell align="right">{formatQty(item.startQty)}</TableCell>
                          <TableCell align="right">{formatQty(item.systemStartQty)}</TableCell>
                          <TableCell align="right">{renderDifference(item.startDifferenceQty)}</TableCell>
                          <TableCell align="right">{formatQty(item.endQty)}</TableCell>
                          <TableCell align="right">{formatQty(item.systemEndQty)}</TableCell>
                          <TableCell align="right">{renderDifference(item.endDifferenceQty)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={handleClose}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
