import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import BASE_URL from "Base/api";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";
import UpdateConfirmQuotation from "@/components/UIElements/Modal/UpdateConfirmQuotation";
import ViewComments from "../comments";
import { projectStatusColor, projectStatusType } from "@/components/types/types";
import { useRouter } from "next/router";

export default function ViewSentQuotations({ item, update, fetchItems }) {
  const [open, setOpen] = useState(false);
  const [quots, setQuots] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    setTabIndex(0);
    fetchItems();
  };
  const handleOpen = async () => {
    await fetchSentQuotList();
    setOpen(true);
  };

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const navigateToEdit = (id, option) => {
    router.push({
      pathname: "/inquiry/edit-inquiry",
      query: { id, option },
    });
  };

  const fetchSentQuotList = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/Inquiry/GetAllSentQuotationsByCustomerId?id=${item.customerId}&inquiryId=${item.inquiryId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      setQuots(data.result);
    } catch (error) {
      console.error("Error fetching Supplier List:", error);
    }
  };

  const filteredQuots = (statusType) => quots.filter(q => q.projectStatusType === statusType);

  const renderTable = (quotations, isRejected = false) => (
    <TableContainer component={Paper}>
      <Table aria-label="quotations table">
        <TableHead>
          <TableRow>
            <TableCell>Doc. No</TableCell>
            <TableCell>Option</TableCell>
            <TableCell>Sent Date</TableCell>
            <TableCell>Start Date</TableCell>
            <TableCell>Adv. Payment (%)</TableCell>
            <TableCell>Valid Days</TableCell>
            <TableCell>Working Days</TableCell>
            <TableCell>Credit Term Days</TableCell>
            <TableCell>Selected Option</TableCell>
            <TableCell>Document</TableCell>
            <TableCell>Sent By</TableCell>
            <TableCell>Comments</TableCell>
            {isRejected && <TableCell>Rejected Reason</TableCell>}
            <TableCell align="right">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isRejected ? 12 : 11}>
                <Typography color="error">No Quotations Available</Typography>
              </TableCell>
            </TableRow>
          ) : (
            quotations.map((q, index) => (
              <TableRow key={index}>
                <TableCell>{q.documentNo}</TableCell>
                <TableCell>{q.optionName}</TableCell>
                <TableCell>{formatDate(q.sentDate)}</TableCell>
                <TableCell>{formatDate(q.startDate)}</TableCell>
                <TableCell>{q.advancePaymentPercentage}</TableCell>
                <TableCell>{q.validDays}</TableCell>
                <TableCell>{q.workingDays}</TableCell>
                <TableCell>{q.creditTermDays}</TableCell>
                <TableCell>{q.selectedOption}</TableCell>                
                <TableCell>
                  <a href={q.documentURL} target="_blank">View</a>
                </TableCell>
                <TableCell>{q.sentBy}</TableCell>
                <TableCell>
                  <ViewComments item={q} />
                </TableCell>
                {isRejected && <TableCell>{q.rejectedReason || "N/A"}</TableCell>}
                <TableCell align="right">
                  <Box display="flex" gap={1} justifyContent="end">
                    {update && q.projectStatusType === 1 ? <Button variant="outlined" onClick={() => navigateToEdit(q.inquiryId, q.optionId)}>Edit</Button> : ""}
                    {q.projectStatusType === 1 && (
                      <Box display="flex" justifyContent="end" gap={1}>
                        <UpdateConfirmQuotation fetchItems={fetchSentQuotList} type={2} sentQuotId={q.id} isConfirm={true} />
                        <UpdateConfirmQuotation fetchItems={fetchSentQuotList} type={9} sentQuotId={q.id} isConfirm={false} />
                      </Box>
                    )}
                    {q.projectStatusType !== 1 && (
                      <Chip sx={{ color: "#fff", background: projectStatusColor(q.projectStatusType) }} label={projectStatusType(q.projectStatusType)} />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Button variant="outlined" onClick={handleOpen}>View</Button>
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, bgcolor: "background.paper", boxShadow: 24, p: 2, display: "flex", flexDirection: "column" }}>
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>Sent Quotations</Typography>
          <Typography sx={{ mb: 2 }}>{item.customerName} / Inquiry Code: {item.inquiryCode}</Typography>

          <Tabs value={tabIndex} onChange={handleTabChange}>
            <Tab label="Pending" />
            <Tab label="Confirmed" />
            <Tab label="Rejected" />
          </Tabs>

          <Box sx={{ flex: 1, overflowY: "auto", mt: 2 }}>
            {tabIndex === 0 && renderTable(filteredQuots(1))}
            {tabIndex === 1 && renderTable(filteredQuots(2))}
            {tabIndex === 2 && renderTable(filteredQuots(9), true)}
          </Box>

          <Box my={2}>
            <Button variant="contained" color="error" onClick={handleClose}>Close</Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
