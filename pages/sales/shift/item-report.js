import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { Box, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper } from "@mui/material";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const formatQty = (value) => {
  const numberValue = Number(value || 0);
  return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "0.00";
};

export default function ShiftItemReportPage() {
  const router = useRouter();
  const { shiftId } = router.query;
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState("");

  const rows = useMemo(() => reportData?.items || [], [reportData]);

  useEffect(() => {
    if (!router.isReady || !shiftId) return;

    const fetchReport = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${BASE_URL}/Shift/GetShiftItemMovementReport?shiftId=${shiftId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load report.");
        }

        const data = await response.json();
        setReportData(data?.result || null);
      } catch (err) {
        setError(err.message || "Unable to load report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [router.isReady, shiftId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    if (!rows.length) return;

    const header = [
      "Item Code",
      "Item Name",
      "Start Qty",
      "End Qty",
      "GRN Qty",
      "GRN Return Qty",
      "Sales Qty",
      "Sales Return Qty",
      "Dispatch Qty",
      "Adjustment Qty",
      "Actual End Qty",
      "Difference",
    ];

    const csvLines = [
      header.join(","),
      ...rows.map((item) =>
        [
          `"${(item.itemCode || "").replace(/"/g, '""')}"`,
          `"${(item.itemName || "").replace(/"/g, '""')}"`,
          formatQty(item.startQty),
          formatQty(item.endQty),
          formatQty(item.grnQty),
          formatQty(item.grnReturnQty),
          formatQty(item.salesQty),
          formatQty(item.salesReturnQty),
          formatQty(item.dispatchQty),
          formatQty(item.adjustmentQty),
          formatQty(item.actualEndQty),
          formatQty(item.difference),
        ].join(",")
      ),
    ];

    const csvBlob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvBlob);
    link.download = `${reportData?.shiftCode || "shift"}-item-report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Shift Item Movement Report
        </Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={handleDownloadCsv} disabled={!rows.length}>
            Download
          </Button>
          <Button variant="contained" onClick={handlePrint}>
            Print
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={8}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !reportData ? (
        <Typography color="error">No report data found.</Typography>
      ) : (
        <>
          <Typography mb={0.5}><strong>Shift Code:</strong> {reportData.shiftCode}</Typography>
          <Typography mb={0.5}><strong>Warehouse:</strong> {reportData.warehouseName || "-"}</Typography>
          <Typography mb={0.5}><strong>Start Date:</strong> {formatDateTime(reportData.startDate)}</Typography>
          <Typography mb={2}><strong>End Date:</strong> {formatDateTime(reportData.endDate)}</Typography>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Item Code</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell align="right">Start Qty</TableCell>
                  <TableCell align="right">End Qty</TableCell>
                  <TableCell align="right">GRN Qty</TableCell>
                  <TableCell align="right">GRN Return Qty</TableCell>
                  <TableCell align="right">Sales Qty</TableCell>
                  <TableCell align="right">Sales Return Qty</TableCell>
                  <TableCell align="right">Dispatch Qty</TableCell>
                  <TableCell align="right">Adjustment Qty</TableCell>
                  <TableCell align="right">Actual End Qty</TableCell>
                  <TableCell align="right">Difference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} align="center">
                      No report data found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((item, index) => (
                    <TableRow key={`${item.itemId}-${index}`}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell align="right">{formatQty(item.startQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.endQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.grnQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.grnReturnQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.salesQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.salesReturnQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.dispatchQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.adjustmentQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.actualEndQty)}</TableCell>
                      <TableCell align="right">{formatQty(item.difference)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
          }
        }
      `}</style>
    </Box>
  );
}
