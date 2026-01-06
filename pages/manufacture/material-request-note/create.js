"use client";
import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Box,
  Button,
  IconButton,
  Paper,
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
import SearchBOMANDBOQ from "@/components/utils/SearchBOMANDBOQ";
import SearchBOMANDBOQSingle from "@/components/utils/SearchBOMANDBOQSingle";
import SearchCustomer from "@/components/utils/SearchCustomer";
import SearchProject from "@/components/utils/SearchProject";
import SearchUser from "@/components/utils/SearchUser";
import SearchItems from "@/components/utils/SearchItems";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";

const CreateMaterialRequestNote = () => {
  const router = useRouter();
  const today = new Date();
  const [date, setDate] = useState(formatDate(today));
  const [noteNo, setNoteNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectBillType, setProjectBillType] = useState(null);
  const [remark, setRemark] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [addedRows, setAddedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisable, setIsDisable] = useState(false);

  const updateNoteNo = async () => {
    try {
      const response = await fetch(`${BASE_URL}/DocumentSequence/GetNextDocumentNumber?documentType=55`, {
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
  }, []);

  // Clear project when customer changes
  useEffect(() => {
    if (!selectedCustomer?.id) {
      setSelectedProject(null);
      setProjectBillType(null);
      setSelectedBOMBOQItems([]);
      setAddedRows([]);
    }
  }, [selectedCustomer]);

  // Clear BOM/BOQ items and rows when project changes
  useEffect(() => {
    if (!selectedProject?.id) {
      setSelectedBOMBOQItems([]);
      setAddedRows([]);
    }
  }, [selectedProject]);

  // Fetch project details to get billType when project is selected
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (selectedProject?.id) {
        try {
          const response = await fetch(`${BASE_URL}/Project/GetProjectById?id=${selectedProject.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
            if (data.result) {
              setProjectBillType(data.result.billType || null);
            }
          }
        } catch (error) {
          console.error("Error fetching project details:", error);
        }
      } else {
        setProjectBillType(null);
      }
    };
    fetchProjectDetails();
  }, [selectedProject]);

  const [selectedBOMBOQItems, setSelectedBOMBOQItems] = useState([]);
  const [selectedBOMBOQ, setSelectedBOMBOQ] = useState(null);

  const handleBOMBOQSingleSelect = (item, lineItems) => {
    // Set selected BOM/BOQ (single selection)
    setSelectedBOMBOQ(item);
    
    // Add all line items to the table
    const newRows = lineItems.map((lineItem) => {
      const billType = item.billOfMaterialLineDetails ? 1 : 2;
      const mappedRow = {
        id: lineItem.productId,
        code: lineItem.productCode,
        name: lineItem.productName,
        boqQty: lineItem.quantity || "",
        requestingQty: "",
        remark: "",
        parentBOMBOQId: item.id,
        billType: billType,
        billId: item.id,
        originalLineItem: lineItem,
      };
      return mappedRow;
    });

    // Replace all existing rows with new ones from selected BOM/BOQ
    setAddedRows(newRows);
  };

  const handleBOMBOQSingleClear = () => {
    setSelectedBOMBOQ(null);
    setAddedRows([]);
  };

  const handleBOMBOQSelect = (item, lineItems) => {
    // Add to selected items list
    setSelectedBOMBOQItems((prev) => [...prev, item]);
    
    // Determine billType based on which array the item came from
    // If item has billOfMaterialLineDetails, it's BOM (billType = 1)
    // If item has billOfQuantityLines, it's BOQ (billType = 2)
    const billType = item.billOfMaterialLineDetails ? 1 : 2;
    
    // Add all line items to the table
    const newRows = lineItems.map((lineItem) => {
      // Map line item fields based on whether it's from BOM or BOQ
      const mappedRow = {
        id: lineItem.productId,
        code: lineItem.productCode,
        name: lineItem.productName,
        boqQty: lineItem.quantity || "",
        requestingQty: "",
        remark: "",
        // Keep reference to parent BOM/BOQ item
        parentBOMBOQId: item.id,
        billType: billType,
        billId: item.id,
        // Keep original line item data for reference
        originalLineItem: lineItem,
      };
      return mappedRow;
    });

    // Check for duplicates and add only new items
    const existingIds = new Set(addedRows.map(row => row.id));
    const uniqueNewRows = newRows.filter(row => !existingIds.has(row.id));
    
    if (uniqueNewRows.length === 0) {
      toast.warning("All items from this BOM/BOQ are already added.");
      return;
    }

    setAddedRows((prevRows) => {
      return [...prevRows, ...uniqueNewRows];
    });
  };

  const handleBOMBOQRemove = (itemToRemove) => {
    // Remove from selected items
    setSelectedBOMBOQItems((prev) => prev.filter(item => item.id !== itemToRemove.id));
    
    // Remove all line items that belong to this BOM/BOQ
    setAddedRows((prevRows) => 
      prevRows.filter(row => row.parentBOMBOQId !== itemToRemove.id)
    );
  };

  const handleAddRow = (item) => {
    const isDuplicate = addedRows.some(row => row.id === item.id);
    if (isDuplicate) {
      toast.warning("This Item is already added.");
      return;
    }

    const newRow = {
      ...item,
      boqQty: "", // null when added via SearchItems
      requestingQty: "",
      remark: "",
      billType: null,
      billId: null,
      parentBOMBOQId: null,
    };

    setAddedRows((prevRows) => {
      const updatedRows = [...prevRows, newRow];
      return updatedRows;
    });
  };

  const handleDeleteRow = (index) => {
    const updatedRows = [...addedRows];
    updatedRows.splice(index, 1);
    setAddedRows(updatedRows);
  };

  const handleChange = (index, value, name) => {
    const updatedRows = [...addedRows];
    updatedRows[index][name] = value;
    setAddedRows(updatedRows);
  };

  // Line items cannot be deleted individually - they can only be removed by removing the parent BOM/BOQ
  // const handleDeleteRow = (index) => {
  //   const updatedRows = [...addedRows];
  //   updatedRows.splice(index, 1);
  //   setAddedRows(updatedRows);
  // };

  const handleSubmit = async () => {
    if (!selectedCustomer) return toast.error("Please select customer");
    if (!selectedProject) return toast.error("Please select project");
    if (!selectedUser) return toast.error("Please select assigned user");
    if (addedRows.length === 0) return toast.error("At least one item must be added");
    if (addedRows.some((r) => !r.requestingQty))
      return toast.error("All rows must have requesting quantity");

    const data = {
      ProjectId: Number(selectedProject.id),
      CustomerId: Number(selectedCustomer.id),
      Date: date ? new Date(date).toISOString() : null,
      Remark: remark || "",
      ReferenceNo: referenceNo || "",
      AssignedUser: selectedUser ? Number(selectedUser.id) : null,
      MaterialRequestNoteLines: addedRows.map((row) => ({
        ProductId: row.id,
        BillType: row.billType || 0,
        BillQuantity: row.boqQty ? parseFloat(row.boqQty) : 0,
        BillId: row.billId || 0,
        RequestingQty: parseFloat(row.requestingQty) || null,
        IssuedQty: null,
        ReturnedQty: null,
        Remark: row.remark || "",
      })),
    };

    try {
      setIsSubmitting(true);
      setIsDisable(true);
      const response = await fetch(
        `${BASE_URL}/MaterialRequestNote/CreateMaterialRequestNote`,
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
            window.location.href = "/manufacture/material-request-note/";
          }, 1500);
        } else {
          toast.error(jsonResponse.message);
        }
      } else {
        toast.error("Please fill all required fields");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToBack = () => {
    router.push({
      pathname: "/manufacture/material-request-note/",
    });
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>Create Material Request Note</h1>
        <ul>
          <li>
            <Link href="/manufacture/material-request-note">Material Request Note</Link>
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
                Customer
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchCustomer
                    label="Customer"
                  placeholder="Search customers by name"
                  main={true}
                  mainItem={selectedCustomer?.id || null}
                  displayValue={selectedCustomer 
                    ? (selectedCustomer.firstName && selectedCustomer.lastName
                        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
                        : selectedCustomer.displayName || "")
                    : ""}
                  onSelect={(customer) => {
                    setSelectedCustomer(customer);
                  }}
                  onClear={() => {
                    setSelectedCustomer(null);
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
                Project
              </Typography>
              <Box sx={{ width: "60%" }}>
                <SearchProject
                    label="Project"
                  placeholder="Search projects by name"
                  main={true}
                  mainItem={selectedProject?.id || null}
                  billType={0}
                  customerId={selectedCustomer?.id || null}
                  displayValue={selectedProject 
                    ? (selectedProject.code || "")
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
            {selectedCustomer?.id && selectedProject?.id && (
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
                  {projectBillType === 1 ? "BOM Number" : projectBillType === 2 ? "BOQ Number" : "BOM/BOQ Number"}
                </Typography>
                <Box sx={{ width: "60%" }}>
                  <SearchBOMANDBOQSingle
                    label={projectBillType === 1 ? "BOM Number" : projectBillType === 2 ? "BOQ Number" : "BOM/BOQ Number"}
                    placeholder="Search BOM and BOQ by keyword"
                    customerId={selectedCustomer?.id || null}
                    projectId={selectedProject?.id || null}
                    projectBillType={projectBillType}
                    displayValue={selectedBOMBOQ 
                      ? (selectedBOMBOQ.documentNo 
                          ? `${selectedBOMBOQ.documentNo} - ${selectedBOMBOQ.productName || ""}`
                          : selectedBOMBOQ.productName || "")
                      : ""}
                    onSelect={handleBOMBOQSingleSelect}
                    onClear={handleBOMBOQSingleClear}
                  />
                </Box>
              </Grid>
            )}
            <Grid item xs={12} mt={3} mb={1}>
              <SearchItems
                label="Search"
                placeholder="Search Items by name"
                fetchUrl={`${BASE_URL}/Items/GetAllItemsByName`}
                main={false}
                mainItem={null}
                onSelect={(item) => {
                  handleAddRow(item)
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table
                  size="small"
                  aria-label="simple table"
                  className="dark-table"
                >
                  <TableHead>
                    <TableRow sx={{ background: "#757fef" }}>
                      <TableCell sx={{ color: "#fff" }}></TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product Code</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Product</TableCell>
                      <TableCell sx={{ color: "#fff" }}>BOQ/BOM Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Requesting Qty</TableCell>
                      <TableCell sx={{ color: "#fff" }}>Remark</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {addedRows.length === 0 ? "" :
                      (addedRows.map((item, index) => (
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
                            {item.code || "-"}
                          </TableCell>
                          <TableCell>
                            {item.name || "-"}
                          </TableCell>
                          <TableCell>
                            <TextField 
                              size="small" 
                              value={item.boqQty || ""} 
                              disabled
                              InputProps={{
                                readOnly: true,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField size="small" value={item.requestingQty} onChange={(e) => handleChange(index, e.target.value, "requestingQty")} />
                          </TableCell>
                          <TableCell>
                            <TextField fullWidth size="small" value={item.remark} onChange={(e) => handleChange(index, e.target.value, "remark")} />
                          </TableCell>
                        </TableRow>
                      )))}

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

export default CreateMaterialRequestNote;

