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
import { Typography, Button, TextField, MenuItem, IconButton, Box, Chip } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { formatCurrency } from "@/components/utils/formatHelper";
import { ChartOfAccountType } from "@/components/types/types";
import { useRouter } from "next/router";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LoadingButton from "@mui/lab/LoadingButton";

const isDebitNormal = (at) => ![1,5,6,7,9,11,13,14].includes(at);
const getNormalBadge = (at) => at == null ? null : isDebitNormal(at)
  ? <Chip label="Dr" size="small" sx={{ ml: 1, fontSize: "0.7rem", height: 20, minWidth: 28 }} color="info" variant="outlined" />
  : <Chip label="Cr" size="small" sx={{ ml: 1, fontSize: "0.7rem", height: 20, minWidth: 28 }} color="warning" variant="outlined" />;

export default function CreateRecurringJournal() {
  const router = useRouter();
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [frequency, setFrequency] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [lines, setLines] = useState([
    { chartOfAccountId: "", debitAmount: 0, creditAmount: 0, description: "" },
    { chartOfAccountId: "", debitAmount: 0, creditAmount: 0, description: "" },
  ]);

  const accountMap = {};
  accountList?.forEach((a) => { accountMap[a.id] = a; });
  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debitAmount) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.creditAmount) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const addLine = () => setLines([...lines, { chartOfAccountId: "", debitAmount: 0, creditAmount: 0, description: "" }]);
  const removeLine = (i) => { if (lines.length <= 2) { toast.error("Minimum 2 lines."); return; } setLines(lines.filter((_, idx) => idx !== i)); };
  const updateLine = (i, f, v) => {
    const u = [...lines]; u[i][f] = v;
    if (f === "debitAmount" && parseFloat(v) > 0) u[i].creditAmount = 0;
    if (f === "creditAmount" && parseFloat(v) > 0) u[i].debitAmount = 0;
    setLines(u);
  };

  const handleSubmit = async () => {
    if (!name) { toast.error("Name is required."); return; }
    if (!startDate) { toast.error("Start Date is required."); return; }
    if (lines.some((l) => !l.chartOfAccountId)) { toast.error("All lines must have an account."); return; }
    if (!isBalanced) { toast.error("Debits must equal Credits."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/RecurringJournal/Create`, {
        method: "POST",
        body: JSON.stringify({
          name, description, reference, frequency, startDate, endDate: endDate || null,
          lines: lines.map((l) => ({ chartOfAccountId: l.chartOfAccountId, debitAmount: parseFloat(l.debitAmount) || 0, creditAmount: parseFloat(l.creditAmount) || 0, description: l.description })),
        }),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 200) { toast.success("Created successfully."); setTimeout(() => router.push("/finance/recurring-journals"), 1000); }
      else toast.error(data.message || "Failed.");
    } catch { toast.error("An error occurred."); } finally { setLoading(false); }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Recurring Journal</h1>
        <ul><li><Link href="/finance/recurring-journals/">Recurring Journals</Link></li><li>Create</li></ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Name *</Typography>
                <TextField fullWidth size="small" placeholder="e.g. Monthly Rent" value={name} onChange={(e) => setName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Frequency</Typography>
                <TextField select fullWidth size="small" value={frequency} onChange={(e) => setFrequency(parseInt(e.target.value))}>
                  <MenuItem value={1}>Daily</MenuItem><MenuItem value={2}>Weekly</MenuItem><MenuItem value={3}>Monthly</MenuItem><MenuItem value={4}>Quarterly</MenuItem><MenuItem value={5}>Yearly</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Start Date *</Typography>
                <TextField type="date" fullWidth size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>End Date</Typography>
                <TextField type="date" fullWidth size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Description</Typography>
                <TextField fullWidth size="small" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Journal Lines</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>Add Line</Button>
            </Box>
            <TableContainer>
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 280 }}>Account</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>Description</TableCell>
                    <TableCell align="right" sx={{ minWidth: 130 }}>Debit</TableCell>
                    <TableCell align="right" sx={{ minWidth: 130 }}>Credit</TableCell>
                    <TableCell align="center" sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField select fullWidth size="small" value={line.chartOfAccountId} onChange={(e) => updateLine(index, "chartOfAccountId", e.target.value)}>
                          <MenuItem value="">-- Select Account --</MenuItem>
                          {accountList?.map((a) => <MenuItem key={a.id} value={a.id}><Box display="flex" alignItems="center" justifyContent="space-between" width="100%"><span>{a.code} - {a.description}</span>{getNormalBadge(a.accountType)}</Box></MenuItem>)}
                        </TextField>
                      </TableCell>
                      <TableCell><TextField fullWidth size="small" placeholder="Line description" value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} /></TableCell>
                      <TableCell><TextField type="number" fullWidth size="small" inputProps={{ min: 0, step: "0.01" }} value={line.debitAmount} onChange={(e) => updateLine(index, "debitAmount", e.target.value)} disabled={parseFloat(line.creditAmount) > 0} /></TableCell>
                      <TableCell><TextField type="number" fullWidth size="small" inputProps={{ min: 0, step: "0.01" }} value={line.creditAmount} onChange={(e) => updateLine(index, "creditAmount", e.target.value)} disabled={parseFloat(line.debitAmount) > 0} /></TableCell>
                      <TableCell align="center"><IconButton size="small" color="error" onClick={() => removeLine(index)}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  <TableRow sx={{ backgroundColor: "action.hover" }}>
                    <TableCell colSpan={2} align="right"><Typography fontWeight="bold">Totals</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight="bold" color={isBalanced ? "success.main" : "error.main"}>{formatCurrency(totalDebit)}</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight="bold" color={isBalanced ? "success.main" : "error.main"}>{formatCurrency(totalCredit)}</Typography></TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button variant="contained" color="error" size="small" onClick={() => router.push("/finance/recurring-journals")}>Cancel</Button>
              <LoadingButton variant="contained" size="small" loading={loading} disabled={!isBalanced} onClick={handleSubmit}>Save</LoadingButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
