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
import { grnLinesToRows } from "@/components/Inventory/stockMovementHelpers";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 1000, xs: "95%" },
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

export default function GrnLinePickerModal({
  open,
  onClose,
  grn,
  supplier,
  mode = "adjustment",
  onSelect,
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const { data: IsExpireDateAvailable } = IsAppSettingEnabled("IsExpireDateAvailable");
  const { data: IsBatchNumberAvailable } = IsAppSettingEnabled("IsBatchNumberAvailable");

  const grnDocumentNo = grn?.documentNo || "";

  useEffect(() => {
    if (!open || !grn) {
      setRows([]);
      return;
    }

    const loadRows = async () => {
      setLoading(true);
      try {
        const result = await grnLinesToRows(grn, supplier);
        setRows(result);
      } catch (error) {
        console.error(error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, [open, grn, supplier]);

  const handleSelectRow = (row) => {
    onSelect(row);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} className="bg-black">
        <Typography variant="h6" mb={1}>
          Select GRN Line
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          GRN No: {grnDocumentNo || "-"}
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "55vh", overflowY: "auto" }}>
            <Table size="small" aria-label="grn line picker" className="dark-table">
              <TableHead>
                <TableRow sx={{ background: "#757fef" }}>
                  <TableCell sx={{ color: "#fff" }}>#</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Product Code</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
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
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      <Typography color="error">No lines found for this GRN</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row, index) => {
                    const currentQty = Number(row.currentQty ?? 0);
                    const isDispatchDisabled = mode === "dispatch" && currentQty <= 0;

                    return (
                      <TableRow key={row.stockBalanceId || row.rowId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{row.productCode}</TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell>{grnDocumentNo || "-"}</TableCell>
                        {IsBatchNumberAvailable && (
                          <TableCell>{row.batchNumber || "-"}</TableCell>
                        )}
                        {IsExpireDateAvailable && (
                          <TableCell>{formatDate(row.expiryDate) || "-"}</TableCell>
                        )}
                        <TableCell>{formatQty(currentQty)}</TableCell>
                        <TableCell align="center">
                          <Tooltip
                            title={
                              isDispatchDisabled
                                ? "No stock available to dispatch"
                                : "Add this line"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isDispatchDisabled}
                                onClick={() => handleSelectRow(row)}
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
