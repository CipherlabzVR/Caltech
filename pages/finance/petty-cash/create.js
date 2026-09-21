import React, { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import {
  Button,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/router";
import LoadingButton from "@/components/UIElements/Buttons/LoadingButton";
import { formatDate } from "@/components/utils/formatHelper";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";

const EXPENSE_ACCOUNT_TYPES = [10, 12];

const PettyCashCreate = () => {
  const today = new Date();
  const router = useRouter();
  const { fundId: queryFundId } = router.query;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [funds, setFunds] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [fundId, setFundId] = useState("");
  const [voucherDate, setVoucherDate] = useState(formatDate(today));
  const [paidTo, setPaidTo] = useState("");
  const [description, setDescription] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  const { data: accountList } = useApi("/ChartOfAccount/GetAll");

  const navigateToBack = () => {
    router.push({ pathname: "/finance/petty-cash" });
  };

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${BASE_URL}/PettyCash/GetAllFunds`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch funds");
        const data = await response.json();
        const activeFunds = (data.result || []).filter((f) => f.isActive);
        setFunds(activeFunds);
        if (queryFundId) {
          setFundId(String(queryFundId));
        } else if (activeFunds.length > 0) {
          setFundId(String(activeFunds[0].id));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchFunds();
  }, [queryFundId]);

  useEffect(() => {
    if (accountList) {
      setExpenseAccounts(
        accountList.filter((acc) => EXPENSE_ACCOUNT_TYPES.includes(acc.accountType))
      );
    }
  }, [accountList]);

  const handleSubmit = async () => {
    const validations = [
      { condition: !fundId, message: "Petty Cash fund is required" },
      { condition: !paidTo.trim(), message: "Paid To is required" },
      { condition: !description.trim(), message: "Description is required" },
      { condition: !expenseAccountId, message: "Expense category is required" },
      { condition: !amount || parseFloat(amount) <= 0, message: "Amount must be greater than zero" },
    ];

    for (const v of validations) {
      if (v.condition) {
        toast.error(v.message);
        return;
      }
    }

    const data = {
      PettyCashFundId: Number(fundId),
      VoucherDate: voucherDate,
      PaidTo: paidTo,
      Description: description,
      ExpenseAccountId: Number(expenseAccountId),
      Amount: parseFloat(amount),
      ReceiptNo: receiptNo || null,
    };

    try {
      setIsSubmitting(true);
      const res = await fetch(`${BASE_URL}/PettyCash/CreateVoucher`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json.statusCode === 200) {
        toast.success(json.message || "Voucher created successfully");
        navigateToBack();
      } else {
        toast.error(json.message || "Failed to create voucher");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className={styles.pageTitle}>
        <h1>New Petty Cash Voucher</h1>
        <ul>
          <li>
            <Link href="/finance/petty-cash/">Petty Cash</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}>
        <Grid item xs={12} sx={{ background: "#fff" }}>
          <Grid container p={1} spacing={1}>
            <Grid item xs={12} gap={2} display="flex" justifyContent="end">
              <Button variant="outlined" onClick={navigateToBack}>
                <Typography sx={{ fontWeight: "bold" }}>Go Back</Typography>
              </Button>
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Fund</Typography>
              <Select
                value={fundId}
                onChange={(e) => setFundId(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
              >
                {funds.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active funds
                  </MenuItem>
                ) : (
                  funds.map((fund) => (
                    <MenuItem key={fund.id} value={String(fund.id)}>
                      {fund.fundName}
                    </MenuItem>
                  ))
                )}
              </Select>
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Date</Typography>
              <TextField
                value={voucherDate}
                type="date"
                onChange={(e) => setVoucherDate(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
              />
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Paid To</Typography>
              <TextField
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
              />
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Receipt No</Typography>
              <TextField
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
              />
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Description</Typography>
              <TextField
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
              />
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Expense Category</Typography>
              <Select
                value={expenseAccountId}
                onChange={(e) => setExpenseAccountId(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
              >
                <MenuItem value="" disabled>
                  Select expense account
                </MenuItem>
                {expenseAccounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.description}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid item lg={6} xs={12} display="flex" justifyContent="space-between">
              <Typography>Amount</Typography>
              <TextField
                value={amount}
                type="number"
                onChange={(e) => setAmount(e.target.value)}
                sx={{ width: "60%" }}
                size="small"
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>

            <Grid item xs={12} my={1} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <LoadingButton
                loading={isSubmitting}
                handleSubmit={handleSubmit}
                disabled={isSubmitting}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default PettyCashCreate;
