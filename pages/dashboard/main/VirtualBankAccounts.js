import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import BASE_URL from "Base/api";
import { formatCurrency, formatDateWithTime } from "@/components/utils/formatHelper";

const headerCellSx = {
  borderBottom: "1px solid #F7FAFF",
  fontSize: "13.5px",
  padding: "15px 10px",
  fontWeight: 600,
  backgroundColor: (theme) =>
    theme.palette.mode === "dark" ? theme.palette.background.paper : "#F7FAFF",
  zIndex: 3,
};

const VirtualBankAccounts = ({ virtualBanks = [] }) => {
  const [selectedBankId, setSelectedBankId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (virtualBanks.length > 0 && !selectedBankId) {
      setSelectedBankId(String(virtualBanks[0].bankId));
    }
  }, [virtualBanks, selectedBankId]);

  useEffect(() => {
    if (!selectedBankId) {
      setTransactions([]);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const query = `${BASE_URL}/BankHistory/GetAllBankRecords?SkipCount=0&MaxResultCount=10&Search=null&bankId=${selectedBankId}`;
        const response = await fetch(query, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();
        setTransactions(data.result?.items || []);
      } catch (error) {
        console.error("Error fetching bank history:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedBankId]);

  const selectedBank = virtualBanks.find(
    (bank) => String(bank.bankId) === String(selectedBankId)
  );

  if (virtualBanks.length === 0) {
    return null;
  }

  return (
    <Card
      sx={{
        boxShadow: "none",
        borderRadius: "10px",
        p: "25px 20px 15px",
        mb: "15px",
      }}
    >
      <Box
        sx={{
          paddingBottom: "10px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography as="h3" sx={{ fontSize: 18, fontWeight: 500 }}>
          Virtual Safe Accounts
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            flex: 1,
            justifyContent: "flex-end",
            minWidth: 280,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <Select
              value={selectedBankId}
              displayEmpty
              onChange={(e) => setSelectedBankId(e.target.value)}
            >
              {virtualBanks.map((bank) => (
                <MenuItem key={bank.bankId} value={String(bank.bankId)}>
                  {bank.bankName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 3,
          mb: 2,
          p: 1.5,
          borderRadius: "8px",
          backgroundColor: "#F7FAFF",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Selected account
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#260944" }}>
            {selectedBank?.bankName || "-"}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Current balance
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#260944" }}>
            Rs. {formatCurrency(selectedBank?.remainingBalance ?? 0)}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            Last 10 transactions
          </Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 600, color: "#260944" }}>
            {transactions.length}
          </Typography>
        </Box>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          boxShadow: "none",
          maxHeight: "50vh",
          overflowY: "auto",
          height: "auto",
        }}
      >
        <Table
          stickyHeader
          sx={{ minWidth: 600 }}
          aria-label="virtual bank transactions"
          className="dark-table"
        >
          <TableHead>
            <TableRow>
              <TableCell sx={headerCellSx}>Code</TableCell>
              <TableCell sx={headerCellSx}>Date</TableCell>
              <TableCell sx={headerCellSx}>Category</TableCell>
              <TableCell sx={headerCellSx}>Deposit</TableCell>
              <TableCell sx={headerCellSx}>Withdrawal</TableCell>
              <TableCell sx={headerCellSx}>Balance</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 3, color: "#666" }}>
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: "center", py: 3, color: "#666" }}>
                  No bank history transactions available.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((row, index) => (
                <TableRow key={row.id ?? index}>
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      padding: "9px 10px",
                    }}
                  >
                    {row.documentNo}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      padding: "9px 10px",
                    }}
                  >
                    {formatDateWithTime(row.createdOn)}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      padding: "9px 10px",
                    }}
                  >
                    {row.cashFlowTypeName || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      padding: "9px 10px",
                    }}
                  >
                    {formatCurrency(row.transactionType === 1 ? row.amount : "")}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      padding: "9px 10px",
                    }}
                  >
                    {formatCurrency(row.transactionType === 2 ? row.amount : "")}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 500,
                      fontSize: "13px",
                      borderBottom: "1px solid #F7FAFF",
                      padding: "9px 10px",
                    }}
                  >
                    {formatCurrency(row.remainingBalance)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default VirtualBankAccounts;
