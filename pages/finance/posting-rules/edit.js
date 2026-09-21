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
import { Typography, Button, TextField, MenuItem, IconButton, Box } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { useRouter } from "next/router";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import LoadingButton from "@mui/lab/LoadingButton";

const sourceModules = [
  { value: 1, label: "Sales Invoice" },
  { value: 2, label: "Sales Return" },
  { value: 3, label: "Receipt" },
  { value: 4, label: "Credit Note" },
  { value: 5, label: "Supplier Payment" },
  { value: 6, label: "Goods Received Note" },
  { value: 7, label: "Bank Transaction" },
  { value: 8, label: "Cash In/Out" },
  { value: 9, label: "Payroll" },
  { value: 10, label: "Expense" },
  { value: 11, label: "Depreciation" },
  { value: 12, label: "Reservation" },
];

export default function EditPostingRule() {
  const router = useRouter();
  const { id } = router.query;
  const { data: accountList } = useApi("/ChartOfAccount/GetAll");
  const [loading, setLoading] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [sourceModule, setSourceModule] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!id) return;
    const fetchRule = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/PostingRule/GetAll?SkipCount=0&MaxResultCount=100&Search=null`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        const rule = data.result.items.find((r) => r.id === parseInt(id));
        if (rule) {
          setRuleName(rule.ruleName);
          setSourceModule(rule.sourceModule);
          setDescription(rule.description || "");
          setLines(
            rule.lines.map((l) => ({
              chartOfAccountId: l.chartOfAccountId,
              transactionType: l.transactionType,
              description: l.description || "",
              sortOrder: l.sortOrder,
            }))
          );
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchRule();
  }, [id]);

  const addLine = () => {
    setLines([...lines, { chartOfAccountId: "", transactionType: 2, description: "", sortOrder: lines.length + 1 }]);
  };

  const removeLine = (index) => {
    if (lines.length <= 2) { toast.error("A posting rule must have at least 2 lines."); return; }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;
    setLines(updated);
  };

  const handleSubmit = async () => {
    if (!ruleName) { toast.error("Rule Name is required."); return; }
    if (!sourceModule) { toast.error("Source Module is required."); return; }
    if (lines.some((l) => !l.chartOfAccountId)) { toast.error("All lines must have an account selected."); return; }

    const hasDebit = lines.some((l) => l.transactionType === 2);
    const hasCredit = lines.some((l) => l.transactionType === 1);
    if (!hasDebit || !hasCredit) { toast.error("Rule must have at least one Debit and one Credit line."); return; }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ruleName,
        sourceModule: parseInt(sourceModule),
        description,
        lines: lines.map((l, i) => ({
          chartOfAccountId: l.chartOfAccountId,
          transactionType: l.transactionType,
          description: l.description,
          sortOrder: i + 1,
        })),
      };

      const response = await fetch(`${BASE_URL}/PostingRule/Update/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Posting Rule updated successfully.");
        setTimeout(() => router.push("/finance/posting-rules"), 1000);
      } else {
        toast.error(data.message || "Failed to update posting rule.");
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
        <h1>Edit Posting Rule</h1>
        <ul>
          <li><Link href="/finance/posting-rules/">Posting Rules</Link></li>
          <li>Edit</li>
        </ul>
      </div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Rule Name</Typography>
                <TextField fullWidth size="small" value={ruleName} onChange={(e) => setRuleName(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Source Module</Typography>
                <TextField select fullWidth size="small" value={sourceModule} onChange={(e) => setSourceModule(e.target.value)}>
                  <MenuItem value="">-- Select Module --</MenuItem>
                  {sourceModules.map((m) => (
                    <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "5px" }}>Description</Typography>
                <TextField fullWidth size="small" value={description} onChange={(e) => setDescription(e.target.value)} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Account Mappings</Typography>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addLine}>Add Line</Button>
            </Box>
            <TableContainer>
              <Table size="small" className="dark-table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 280 }}>Account</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Debit / Credit</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Description</TableCell>
                    <TableCell align="center" sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField select fullWidth size="small" value={line.chartOfAccountId} onChange={(e) => updateLine(index, "chartOfAccountId", e.target.value)}>
                          <MenuItem value="">-- Select Account --</MenuItem>
                          {accountList?.map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>{acc.code} - {acc.description}</MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField select fullWidth size="small" value={line.transactionType} onChange={(e) => updateLine(index, "transactionType", parseInt(e.target.value))}>
                          <MenuItem value={2}>Debit</MenuItem>
                          <MenuItem value={1}>Credit</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField fullWidth size="small" value={line.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeLine(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button variant="contained" color="error" size="small" onClick={() => router.push("/finance/posting-rules")}>Cancel</Button>
              <LoadingButton variant="contained" size="small" loading={loading} onClick={handleSubmit}>Update Rule</LoadingButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
}
