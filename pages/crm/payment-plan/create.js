import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/PageTitle.module.css";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Checkbox from "@mui/material/Checkbox";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const createEmptyInvoiceLine = () => ({
  id: `${Date.now()}-${Math.random()}`,
  description: "",
  paymentDate: "",
  amount: "",
  paymentType: "",
  isPaid: false,
  isInitialPayment: false,
});

export default function CreateInvoice() {
  const router = useRouter();
  const [quoteId, setQuoteId] = React.useState("");
  const [status] = React.useState(1); // Always Pending for new invoices
  const [amount, setAmount] = React.useState("");
  const [discount, setDiscount] = React.useState("");
  const [paymentPlanType, setPaymentPlanType] = React.useState(2);
  const [initialPayment, setInitialPayment] = React.useState("");
  const [initialPaymentDueDate, setInitialPaymentDueDate] = React.useState("");
  const [invoiceLines, setInvoiceLines] = React.useState([createEmptyInvoiceLine()]);
  const [quotes, setQuotes] = React.useState([]);
  const [loadingQuotes, setLoadingQuotes] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedQuote, setSelectedQuote] = React.useState(null);

  React.useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoadingQuotes(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/CRMQuotes/GetCRMQuotesWithoutInvoice`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch quotes");
        }

        const data = await response.json();
        const quotesList = Array.isArray(data) ? data : data?.result || [];
        setQuotes(quotesList);
      } catch (error) {
        console.error("Error fetching quotes:", error);
        toast.error("Failed to load quotes");
      } finally {
        setLoadingQuotes(false);
      }
    };

    fetchQuotes();
  }, []);

  React.useEffect(() => {
    if (selectedQuote) {
      setInvoiceLines([createEmptyInvoiceLine()]);
    }
  }, [selectedQuote]);

  // Helper function to calculate remaining balance and update payment lines
  const calculateRemainingBalance = (lines, subtotal) => {
    const initialPaymentValue = parseNumber(initialPayment, 0);
    if (initialPaymentValue <= 0 || !subtotal) return lines;

    // Filter out empty lines (lines with no description and no amount) except initial payment
    const validLines = lines.filter((line) => {
      if (line.isInitialPayment) return true; // Always keep initial payment
      if (line.isAutoBalance) return false; // Remove old auto-balance lines
      const hasDescription = (line.description || "").trim() !== "";
      const hasAmount = parseNumber(line.amount, 0) > 0;
      return hasDescription || hasAmount; // Keep lines with either description or amount
    });

    // Calculate total of all non-auto-calculated lines (excluding auto-balance lines)
    const nonAutoLines = validLines.filter((line) => !line.isAutoBalance);
    const totalPaid = nonAutoLines.reduce((sum, line) => {
      return sum + parseNumber(line.amount, 0);
    }, 0);

    const remainingBalance = subtotal - totalPaid;

    // Find or create the auto-balance line
    const autoBalanceIndex = validLines.findIndex((line) => line.isAutoBalance);
    
    if (remainingBalance > 0.01) {
      // Determine payment number
      const paymentNumber = nonAutoLines.length;
      const paymentLabel = paymentNumber === 1 
        ? "Second Payment" 
        : paymentNumber === 2 
        ? "Third Payment" 
        : `Payment ${paymentNumber + 1}`;

      const autoBalanceLine = {
        id: autoBalanceIndex >= 0 ? validLines[autoBalanceIndex].id : `auto-balance-${Date.now()}`,
        description: paymentLabel,
        paymentDate: "",
        amount: String(remainingBalance.toFixed(2)),
        paymentType: "",
        isPaid: false,
        isInitialPayment: false,
        isAutoBalance: true,
      };

      if (autoBalanceIndex >= 0) {
        // Update existing auto-balance line
        const updated = [...validLines];
        updated[autoBalanceIndex] = autoBalanceLine;
        return updated;
      } else {
        // Add new auto-balance line
        return [...validLines, autoBalanceLine];
      }
    } else {
      // Remove auto-balance line if remaining balance is 0 or negative
      if (autoBalanceIndex >= 0) {
        return validLines.filter((_, index) => index !== autoBalanceIndex);
      }
      return validLines;
    }
  };

  // Auto-add/update Initial Payment line when initial payment is entered
  React.useEffect(() => {
    const initialPaymentValue = parseNumber(initialPayment, 0);
    const subtotal = parseNumber(selectedQuote?.total || 0, 0);
    
    if (initialPaymentValue > 0) {
      setInvoiceLines((prev) => {
        // Check if initial payment line already exists
        const existingInitialPaymentIndex = prev.findIndex((line) => line.isInitialPayment);
        let updated;
        
        if (existingInitialPaymentIndex >= 0) {
          // Update existing initial payment line
          // Remove empty lines (lines with no description and no amount) and auto-balance lines
          const nonEmptyLines = prev.filter((line) => {
            if (line.isInitialPayment) return true; // Always keep initial payment line
            const hasDescription = (line.description || "").trim() !== "";
            const hasAmount = parseNumber(line.amount, 0) > 0;
            return (hasDescription || hasAmount) && !line.isAutoBalance;
          });
          
          // Find the initial payment index in the filtered array
          const newInitialPaymentIndex = nonEmptyLines.findIndex((line) => line.isInitialPayment);
          
          updated = nonEmptyLines.map((line, index) => {
            if (index === newInitialPaymentIndex) {
              return {
                ...line,
                description: "Initial Payment",
                amount: String(initialPaymentValue),
                paymentDate: initialPaymentDueDate || "",
                isInitialPayment: true,
              };
            }
            return line;
          });
        } else {
          // Add new initial payment line
          // Remove empty lines (lines with no description and no amount) and auto-balance lines
          const nonEmptyLines = prev.filter((line) => {
            const hasDescription = (line.description || "").trim() !== "";
            const hasAmount = parseNumber(line.amount, 0) > 0;
            return (hasDescription || hasAmount) && !line.isAutoBalance;
          });
          
          updated = [
            {
              id: `initial-payment-${Date.now()}`,
              description: "Initial Payment",
              paymentDate: initialPaymentDueDate || "",
              amount: String(initialPaymentValue),
              paymentType: "",
              isPaid: false,
              isInitialPayment: true,
            },
            ...nonEmptyLines,
          ];
        }

        // Calculate and add remaining balance line
        return calculateRemainingBalance(updated, subtotal);
      });
    } else {
      // Remove initial payment line and auto-balance lines if amount is 0 or empty
      setInvoiceLines((prev) => prev.filter((line) => !line.isInitialPayment && !line.isAutoBalance));
    }
  }, [initialPayment, initialPaymentDueDate, selectedQuote]);

  const handleQuoteChange = (event) => {
    const value = event.target.value;
    setQuoteId(value);
    const quote = quotes.find((q) => String(q.id) === String(value));
    setSelectedQuote(quote);
  };

  const handleInvoiceLineChange = (index, field) => (event) => {
    const value = field === "isPaid" ? event.target.checked : event.target.value;
    const subtotal = parseNumber(selectedQuote?.total || 0, 0);
    
    setInvoiceLines((prev) => {
      const updated = [...prev];
      const lineToUpdate = updated[index];
      
      // If this is an auto-balance line and user is trying to edit it, convert it to a regular line
      if (lineToUpdate.isAutoBalance && (field === "amount" || field === "description")) {
        updated[index] = {
          ...lineToUpdate,
          [field]: value,
          isAutoBalance: false, // Convert to regular line
        };
      } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      }

      // Recalculate remaining balance after amount changes (except for initial payment)
      if (field === "amount" && !lineToUpdate.isInitialPayment) {
        return calculateRemainingBalance(updated, subtotal);
      }
      
      return updated;
    });
  };

  const handleRemoveInvoiceLine = (index) => {
    const subtotal = parseNumber(selectedQuote?.total || 0, 0);
    
    setInvoiceLines((prev) => {
      const lineToRemove = prev[index];
      // Prevent deletion of initial payment line if it has an amount
      if (lineToRemove?.isInitialPayment && parseNumber(lineToRemove.amount, 0) > 0) {
        toast.warn("Cannot delete Initial Payment line. Clear the initial payment amount first.");
        return prev;
      }
      if (prev.length === 1) {
        toast.warn("At least one line is required.");
        return prev;
      }
      
      // Remove the line
      const updated = prev.filter((_, itemIndex) => itemIndex !== index);
      
      // Recalculate remaining balance if initial payment exists
      const initialPaymentValue = parseNumber(initialPayment, 0);
      if (initialPaymentValue > 0 && subtotal > 0) {
        return calculateRemainingBalance(updated, subtotal);
      }
      
      return updated;
    });
  };

  const handleAddInvoiceLine = () => {
    const subtotal = parseNumber(selectedQuote?.total || 0, 0);
    const initialPaymentValue = parseNumber(initialPayment, 0);
    
    setInvoiceLines((prev) => {
      // Remove existing auto-balance line before adding new line
      const withoutAutoBalance = prev.filter((line) => !line.isAutoBalance);
      const updated = [...withoutAutoBalance, createEmptyInvoiceLine()];
      
      // Recalculate remaining balance if initial payment exists
      if (initialPaymentValue > 0 && subtotal > 0) {
        return calculateRemainingBalance(updated, subtotal);
      }
      
      return updated;
    });
  };

  const validateForm = () => {
    if (!quoteId) {
      toast.error("Please select a quote.");
      return false;
    }


    const amountValue = parseNumber(amount, 0);
    if (amountValue < 0) {
      toast.error("Amount cannot be negative.");
      return false;
    }

    const discountValue = parseNumber(discount, 0);
    if (discountValue < 0) {
      toast.error("Discount cannot be negative.");
      return false;
    }

    if (!paymentPlanType) {
      toast.error("Payment plan type is required.");
      return false;
    }

    if (!initialPayment || initialPayment.trim() === "") {
      toast.error("Initial Payment is required.");
      return false;
    }

    const initialPaymentValue = parseNumber(initialPayment, 0);
    if (initialPaymentValue <= 0) {
      toast.error("Initial payment must be greater than 0.");
      return false;
    }

    if (!initialPaymentDueDate) {
      toast.error("Initial Payment Due Date is required.");
      return false;
    }

    for (let i = 0; i < invoiceLines.length; i++) {
      const line = invoiceLines[i];
      const lineAmount = parseNumber(line.amount, 0);
      const description = (line.description || "").trim();
      
      // If isPaid is checked, all fields are required
      if (line.isPaid) {
        if (!description) {
          toast.error(`Line ${i + 1}: Description is required when "Is Paid" is checked.`);
          return false;
        }
        if (lineAmount <= 0) {
          toast.error(`Line ${i + 1}: Amount is required and must be greater than 0 when "Is Paid" is checked.`);
          return false;
        }
        if (!line.paymentDate) {
          toast.error(`Line ${i + 1}: Payment Date is required when "Is Paid" is checked.`);
          return false;
        }
        if (!line.paymentType) {
          toast.error(`Line ${i + 1}: Payment Type is required when "Is Paid" is checked.`);
          return false;
        }
      } else {
        // If isPaid is not checked, only description and amount are required
        if (!description) {
          toast.error(`Line ${i + 1}: Description is required.`);
          return false;
        }
        if (lineAmount <= 0) {
          toast.error(`Line ${i + 1}: Amount is required and must be greater than 0.`);
          return false;
        }
      }
    }

    const validLines = invoiceLines.filter((line) => {
      const lineAmount = parseNumber(line.amount, 0);
      const description = (line.description || "").trim();
      return lineAmount > 0 && description;
    });

    if (validLines.length === 0) {
      toast.error("Please add at least one valid line.");
      return false;
    }

    const invoiceLinesTotal = invoiceLines.reduce((sum, line) => {
      return sum + parseNumber(line.amount, 0);
    }, 0);

    const quoteSubTotal = parseNumber(selectedQuote?.total || 0, 0);
    if (Math.abs(invoiceLinesTotal - quoteSubTotal) > 0.01) {
      toast.error(`Line total (${formatCurrency(invoiceLinesTotal)}) must equal quote subtotal (${formatCurrency(quoteSubTotal)}).`);
      return false;
    }

    return true;
  };

  const buildInvoiceLinesPayload = () => {
    return invoiceLines
      .map((line) => {
        const lineAmount = parseNumber(line.amount, 0);
        if (lineAmount <= 0 && !(line.description || "").trim()) {
          return null;
        }

        return {
          Description: (line.description || "").trim() || null,
          PaymentDate: line.paymentDate ? new Date(line.paymentDate).toISOString() : null,
          Amount: lineAmount,
          PaymentType: line.paymentType ? Number(line.paymentType) : null,
          IsPaid: Boolean(line.isPaid),
        };
      })
      .filter(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      QuoteId: Number(quoteId),
      Status: Number(status),
      Amount: parseNumber(selectedQuote?.total || 0, 0),
      Discount: parseNumber(selectedQuote?.discount || 0, 0),
      PaymentPlanType: Number(paymentPlanType),
      InitialPayment: parseNumber(initialPayment, 0),
      InitialPaymentDueDate: initialPaymentDueDate ? new Date(initialPaymentDueDate).toISOString() : null,
      InvoiceLines: buildInvoiceLinesPayload(),
    };

    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const response = await fetch(`${BASE_URL}/CRMInvoice/CreateCRMInvoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create invoice");
      }

      toast.success(data?.message || "Payment Plan created successfully.");
      router.push("/crm/payment-plan");
    } catch (error) {
      toast.error(error.message || "Unable to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Create Payment Plan</h1>
        <ul>
          <li>
            <Link href="/crm/payment-plan/">Payment Plan</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600}>
                Payment Plan Details
              </Typography>
            </Grid>

            <Grid item xs={12} lg={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quote *</InputLabel>
                    <Select
                      value={quoteId}
                      label="Quote *"
                      onChange={handleQuoteChange}
                      disabled={loadingQuotes}
                    >
                  {quotes.map((quote) => (
                    <MenuItem key={quote.id} value={String(quote.id)}>
                      {quote.quoteNumber || `Quote #${quote.id}`} - {quote.companyName || "-"}
                    </MenuItem>
                  ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Payment Plan Type *</InputLabel>
                    <Select
                      value={paymentPlanType}
                      label="Payment Plan Type *"
                      onChange={(e) => setPaymentPlanType(Number(e.target.value))}
                    >
                      <MenuItem value={2}>Partial Payments</MenuItem>
                      <MenuItem value={3}>Full Payment</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Initial Payment "
                    type="number"
                    fullWidth
                    size="small"
                    required
                    inputProps={{ min: 0, step: "any" }}
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    error={!initialPayment || parseNumber(initialPayment, 0) <= 0}
                    helperText={!initialPayment ? "Required" : parseNumber(initialPayment, 0) <= 0 ? "Must be greater than 0" : ""}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Initial Payment Due Date"
                    type="date"
                    fullWidth
                    size="small"
                    required
                    InputLabelProps={{ shrink: true }}
                    value={initialPaymentDueDate}
                    onChange={(e) => setInitialPaymentDueDate(e.target.value)}
                    error={parseNumber(initialPayment, 0) > 0 && !initialPaymentDueDate}
                    helperText={parseNumber(initialPayment, 0) > 0 && !initialPaymentDueDate ? "Required when Initial Payment is entered" : ""}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">
                      Sub Total:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatCurrency(selectedQuote?.subTotal || 0)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" color="text.secondary">
                      Discount:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: "error.main" }}>
                      - {formatCurrency(selectedQuote?.discount || 0)}
                    </Typography>
                  </Box>
                  <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1, mt: 0.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Total:
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                        {formatCurrency(selectedQuote?.total || 0)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} mb={1}>
                <Typography variant="h6" fontWeight={600}>
                  Payment Plan Lines
                </Typography>
                <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddInvoiceLine}>
                  Add Line
                </Button>
              </Box>
              {(() => {
                const invoiceLinesTotal = invoiceLines.reduce((sum, line) => sum + parseNumber(line.amount, 0), 0);
                const quoteSubTotal = parseNumber(selectedQuote?.total || 0, 0);
                const difference = invoiceLinesTotal - quoteSubTotal;
                if (Math.abs(difference) > 0.01) {
                  return (
                    <Box mb={1}>
                      <Typography variant="body2" sx={{ color: "error.main", fontWeight: 600 }}>
                        {difference > 0 
                          ? `Lines total exceeds quote subtotal by ${formatCurrency(difference)}`
                          : `Lines total is ${formatCurrency(Math.abs(difference))} less than quote subtotal`}
                      </Typography>
                    </Box>
                  );
                }
                return null;
              })()}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="invoice lines table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell width="150">Payment Date</TableCell>
                      <TableCell width="150">Amount</TableCell>
                      <TableCell width="150">Payment Type</TableCell>
                      <TableCell align="center" width="100">Is Paid</TableCell>
                      <TableCell align="center" width="80">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoiceLines.map((line, index) => {
                      const isInitialPaymentLine = line.isInitialPayment && parseNumber(line.amount, 0) > 0;
                      const isAutoBalanceLine = line.isAutoBalance;
                      const isPaid = line.isPaid;
                      const descriptionError = isPaid && !(line.description || "").trim();
                      const amountError = isPaid && parseNumber(line.amount, 0) <= 0;
                      const paymentDateError = isPaid && !line.paymentDate;
                      const paymentTypeError = isPaid && !line.paymentType;
                      
                      return (
                        <TableRow 
                          key={line.id}
                          sx={isAutoBalanceLine ? { bgcolor: "action.hover" } : {}}
                        >
                          <TableCell>
                            <TextField
                              placeholder="Line description *"
                              size="small"
                              fullWidth
                              required
                              value={line.description}
                              onChange={handleInvoiceLineChange(index, "description")}
                              disabled={isInitialPaymentLine}
                              error={descriptionError}
                              helperText={descriptionError ? "Required" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              size="small"
                              fullWidth
                              required={isPaid}
                              InputLabelProps={{ shrink: true }}
                              value={line.paymentDate}
                              onChange={handleInvoiceLineChange(index, "paymentDate")}
                              error={paymentDateError}
                              helperText={paymentDateError ? "Required" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Amount *"
                              fullWidth
                              required
                              inputProps={{ min: 0, step: "any" }}
                              value={line.amount}
                              onChange={handleInvoiceLineChange(index, "amount")}
                              disabled={isInitialPaymentLine}
                              error={amountError}
                              helperText={amountError ? "Required and must be > 0 when Is Paid is checked" : ""}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small" required={isPaid} error={paymentTypeError}>
                              <Select
                                value={line.paymentType || ""}
                                onChange={handleInvoiceLineChange(index, "paymentType")}
                                displayEmpty
                              >
                                <MenuItem value="">None</MenuItem>
                                <MenuItem value={1}>Cash</MenuItem>
                                <MenuItem value={2}>Card</MenuItem>
                                <MenuItem value={4}>Bank Transfer</MenuItem>
                                <MenuItem value={5}>Cheque</MenuItem>
                                <MenuItem value={7}>Credit</MenuItem>
                              </Select>
                              {paymentTypeError && (
                                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                                  Required
                                </Typography>
                              )}
                            </FormControl>
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={line.isPaid}
                              onChange={handleInvoiceLineChange(index, "isPaid")}
                            />
                          </TableCell>
                        <TableCell align="center">
                          <Tooltip 
                            title={
                              isInitialPaymentLine 
                                ? "Cannot delete Initial Payment line" 
                                : isAutoBalanceLine
                                ? "Remove auto-calculated line"
                                : "Remove line"
                            }
                          >
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveInvoiceLine(index)}
                                disabled={invoiceLines.length === 1 || isInitialPaymentLine}
                              >
                                <DeleteOutlineIcon fontSize="inherit" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box mt={2} display="flex" justifyContent="flex-end">
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Total: {formatCurrency(invoiceLines.reduce((sum, line) => sum + parseNumber(line.amount, 0), 0))}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button component={Link} href="/crm/payment-plan/" variant="outlined" color="inherit" disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Grid>

            {selectedQuote && selectedQuote.lineItems && selectedQuote.lineItems.length > 0 && (
              <Grid item xs={12} lg={8}>
                <Box mt={3} mb={2}>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    Quote Line Items
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small" aria-label="quote line items table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Description</TableCell>
                          <TableCell align="right" width="120">Quantity</TableCell>
                          <TableCell align="right" width="150">Price</TableCell>
                          <TableCell align="right" width="120">Discount</TableCell>
                          <TableCell align="right" width="150">Line Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedQuote.lineItems.map((item, index) => (
                          <TableRow key={item.id || index}>
                            <TableCell>{item.description || "-"}</TableCell>
                            <TableCell align="right">{item.qty || 0}</TableCell>
                            <TableCell align="right">{formatCurrency(item.price || 0)}</TableCell>
                            <TableCell align="right">
                              {item.discountType === 2 ? (
                                <>{formatCurrency(item.discount || 0)}</>
                              ) : (
                                <>{item.discount || 0}%</>
                              )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.lineTotal || 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>
                            Sub Total:
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            {formatCurrency(selectedQuote.subTotal || 0)}
                          </TableCell>
                        </TableRow>
                        {selectedQuote.discount > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                              Discount:
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: "error.main" }}>
                              - {formatCurrency(selectedQuote.discount || 0)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
                            Total:
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: "1.1rem", color: "primary.main" }}>
                            {formatCurrency(selectedQuote.total || 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Grid>
            )}

            
          </Grid>
        </Box>
      </Paper>
    </>
  );
}

