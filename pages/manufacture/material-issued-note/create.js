"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { formatDate } from "@/components/utils/formatHelper";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import SearchProjectByKeyword from "@/components/utils/SearchProjectByKeyword";
import SearchMaterialRequestNote from "@/components/utils/SearchMaterialRequestNote";
import SearchUser from "@/components/utils/SearchUser";

const CreateMaterialIssuedNote = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [noteNo, setNoteNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRequestNotes, setSelectedRequestNotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);
  const [warehouses, setWarehouses] = useState([]);

  const updateNoteNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=56`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setNoteNo(result.result);
    } catch (err) {
      console.error('Error fetching next document number:', err);
    }
  };

  useEffect(() => {
    updateNoteNo();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    // Update products when selectedRequestNotes change
    if (selectedRequestNotes.length > 0) {
      const allLineItems = [];
      selectedRequestNotes.forEach(note => {
        const lineDetails = note.materialRequestNoteLines || [];
        lineDetails.forEach(item => {
          // Create a unique key combining productId and materialRequestNoteId
          const uniqueKey = `${item.productId}_${note.id}`;
          const existingIndex = allLineItems.findIndex(p => p.uniqueKey === uniqueKey);
          if (existingIndex >= 0) {
            // Update existing product quantities
            allLineItems[existingIndex].requestedQty += (item.requestingQty || 0);
            // Recalculate difference: x = requestedQty - issuedQty
            const x = allLineItems[existingIndex].requestedQty - allLineItems[existingIndex].issuedQty;
            const currentIssueQty = parseFloat(allLineItems[existingIndex].issueQty) || 0;
            allLineItems[existingIndex].difference = x - currentIssueQty;
          } else {
            // Add new product
            // x = requestedQty - issuedQty (remaining quantity that can be issued)
            const x = (item.requestingQty || 0) - (item.issuedQty || 0);
            allLineItems.push({
              uniqueKey: uniqueKey,
              id: item.productId,
              code: item.productCode,
              name: item.productName,
              stockQty: item.stockQty || 0,
              requestedQty: item.requestingQty || 0,
              issuedQty: item.issuedQty || 0,
              issueQty: "",
              difference: x, // Initial difference = x (remaining quantity)
              materialRequestNoteId: note.id,
              materialRequestNoteLineId: item.id,
            });
          }
        });
      });
      setProducts(allLineItems);
    } else {
      setProducts([]);
    }
  }, [selectedRequestNotes]);



  const fetchWarehouses = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Warehouse/GetAllWarehouse`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const warehouseList = Array.isArray(data?.result) ? data.result : Array.isArray(data) ? data : [];
        setWarehouses(warehouseList);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const handleRequestNoteSelect = (note) => {
    // Check if note is already selected
    const isAlreadySelected = selectedRequestNotes.some(n => n.id === note.id);
    if (isAlreadySelected) {
      toast.warning("This material request note is already added");
      return;
    }

    // Add note to selected list
    setSelectedRequestNotes(prev => [...prev, note]);
  };

  const handleRemoveRequestNote = (noteId) => {
    setSelectedRequestNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...products];
    const row = updatedRows[index];
    
    if (name === "issueQty") {
      const issueQty = parseFloat(value) || 0;
      
      // x = requestedQty - issuedQty (remaining quantity that can be issued)
      const x = row.requestedQty - row.issuedQty;
      
      // Validation: issue quantity cannot be more than stockQty
      if (issueQty > row.stockQty) {
        toast.warning(`Issue quantity cannot be more than stock quantity (${row.stockQty})`);
        return;
      }
      
      // Validation: issue quantity cannot be more than x (remaining quantity)
      if (issueQty > x) {
        toast.warning(`Issue quantity cannot be more than remaining quantity (${x.toFixed(2)})`);
        return;
      }
      
      row.issueQty = value;
      // difference = x - y = (requestedQty - issuedQty) - issueQty
      row.difference = x - issueQty;
    } else {
      row[name] = value;
    }

    setProducts(updatedRows);
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...products];
    updatedRows.splice(index, 1);
    setProducts(updatedRows);
  };

  const handleSubmit = async () => {
    if (!selectedProject) return toast.error("Please select project");
    if (!warehouseId) return toast.error("Please select warehouse");
    if (!selectedUser) return toast.error("Please select assigned user");
    if (products.length === 0) return toast.error("At least one product must be added");
    if (products.some((p) => !p.issueQty || parseFloat(p.issueQty) <= 0))
      return toast.error("All rows must have issue quantity");
    
    // Validate issue quantity constraints
    for (const product of products) {
      const issueQty = parseFloat(product.issueQty) || 0;
      
      // x = requestedQty - issuedQty (remaining quantity that can be issued)
      const x = product.requestedQty - product.issuedQty;
      
      // Validation: issue quantity cannot be more than stockQty
      if (issueQty > product.stockQty) {
        toast.error(`Issue quantity for ${product.name} cannot be more than stock quantity (${product.stockQty})`);
        return;
      }
      
      // Validation: issue quantity cannot be more than x (remaining quantity)
      if (issueQty > x) {
        toast.error(`Issue quantity for ${product.name} cannot be more than remaining quantity (${x.toFixed(2)})`);
        return;
      }
    }

    const data = {
      ProjectId: Number(selectedProject.id),
      Date: date ? new Date(date).toISOString() : null,
      Remark: remark || "",
      ReferenceNo: referenceNo || "",
      WarehouseId: Number(warehouseId),
      AssignedUserId: selectedUser ? Number(selectedUser.id) : null,
      MaterialIssuedNoteLines: products.map((row) => ({
        MaterialRequestNoteId: row.materialRequestNoteId,
        MaterialRequestNoteLineId: row.materialRequestNoteLineId,
        ProductId: row.id || null,
        ProductName: row.name || "",
        IssuedQty: parseFloat(row.issueQty) || null,
        Difference: parseFloat(row.difference) || null,
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/MaterialIssuedNote/CreateMaterialIssuedNote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const jsonResponse = await response.json();
        if (jsonResponse.statusCode === 200) {
          toast.success(jsonResponse.message);
          setTimeout(() => {
            window.location.href = "/manufacture/material-issued-note/";
          }, 1500);
        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while submitting");
    } finally {
      setIsSubmitting(false);
      setIsDisable(false);
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/manufacture/material-issued-note/",
    });
  };

  console.log(selectedRequestNotes);

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Material Issued Note</h1>
        <ul>
          <li>
            <Link href="/manufacture/material-issued-note">Material Issued Note</Link>
          </li>
          <li> Create</li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1}>
            <Grid item xs={12} display="flex" gap={1} justifyContent="end">
              <Button variant="outlined" disabled>
                <Typography sx={{ fontWeight: "bold" }}>
                  Note No: {noteNo}
                </Typography>
              </Button>
              <Button variant="outlined" onClick={() => navigateToBack()}>
                Go Back
              </Button>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Project
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchProjectByKeyword
                  label="Project"
                  placeholder="Search project by keyword"
                  displayValue={selectedProject 
                    ? (selectedProject.code 
                        ? `${selectedProject.name} - ${selectedProject.code}`
                        : selectedProject.name || "")
                    : ""}
                  onSelect={(project) => {
                    setSelectedProject(project);
                  }}
                  onClear={() => {
                    setSelectedProject(null);
                  }}
                />
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Warehouse
              </Typography>
              <Box sx={{ width: "60%" }}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Warehouse</InputLabel>
                  <Select
                    value={warehouseId}
                    label="Warehouse"
                    onChange={(e) => setWarehouseId(e.target.value)}
                    required
                  >
                    <MenuItem value="">None</MenuItem>
                    {warehouses.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={String(warehouse.id)}>
                        {warehouse.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Reference No
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Date
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Remark
              </Typography>
              <TextField
                sx={{ width: "60%" }}
                size="small"
                fullWidth
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </Grid>
            <Grid
              item
              xs={12}
              lg={6}
              display="flex"
              justifyContent="space-between"
              mt={1}
            >
              <Typography
                component="label"
                sx={{
                  fontWeight: "500",
                  p: 1,
                  fontSize: "14px",
                  display: "block",
                  width: "35%",
                }}
              >
                Assigned User
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchUser
                  label="Assigned User"
                  placeholder="Search users by name"
                  main={true}
                  mainItem={selectedUser?.id || null}
                  displayValue={selectedUser 
                    ? (selectedUser.firstName && selectedUser.lastName
                        ? `${selectedUser.firstName} ${selectedUser.lastName}`
                        : selectedUser.firstName || selectedUser.lastName || selectedUser.userName || "")
                    : ""}
                  onSelect={(user) => {
                    setSelectedUser(user);
                  }}
                  onClear={() => {
                    setSelectedUser(null);
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} mt={3}>
              <Typography variant="h6" fontWeight={600} mb={1}>
                Material Request Notes
              </Typography>
              <Box sx={{ mb: 1 }}>
                <SearchMaterialRequestNote
                  label="Search Material Request Notes"
                  placeholder={selectedProject ? "Search material request notes..." : "Please select a project first"}
                  projectId={selectedProject?.id || null}
                  onSelect={handleRequestNoteSelect}
                  onClear={() => {}}
                />
              </Box>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="request notes table" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}>Document No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Reference No</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Date</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Customer</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRequestNotes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No material request notes added. Search and select notes to add them here.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      selectedRequestNotes.map((note) => (
                        <TableRow key={note.id}>
                          <TableCell>{note.documentNo || "-"}</TableCell>
                          <TableCell>{note.referenceNo || "-"}</TableCell>
                          <TableCell>{formatDate(note.date)}</TableCell>
                          <TableCell>{note.customerName || "-"}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveRequestNote(note.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} mt={3}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Products
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small" aria-label="products table" className="dark-table">
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Name</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Stock Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Requested Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Issued Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Issue Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Select a material request note to load products
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((item, index) => (
                        <TableRow key={index}
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell align="right">
                            <Tooltip title="Delete" placement="top">
                              <IconButton onClick={() => handleDeleteRow(index)} aria-label="delete" size="small">
                                <DeleteIcon color="error" fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            {item.name}
                          </TableCell>
                          <TableCell>{item.stockQty}</TableCell>
                          <TableCell>{item.requestedQty}</TableCell>
                          <TableCell>{item.issuedQty}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.issueQty}
                              onChange={(e) => handleChange(index, e.target.value, "issueQty")}
                              disabled={item.requestedQty === item.issuedQty}
                              helperText={item.requestedQty === item.issuedQty ? "Already fully issued" : ""}
                            />
                          </TableCell>
                          <TableCell>{item.difference}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} my={2}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={() => handleSubmit()}
                disabled={isDisable}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default CreateMaterialIssuedNote;

