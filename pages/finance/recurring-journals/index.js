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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Chip, IconButton, Tooltip, Box, Switch } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { useRouter } from "next/router";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const getFrequency = (f) => {
  switch (f) {
    case 1: return "Daily";
    case 2: return "Weekly";
    case 3: return "Monthly";
    case 4: return "Quarterly";
    case 5: return "Yearly";
    default: return "-";
  }
};

export default function RecurringJournals() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const router = useRouter();

  const fetchItems = async (pg = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pg - 1) * size;
      const response = await fetch(`${BASE_URL}/RecurringJournal/GetAll?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setItems(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) { console.error("Error:", error); }
  };

  const handleToggle = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/RecurringJournal/ToggleActive/${id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.statusCode === 200) { toast.success(data.message); fetchItems(page, searchTerm, pageSize); }
      else toast.error(data.message);
    } catch { toast.error("An error occurred."); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recurring journal?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/RecurringJournal/Delete/${id}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.statusCode === 200) { toast.success("Deleted."); fetchItems(); }
      else toast.error(data.message);
    } catch { toast.error("An error occurred."); }
  };

  useEffect(() => { fetchItems(); }, []);

  if (!navigate) return <AccessDenied />;

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Recurring Journals</h1>
        <ul><li><Link href="/finance/recurring-journals/">Recurring Journals</Link></li></ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase placeholder="Search by name..." inputProps={{ "aria-label": "search" }} value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); fetchItems(1, e.target.value, pageSize); }} />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create && <Button variant="outlined" onClick={() => router.push("/finance/recurring-journals/create")}>+ New Recurring Journal</Button>}
        </Grid>
        <Grid item xs={12} order={{ xs: 3 }}>
          <TableContainer component={Paper}>
            <Table className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>Next Run</TableCell>
                  <TableCell>Last Run</TableCell>
                  <TableCell align="center">Runs</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Active</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={8}><Typography color="error">No Recurring Journals</Typography></TableCell></TableRow>
                ) : items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{item.name}</Typography>
                      {item.description && <Typography variant="caption" color="text.secondary">{item.description}</Typography>}
                    </TableCell>
                    <TableCell><Chip label={getFrequency(item.frequency)} size="small" variant="outlined" /></TableCell>
                    <TableCell>{item.nextRunDate ? formatDate(item.nextRunDate) : "-"}</TableCell>
                    <TableCell>{item.lastRunDate ? formatDate(item.lastRunDate) : "Never"}</TableCell>
                    <TableCell align="center">{item.totalRuns}</TableCell>
                    <TableCell align="right">{formatCurrency(item.totalDebit)}</TableCell>
                    <TableCell align="center">
                      <Switch checked={item.isActive} size="small" onChange={() => handleToggle(item.id)} />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="end" gap={0.5}>
                        {update && <Tooltip title="Edit"><IconButton size="small" onClick={() => router.push(`/finance/recurring-journals/edit?id=${item.id}`)}><EditIcon color="primary" fontSize="small" /></IconButton></Tooltip>}
                        {remove && <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(item.id)}><DeleteIcon color="error" fontSize="small" /></IconButton></Tooltip>}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination count={Math.ceil(totalCount / pageSize)} page={page} onChange={(e, v) => { setPage(v); fetchItems(v, searchTerm, pageSize); }} color="primary" shape="rounded" />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={(e) => { setPageSize(e.target.value); setPage(1); fetchItems(1, searchTerm, e.target.value); }}>
                  <MenuItem value={5}>5</MenuItem><MenuItem value={10}>10</MenuItem><MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
