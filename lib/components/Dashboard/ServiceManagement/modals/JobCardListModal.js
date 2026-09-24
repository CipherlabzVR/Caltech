import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useRouter } from "next/router";
import { formatDate } from "@/components/utils/formatHelper";
import { STATUS_COLOR, statusDisplay } from "../constants";

export default function JobCardListModal({ open, onClose, title, jobCards = [] }) {
  const router = useRouter();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {jobCards.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            No job cards found.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Document No</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Received</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobCards.map((jc) => {
                  const statusName = statusDisplay(jc.status);
                  return (
                    <TableRow key={jc.id} hover>
                      <TableCell>{jc.documentNo}</TableCell>
                      <TableCell>{jc.customerName}</TableCell>
                      <TableCell>{jc.productName}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusName}
                          size="small"
                          color={STATUS_COLOR[statusName] || "default"}
                        />
                      </TableCell>
                      <TableCell>{formatDate(jc.receivedDate || jc.createdOn)}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          onClick={() => {
                            onClose();
                            router.push(`/service/job-card/${jc.id}`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={() => {
            onClose();
            router.push("/service/job-card/");
          }}
        >
          View All Job Cards
        </Button>
      </DialogActions>
    </Dialog>
  );
}
