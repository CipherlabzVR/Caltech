import React, { useEffect, useState } from "react";
import styles from "@/styles/PageTitle.module.css";
import Link from "next/link";
import Grid from "@mui/material/Grid";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Typography, Button, Chip, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Divider } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";
import LoadingButton from "@mui/lab/LoadingButton";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PrintIcon from "@mui/icons-material/Print";

const getStatusChip = (status) => {
  switch (status) {
    case 1: return <Chip label="Draft" color="warning" />;
    case 2: return <Chip label="Posted" color="success" />;
    case 3: return <Chip label="Reversed" color="error" />;
    default: return <Chip label="Unknown" />;
  }
};

const getEntryType = (type) => {
  switch (type) {
    case 1: return "Manual";
    case 2: return "Auto-Posted";
    case 3: return "Reversing";
    case 4: return "Opening";
    case 5: return "Closing";
    default: return "-";
  }
};

const getSourceModule = (module) => {
  switch (module) {
    case 0: return "Manual";
    case 1: return "Sales Invoice";
    case 2: return "Sales Return";
    case 3: return "Receipt";
    case 4: return "Credit Note";
    case 5: return "Supplier Payment";
    case 6: return "GRN";
    case 7: return "Bank Transaction";
    case 8: return "Cash In/Out";
    case 9: return "Payroll";
    case 10: return "Expense";
    case 11: return "Depreciation";
    case 12: return "Reservation";
    default: return "-";
  }
};

export default function JournalEntryDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [entry, setEntry] = useState(null);
  const [postLoading, setPostLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reverseOpen, setReverseOpen] = useState(false);
  const [reversalDate, setReversalDate] = useState(new Date().toISOString().split("T")[0]);
  const [reversalReason, setReversalReason] = useState("");
  const [reverseLoading, setReverseLoading] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);

  const fetchEntry = async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/JournalEntry/GetById/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setEntry(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchEntry();
  }, [id]);

  const handlePost = async () => {
    setPostLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/JournalEntry/Post/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Journal Entry posted successfully.");
        fetchEntry();
      } else {
        toast.error(data.message || "Failed to post.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setPostLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/JournalEntry/Delete/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.statusCode === 200 || data.result?.statusCode === 200) {
        toast.success("Journal Entry deleted.");
        setTimeout(() => router.push("/finance/journal-entry"), 1000);
      } else {
        toast.error(data.message || data.result?.message || "Failed to delete.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReverse = async () => {
    setReverseLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/JournalEntry/Reverse`, {
        method: "POST",
        body: JSON.stringify({
          journalId: parseInt(id),
          reversalDate: reversalDate,
          reason: reversalReason,
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Journal Entry reversed successfully.");
        setReverseOpen(false);
        fetchEntry();
      } else {
        toast.error(data.message || "Failed to reverse.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setReverseLoading(false);
    }
  };

  if (!entry) {
    return (
      <div className={styles.pageTitle}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Journal Entry - {entry.documentNo}</h1>
        <ul>
          <li><Link href="/finance/journal-entry/">Journal Entries</Link></li>
          <li>{entry.documentNo}</li>
        </ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Document No</Typography>
                <Typography fontWeight="bold">{entry.documentNo}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">Date</Typography>
                <Typography fontWeight="bold">{formatDate(entry.journalDate)}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Box mt={0.5}>{getStatusChip(entry.status)}</Box>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="body2" color="text.secondary">Entry Type</Typography>
                <Typography>{getEntryType(entry.entryType)}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">Source</Typography>
                <Typography>{getSourceModule(entry.sourceModule)}{entry.sourceDocumentNo ? ` - ${entry.sourceDocumentNo}` : ""}</Typography>
              </Grid>
              {entry.description && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography>{entry.description}</Typography>
                </Grid>
              )}
              {entry.reference && (
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Reference</Typography>
                  <Typography>{entry.reference}</Typography>
                </Grid>
              )}
              {entry.postedOn && (
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" color="text.secondary">Posted On</Typography>
                  <Typography>{formatDate(entry.postedOn)}</Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>Journal Lines</Typography>
            <TableContainer>
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Account Code</TableCell>
                    <TableCell>Account Description</TableCell>
                    <TableCell>Line Description</TableCell>
                    <TableCell>Customer / Supplier</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entry.lines?.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>{line.accountCode}</TableCell>
                      <TableCell>{line.accountDescription}</TableCell>
                      <TableCell>{line.description || "-"}</TableCell>
                      <TableCell>{line.customerId ? `Customer #${line.customerId}` : line.supplierId ? `Supplier #${line.supplierId}` : "-"}</TableCell>
                      <TableCell align="right">{line.debitAmount > 0 ? formatCurrency(line.debitAmount) : "-"}</TableCell>
                      <TableCell align="right">{line.creditAmount > 0 ? formatCurrency(line.creditAmount) : "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell colSpan={4} align="right">
                      <Typography fontWeight="bold">Totals</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{formatCurrency(entry.totalDebit)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold">{formatCurrency(entry.totalCredit)}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button variant="outlined" size="small" onClick={() => router.push("/finance/journal-entry")}>
                Back to List
              </Button>
              <Box display="flex" gap={1}>
                <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={() => window.print()}>
                  Print
                </Button>
                <LoadingButton variant="outlined" size="small" startIcon={<ContentCopyIcon />} loading={duplicateLoading} onClick={async () => {
                  setDuplicateLoading(true);
                  try {
                    const token = localStorage.getItem("token");
                    const resp = await fetch(`${BASE_URL}/JournalEntry/Duplicate/${id}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
                    const data = await resp.json();
                    if (data.statusCode === 200) {
                      toast.success(`Duplicated as ${data.result.documentNo}`);
                      setTimeout(() => router.push(`/finance/journal-entry/${data.result.id}`), 1000);
                    } else { toast.error(data.message || "Failed to duplicate."); }
                  } catch { toast.error("An error occurred."); } finally { setDuplicateLoading(false); }
                }}>
                  Duplicate
                </LoadingButton>
                {entry.status === 1 && (
                  <>
                    <Button variant="outlined" size="small" color="primary" startIcon={<EditIcon />} onClick={() => router.push(`/finance/journal-entry/edit?id=${id}`)}>
                      Edit
                    </Button>
                    <LoadingButton variant="contained" color="error" size="small" loading={deleteLoading} onClick={handleDelete}>
                      Delete
                    </LoadingButton>
                    <LoadingButton variant="contained" color="success" size="small" loading={postLoading} onClick={handlePost}>
                      Post Entry
                    </LoadingButton>
                  </>
                )}
                {entry.status === 2 && (
                  <Button variant="contained" color="warning" size="small" onClick={() => setReverseOpen(true)}>
                    Reverse
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={reverseOpen} onClose={() => setReverseOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Journal Entry</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This will create a new reversing entry that swaps all debits and credits.
          </Typography>
          <TextField
            label="Reversal Date"
            type="date"
            fullWidth
            size="small"
            value={reversalDate}
            onChange={(e) => setReversalDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Reason (Optional)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseOpen(false)}>Cancel</Button>
          <LoadingButton variant="contained" color="warning" loading={reverseLoading} onClick={handleReverse}>
            Confirm Reverse
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
