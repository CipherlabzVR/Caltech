import React, { useEffect, useState } from "react";
import {
  Grid,
  Typography,
  Box,
  Button,
  Modal,
  Tooltip,
  IconButton,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tabs,
  Tab,
  TextField,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BASE_URL from "Base/api";
import { formatCurrency } from "@/components/utils/formatHelper";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import DeleteConfirmationById from "@/components/UIElements/Modal/DeleteConfirmationById";
import useApi from "@/components/utils/useApi";
import IsAppSettingEnabled from "@/components/utils/IsAppSettingEnabled";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 500, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  maxHeight: '90vh',
  overflowY: 'scroll',
  p: 2,
};


export default function ViewCashInOut({ shift }) {
  const [open, setOpen] = useState(false);
  const [editItemId, setEditItemId] = useState(null);
  const [editedAmount, setEditedAmount] = useState("");
  const [cashIOList, setCashIOList] = useState([]);
  const [tab, setTab] = useState(0);
  const controller = "Shift/DeleteCashInOut";
  const { data: flowList } = useApi("/CashFlowType/GetCashFlowTypes");
  const [flowInfo, setFlowInfo] = useState({});
  const { data: IsCashInOutApprovalMandatory } = IsAppSettingEnabled("IsCashInOutApprovalMandatory");

  useEffect(() => {
    if (flowList) {
      const flowMap = flowList.reduce((acc, flow) => {
        acc[flow.id] = flow;
        return acc;
      }, {});
      setFlowInfo(flowMap);
    }
  }, [flowList]);


  const handleOpen = () => {
    fetchCashInOut();
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleTabChange = (_, newValue) => setTab(newValue);

  const fetchCashInOut = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Shift/GetAllCashInOutByShiftId?shiftId=${shift.id}`;

      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setCashIOList(data.result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchCashInOut();
  }, []);

  const handleEditLines = async (amount, id) => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/Shift/EditCashInOut?id=${id}&amount=${amount}`;

      const response = await fetch(query, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");
      fetchCashInOut();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const renderTables = (type) => {
    const list = cashIOList.filter((i) => i.cashType == type);
    const total = list.reduce((sum, i) => sum + i.amount, 0);
    const showActions = shift.isActive && !IsCashInOutApprovalMandatory;

    return (
      <Grid item xs={12}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Cash Flow Type</TableCell>
                {IsCashInOutApprovalMandatory && (<TableCell>Status</TableCell>)}
                <TableCell>Amount</TableCell>
                {showActions && (<TableCell align="right">Action</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="error">No Data Available</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{flowInfo[item.cashFlowType]?.name || ""}</TableCell>
                    {IsCashInOutApprovalMandatory && (<TableCell>
                      {item.status === 2 ? <span className="successBadge">Approved</span> : (item.status === 3 ? <span className="dangerBadge">Rejected</span> : "Pending")}
                    </TableCell>)}
                    <TableCell>
                      {editItemId === item.id ? (
                        <TextField
                          type="number"
                          value={editedAmount}
                          onChange={(e) => setEditedAmount(e.target.value)}
                          size="small"
                          sx={{ width: '100px' }}
                        />
                      ) : (
                        formatCurrency(item.amount)
                      )}
                    </TableCell>

                    {showActions && (
                      <>
                        <TableCell align="right">
                          <Tooltip title={editItemId === item.id ? "Save" : "Edit"} placement="top">
                            <IconButton
                              onClick={() => {
                                if (editItemId === item.id) {
                                  handleEditLines(editedAmount, item.id);
                                  setEditItemId(null);
                                } else {
                                  setEditItemId(item.id);
                                  setEditedAmount(item.amount);
                                }
                              }}
                              aria-label={editItemId === item.id ? "save" : "edit"}
                              size="small"
                            >
                              {editItemId === item.id ? (
                                <Typography color="primary" fontSize="12px" fontWeight={600}>Save</Typography>
                              ) : (
                                <BorderColorIcon color="primary" fontSize="inherit" />
                              )}
                            </IconButton>
                          </Tooltip>
                          <DeleteConfirmationById id={item.id}
                            controller={controller}
                            fetchItems={fetchCashInOut} />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableHead>
              <TableRow>
                <TableCell colSpan={IsCashInOutApprovalMandatory ? 4 : 3}>Total</TableCell>
                <TableCell colSpan={showActions ? 2 : ""}>{formatCurrency(total)}</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </TableContainer>
      </Grid >
    );
  };

  return (
    <>
      <Tooltip title="Cash In / Out" placement="top">
        <IconButton onClick={handleOpen} aria-label="edit" size="small">
          <SwapHorizIcon color="primary" fontSize="medium" />
        </IconButton>
      </Tooltip>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="h5" fontWeight={500}>
                Cash In / Out Summary
              </Typography>
              <Typography>Shift Code : {shift.documentNo}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Tabs value={tab} onChange={handleTabChange}>
                <Tab label="Cash In" />
                <Tab label="Cash Out" />
              </Tabs>
            </Grid>
            <Grid item xs={12} my={2}>
              {tab === 0 && renderTables(1)}
              {tab === 1 && renderTables(2)}
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
              <Button
                variant="contained"
                color="error"
                onClick={handleClose}
              >
                Close
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </>
  );
}
