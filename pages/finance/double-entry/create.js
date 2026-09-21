import React, { useState } from "react";
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
import { Typography, Button, TextField, MenuItem, IconButton, Box, Chip, InputAdornment } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { formatCurrency } from "@/components/utils/formatHelper";
import { ChartOfAccountType } from "@/components/types/types";
import { useRouter } from "next/router";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import BalanceIcon from "@mui/icons-material/Balance";
import LoadingButton from "@mui/lab/LoadingButton";

const isDebitNormal = (accountType) => {
  switch (accountType) {
    case 1: case 5: case 6: case 7: case 9: case 11: case 13: case 14:
      return false;
    default:
      return true;
  }
};

const getNormalBadge = (accountType) => {
  if (accountType === undefined || accountType === null) return null;
  return isDebitNormal(accountType)
    ? <Chip label="Dr" size="small" sx={{ ml: 1, fontSize: "0.7rem", height: 20, minWidth: 28 }} color="info" variant="outlined" />
    : <Chip label="Cr" size="small" sx={{ ml: 1, fontSize: "0.7rem", height: 20, minWidth: 28 }} color="warning" variant="outlined" />;
};

export default function CreateDoubleEntry() {
  const router = useRouter();
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const [loading, setLoading] = useState(false);
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState([
    { chartOfAccountId: "", debitAmount: 0, creditAmount: 0, description: "", customerId: null, customerName: "", supplierId: null, supplierName: "" },
    { chartOfAccountId: "", debitAmount: 0, creditAmount: 0, description: "", customerId: null, customerName: "", supplierId: null, supplierName: "" },
  ]);

  const accountMap = {};
  accountList?.forEach((acc) => { accountMap[acc.id] = acc; });

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.creditAmount) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => {
    setLines([...lines, { chartOfAccountId: "", debitAmount: 0, creditAmount: 0, description: "", customerId: null, customerName: "", supplierId: null, supplierName: "" }]);
  };

  const removeLine = (index) => {
    if (index === 0) {
      toast.error("The first line must remain a debit entry.");
      return;
    }
    if (lines.length <= 2) {
      toast.error("A double entry must have at least 2 lines.");
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    if (index === 0 && field === "creditAmount") return;
    const updated = [...lines];
    updated[index][field] = value;
    if (field === "debitAmount" && parseFloat(value) > 0) updated[index].creditAmount = 0;
    if (field === "creditAmount" && parseFloat(value) > 0) updated[index].debitAmount = 0;
    setLines(updated);
  };

  const fillRemaining = (index) => {
    const updated = [...lines];
    const diff = totalDebit - totalCredit;
    if (diff === 0) return;
    if (index === 0) {
      if (diff > 0) return;
      updated[index].debitAmount = parseFloat(Math.abs(diff).toFixed(2));
      updated[index].creditAmount = 0;
    } else if (diff > 0) {
      updated[index].creditAmount = parseFloat(diff.toFixed(2));
      updated[index].debitAmount = 0;
    } else {
      updated[index].debitAmount = parseFloat(Math.abs(diff).toFixed(2));
      updated[index].creditAmount = 0;
    }
    setLines(updated);
  };

  const canFillRemaining = (line, index) => {
    const lineDebit = parseFloat(line.debitAmount) || 0;
    const lineCredit = parseFloat(line.creditAmount) || 0;
    if (lineDebit !== 0 || lineCredit !== 0 || totalDebit + totalCredit <= 0 || totalDebit === totalCredit) {
      return false;
    }
    if (index === 0) return totalCredit > totalDebit;
    return true;
  };

  const handleSubmit = async () => {
    if (!journalDate) {
      toast.error("Journal Date is required.");
      return;
    }
    if (lines.some((l) => !l.chartOfAccountId)) {
      toast.error("All lines must have an account selected.");
      return;
    }
    const firstLineDebit = parseFloat(lines[0]?.debitAmount) || 0;
    const firstLineCredit = parseFloat(lines[0]?.creditAmount) || 0;
    if (firstLineDebit <= 0 || firstLineCredit > 0) {
      toast.error("The first line must be a debit entry.");
      return;
    }
    if (!isBalanced) {
      toast.error("Total Debit must equal Total Credit.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        journalDate,
        description,
        reference,
        entryType: 1,
        lines: lines.map((l) => ({
          chartOfAccountId: l.chartOfAccountId,
          debitAmount: parseFloat(l.debitAmount) || 0,
          creditAmount: parseFloat(l.creditAmount) || 0,
          description: l.description,
        })),
      };

      const response = await fetch(`${BASE_URL}/DoubleEntry/Create`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Double Entry created successfully.");
        setTimeout(() => router.push("/finance/double-entry"), 1000);
      } else {
        toast.error(data.message || "Failed to create double entry.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Double Entry</h1>
        <ul>
          <li><Link href="/finance/double-entry/">Double Entries</Link></li>
          <li>Create</li>
        </ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Journal Date</Typography>
                <TextField type="date" fullWidth size="small" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Description</Typography>
                <TextField fullWidth size="small" placeholder="Enter description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Reference</Typography>
                <TextField fullWidth size="small" placeholder="Reference number" value={reference} onChange={(e) => setReference(e.target.value)} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Entry Lines</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>Add Line</Button>
            </Box>
            <TableContainer>
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 250 }}>Account</TableCell>
                    <TableCell align="center" sx={{ width: 80 }}>Type</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Description</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Customer / Supplier</TableCell>
                    <TableCell align="right" sx={{ minWidth: 130 }}>Debit</TableCell>
                    <TableCell align="right" sx={{ minWidth: 130 }}>Credit</TableCell>
                    <TableCell align="center" sx={{ minWidth: 140 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, index) => {
                    const selectedAcc = line.chartOfAccountId ? accountMap[line.chartOfAccountId] : null;
                    return (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField select fullWidth size="small" value={line.chartOfAccountId} onChange={(e) => updateLine(index, "chartOfAccountId", e.target.value)}>
                          <MenuItem value="">-- Select Account --</MenuItem>
                          {accountList?.map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>
                              {acc.code} - {acc.description}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell align="center">
                        {selectedAcc ? (
                          <Box display="flex" flexDirection="column" alignItems="center" gap={0.3}>
                            <Typography variant="caption" color="text.secondary" lineHeight={1.2}>{ChartOfAccountType(selectedAcc.accountType)}</Typography>
                            {getNormalBadge(selectedAcc.accountType)}
                          </Box>
                        ) : <Typography variant="caption" color="text.disabled">-</Typography>}
                      </TableCell>
                      <TableCell>
                        <TextField fullWidth size="small" placeholder="Line description" value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <TextField
                          fullWidth size="small" placeholder="Name (optional)"
                          value={line.customerName || line.supplierName || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = [...lines];
                            if (selectedAcc && !isDebitNormal(selectedAcc.accountType)) {
                              updated[index].supplierName = val;
                              updated[index].customerName = "";
                            } else {
                              updated[index].customerName = val;
                              updated[index].supplierName = "";
                            }
                            setLines(updated);
                          }}
                          InputProps={{
                            startAdornment: selectedAcc ? (
                              <InputAdornment position="start">
                                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                                  {isDebitNormal(selectedAcc.accountType) ? "Cust:" : "Supp:"}
                                </Typography>
                              </InputAdornment>
                            ) : null
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField type="number" fullWidth size="small" inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }} value={line.debitAmount} onChange={(e) => updateLine(index, "debitAmount", e.target.value)} disabled={index !== 0 && parseFloat(line.creditAmount) > 0} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField type="number" fullWidth size="small" inputProps={{ min: 0, step: "0.01", style: { textAlign: "right" } }} value={line.creditAmount} onChange={(e) => updateLine(index, "creditAmount", e.target.value)} disabled={index === 0 || parseFloat(line.debitAmount) > 0} />
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {canFillRemaining(line, index) && (
                            <Chip icon={<BalanceIcon sx={{ fontSize: "14px !important" }} />} label={`${formatCurrency(Math.abs(totalDebit - totalCredit))} ${totalDebit > totalCredit ? "Cr" : "Dr"}`} size="small" color="primary" variant="outlined" onClick={() => fillRemaining(index)} sx={{ cursor: "pointer", fontSize: "0.7rem", height: 24 }} />
                          )}
                          <IconButton size="small" color="error" onClick={() => removeLine(index)} disabled={index === 0}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell colSpan={4} align="right"><Typography fontWeight="bold">Totals</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight="bold" color={isBalanced ? "success.main" : "error.main"}>{formatCurrency(totalDebit)}</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight="bold" color={isBalanced ? "success.main" : "error.main"}>{formatCurrency(totalCredit)}</Typography></TableCell>
                    <TableCell />
                  </TableRow>
                  {!isBalanced && totalDebit + totalCredit > 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Typography color="error" variant="body2" align="center">
                          Entry is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button variant="contained" color="error" size="small" onClick={() => router.push("/finance/double-entry")}>Cancel</Button>
              <LoadingButton variant="contained" size="small" loading={loading} disabled={!isBalanced} onClick={handleSubmit}>Save as Draft</LoadingButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
