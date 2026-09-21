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
import { Pagination, Typography, FormControl, InputLabel, MenuItem, Select, Button, Chip, IconButton, Tooltip, Box, Collapse } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import { useRouter } from "next/router";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

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

export default function PostingRules() {
  const cId = sessionStorage.getItem("category");
  const { navigate, create, update, remove } = IsPermissionEnabled(cId);
  const [rules, setRules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const router = useRouter();

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
    fetchRules(1, event.target.value, pageSize);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    fetchRules(value, searchTerm, pageSize);
  };

  const handlePageSizeChange = (event) => {
    const newSize = event.target.value;
    setPageSize(newSize);
    setPage(1);
    fetchRules(1, searchTerm, newSize);
  };

  const fetchRules = async (pg = 1, search = "", size = pageSize) => {
    try {
      const token = localStorage.getItem("token");
      const skip = (pg - 1) * size;
      const query = `${BASE_URL}/PostingRule/GetAll?SkipCount=${skip}&MaxResultCount=${size}&Search=${search || "null"}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch posting rules");
      const data = await response.json();
      setRules(data.result.items);
      setTotalCount(data.result.totalCount || 0);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this posting rule?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/PostingRule/Delete/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success("Posting Rule deleted.");
        fetchRules();
      } else {
        toast.error(data.message || "Failed to delete.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Posting Rules</h1>
        <ul>
          <li><Link href="/finance/posting-rules/">Posting Rules</Link></li>
        </ul>
      </div>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} lg={4} order={{ xs: 2, lg: 1 }}>
          <Search className="search-form">
            <StyledInputBase
              placeholder="Search by rule name..."
              inputProps={{ "aria-label": "search" }}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Search>
        </Grid>
        <Grid item xs={12} lg={8} mb={1} display="flex" justifyContent="end" order={{ xs: 1, lg: 2 }}>
          {create ? (
            <Button variant="outlined" onClick={() => router.push("/finance/posting-rules/create")}>
              + New Posting Rule
            </Button>
          ) : ""}
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 3 }}>
          <TableContainer component={Paper}>
            <Table aria-label="posting rules table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }}></TableCell>
                  <TableCell>Rule Name</TableCell>
                  <TableCell>Source Module</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography color="error">No Posting Rules Available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <React.Fragment key={rule.id}>
                      <TableRow>
                        <TableCell>
                          <IconButton size="small" onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}>
                            {expandedId === rule.id ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{rule.ruleName}</TableCell>
                        <TableCell>{getSourceModule(rule.sourceModule)}</TableCell>
                        <TableCell>
                          {rule.isActive
                            ? <Chip label="Active" size="small" color="success" variant="outlined" />
                            : <Chip label="Inactive" size="small" color="default" variant="outlined" />
                          }
                        </TableCell>
                        <TableCell>{rule.description || "-"}</TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="end" gap={0.5}>
                            {update && (
                              <Tooltip title="Edit" placement="top">
                                <IconButton size="small" onClick={() => router.push(`/finance/posting-rules/edit?id=${rule.id}`)}>
                                  <EditIcon color="primary" fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {remove && (
                              <Tooltip title="Delete" placement="top">
                                <IconButton size="small" onClick={() => handleDelete(rule.id)}>
                                  <DeleteIcon color="error" fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      {expandedId === rule.id && rule.lines?.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0, px: 4, backgroundColor: "action.hover" }}>
                            <Box py={1}>
                              <Typography variant="subtitle2" mb={1}>Account Mappings</Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Account Code</TableCell>
                                    <TableCell>Account Description</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Description</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {rule.lines.map((line, idx) => (
                                    <TableRow key={idx}>
                                      <TableCell>{line.accountCode}</TableCell>
                                      <TableCell>{line.accountDescription}</TableCell>
                                      <TableCell>
                                        {line.transactionType === 2
                                          ? <Chip label="Debit" size="small" color="info" variant="outlined" />
                                          : <Chip label="Credit" size="small" color="warning" variant="outlined" />
                                        }
                                      </TableCell>
                                      <TableCell>{line.description || "-"}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
            <Grid container justifyContent="space-between" mt={2} mb={2}>
              <Pagination
                count={Math.ceil(totalCount / pageSize)}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
              <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={handlePageSizeChange}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </TableContainer>
        </Grid>
      </Grid>
    </>
  );
}
