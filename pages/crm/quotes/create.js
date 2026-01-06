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
import TableFooter from "@mui/material/TableFooter";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import useAccounts from "../../../hooks/useAccounts";
import useContactsByAccount from "../../../hooks/useContactsByAccount";
import useLeads from "../../../hooks/useLeads";
import useQuoteStatuses from "../../../hooks/useQuoteStatuses";
import BASE_URL from "Base/api";
import { toast, ToastContainer } from "react-toastify";
import { Report } from "Base/report";
import { Catelogue } from "Base/catelogue";

const createEmptyLineItem = () => ({
  id: `${Date.now()}-${Math.random()}`,
  description: "",
  qty: "1",
  price: "",
  discountType: "1",
  discountInput: "",
  discount: "",
});

const parseNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const calculateLineAmount = (qty, price) => {
  const quantity = Math.max(parseNumber(qty, 0), 0);
  const unitPrice = Math.max(parseNumber(price, 0), 0);
  return quantity * unitPrice;
};

const calculateDiscount = (amount, discountType, discountInput) => {
  if (!discountInput || discountInput.trim() === "") {
    return 0;
  }
  
  const inputValue = parseNumber(discountInput, 0);
  
  if (discountType === "2") {
    const percentageValue = (amount * inputValue) / 100;
    return Math.min(percentageValue, amount);
  } else {
    return Math.min(inputValue, amount);
  }
};

const clampDiscount = (amount, discount) => {
  const discountValue = Math.max(parseNumber(discount, 0), 0);
  return Math.min(discountValue, amount);
};

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function CreateQuote() {
  const router = useRouter();
  const { accounts } = useAccounts();
  const [accountId, setAccountId] = React.useState("");
  const [contactId, setContactId] = React.useState("");
  const [leadId, setLeadId] = React.useState("");
  const [status, setStatus] = React.useState(0);
  const [validUntil, setValidUntil] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [lineItems, setLineItems] = React.useState([createEmptyLineItem()]);
  const [submitting, setSubmitting] = React.useState(false);
  const { contacts } = useContactsByAccount(accountId);
  const { leads, isLoading: leadsLoading } = useLeads();
  const { statuses: quoteStatuses, isLoading: statusesLoading } = useQuoteStatuses();


  React.useEffect(() => {
    if (!status && quoteStatuses.length > 0) {
      const defaultStatus =
        quoteStatuses.find((item) => item.label.toLowerCase() === "draft") || quoteStatuses[0];
      setStatus(String(defaultStatus.value));
    }
  }, [quoteStatuses, status]);

  const accountOptions = React.useMemo(
    () => accounts.map((account) => ({ value: String(account.id), label: account.name })),
    [accounts]
  );

  const contactOptions = React.useMemo(() => {
    const baseOptions = contacts.map((contact) => ({
      value: String(contact.id),
      label:
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
        contact.email ||
        `Contact #${contact.id}`,
    }));

    if (contactId && !baseOptions.some((contact) => contact.value === contactId)) {
      return [
        {
          value: contactId,
          label: baseOptions.find((contact) => contact.value === contactId)?.label || `Contact #${contactId}`,
        },
        ...baseOptions,
      ];
    }

    return baseOptions;
  }, [contacts, contactId]);

  const totals = React.useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        const amount = calculateLineAmount(item.qty, item.price);
        const discountValue = calculateDiscount(amount, item.discountType, item.discountInput);
        acc.subTotal += amount;
        acc.discountTotal += discountValue;
        acc.total += amount - discountValue;
        return acc;
      },
      { subTotal: 0, discountTotal: 0, total: 0 }
    );
  }, [lineItems]);

  const handleLeadChange = (event) => {
    const value = event.target.value;
    setLeadId(value);

    const selectedLead = leads.find(
      (lead) => lead.id && String(lead.id) === String(value)
    );

    if (selectedLead?.meta) {
      const leadData = selectedLead.meta;
      const leadAccountId = leadData.accountId ?? null;
      const leadContactId = leadData.contactId ?? null;
      
      if (leadAccountId != null) {
        setAccountId(String(leadAccountId));
      } else {
        setAccountId("");
      }
      
      if (leadContactId != null) {
        setContactId(String(leadContactId));
      } else {
        setContactId("");
      }
    } else {
      setAccountId("");
      setContactId("");
    }
  };

  const handleLineItemChange = (index, field) => (event) => {
    const value = event.target.value;
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleRemoveLineItem = (index) => {
    setLineItems((prev) => {
      if (prev.length === 1) {
        toast.warn("A quote must contain at least one line item.");
        return prev;
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleAddLineItem = () => {
    setLineItems((prev) => [...prev, createEmptyLineItem()]);
  };

  const validateForm = () => {
    if (!leadId) {
      toast.error("Lead selection required");
      return false;
    }

    const selectedLead = leads.find((lead) => lead.id && String(lead.id) === String(leadId));
    const leadAccountId = selectedLead?.meta?.accountId ?? null;
    const leadContactId = selectedLead?.meta?.contactId ?? null;

    if (!leadAccountId || !Number(leadAccountId)) {
      toast.error("Selected lead must have a valid account.");
      return false;
    }

    if (!leadContactId || !Number(leadContactId)) {
      toast.error("Selected lead must have a valid contact.");
      return false;
    }

    if (!status) {
      toast.error("Quote status is required.");
      return false;
    }

    if (!validUntil) {
      toast.error("Valid date required");
      return false;
    }

    if (lineItems.length === 0) {
      toast.error("At least one line item required");
      return false;
    }

    const hasEmptyDescription = lineItems.some((item) => {
      return !item.description || item.description.trim() === "";
    });

    if (hasEmptyDescription) {
      toast.error("Line item description is required");
      return false;
    }

    const hasEmptyPrice = lineItems.some((item) => {
      const price = parseNumber(item.price, 0);
      return !item.price || item.price.trim() === "" || price <= 0;
    });

    if (hasEmptyPrice) {
      toast.error("Line items unit price is required");
      return false;
    }

    const preparedLineItems = lineItems.map((item) => {
      const qty = parseNumber(item.qty, 0);
      const price = parseNumber(item.price, 0);
      const amount = calculateLineAmount(item.qty, item.price);
      const discountValue = calculateDiscount(amount, item.discountType, item.discountInput);

      return {
        qty,
        price,
        discount: discountValue,
        amount,
        lineTotal: amount - discountValue,
        hasContent: Boolean((item.description || "").trim()) || amount > 0,
      };
    });

    const validItems = preparedLineItems.filter((item) => item.qty > 0 && item.price > 0 && item.hasContent);

    if (validItems.length === 0) {
      toast.error("At least one line item required");
      return false;
    }

    if (validItems.some((item) => item.lineTotal < 0)) {
      toast.error("Line totals cannot be negative.");
      return false;
    }

    return true;
  };

  const buildLineItemsPayload = () => {
    return lineItems
      .map((item) => {
        const amount = calculateLineAmount(item.qty, item.price);
        const discountValue = calculateDiscount(amount, item.discountType, item.discountInput);
        const lineTotal = amount - discountValue;
        const qty = parseNumber(item.qty, 0);
        const price = parseNumber(item.price, 0);

        if (!(qty > 0) || price < 0 || (!amount && !(item.description || "").trim())) {
          return null;
        }

        return {
          Description: (item.description || "").trim() || null,
          Qty: qty,
          Price: price,
          Discount: discountValue,
          LineTotal: lineTotal,
          DiscountInput: item.discountInput && item.discountInput.trim() !== "" ? parseNumber(item.discountInput, 0) : 0,
          DiscountType: parseInt(item.discountType)
        };
      })
      .filter(Boolean);
  };

  const generateReportLink = (quoteId, quoteNumber) => {
    if (typeof window === "undefined") return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/crm/customer/quote?id=${quoteId}&documentNumber=${quoteNumber}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const selectedLead = leads.find((lead) => lead.id && String(lead.id) === String(leadId));
    const leadAccountId = selectedLead?.meta?.accountId ?? null;
    const leadContactId = selectedLead?.meta?.contactId ?? null;

    const payload = {
      AccountId: leadAccountId ? Number(leadAccountId) : null,
      ContactId: leadContactId ? Number(leadContactId) : null,
      LeadId: leadId ? Number(leadId) : 0,
      ValidUntil: validUntil ? new Date(validUntil).toISOString() : null,
      Description: description.trim() || null,
      Status: Number(status),
      LineItems: buildLineItemsPayload(),
    };

    try {
      setSubmitting(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      const response = await fetch(`${BASE_URL}/CRMQuotes/CreateCRMQuote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to create quote");
      }

      if (data?.result?.id && data?.result?.quoteNumber) {
        const reportLink = generateReportLink(data.result.id, data.result.quoteNumber);
        
        const updatePayload = {
          Id: data.result.id,
          ReportLink: reportLink,
        };

        await fetch(`${BASE_URL}/CRMQuotes/UpdateCRMQuote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(updatePayload),
        });
      }

      toast.success(data?.message || "Quote created successfully.");
      router.push("/crm/quotes");
    } catch (error) {
      toast.error(error.message || "Unable to create quote");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <ToastContainer/>
      <div className={styles.pageTitle}>
        <h1>Create Quote</h1>
        <ul>
          <li>
            <Link href="/crm/quotes/">Quotes</Link>
          </li>
          <li>Create</li>
        </ul>
      </div>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={600}>
                Quote Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Lead</InputLabel>
                <Select
                  value={leadId}
                  label="Lead"
                  onChange={handleLeadChange}
                  disabled={leadsLoading}
                >
                  {leads.map((lead) => (
                    <MenuItem key={lead.id} value={String(lead.id)}>
                      {lead.name} - {lead.company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Valid Until"
                type="date"
                fullWidth
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                value={validUntil}
                onChange={(event) => setValidUntil(event.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  label="Status"
                  onChange={(event) => setStatus(event.target.value)}
                  disabled
                  //disabled={statusesLoading || quoteStatuses.length === 0}
                >
                  {quoteStatuses.map((option) => (
                    <MenuItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={3}
                size="small"
                placeholder="Add any additional details about this quote..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mt={1} mb={1}>
                <Typography variant="h6" fontWeight={600}>
                  Quote Items
                </Typography>
                <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddLineItem}>
                  Add Item
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="quote items table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" width="20" sx={{ px: 1 }}></TableCell>
                      <TableCell sx={{ px: 1 }}>Description</TableCell>
                      <TableCell width="120" sx={{ px: 1 }}>Quantity</TableCell>
                      <TableCell width="150" sx={{ px: 1 }}>Unit Price</TableCell>
                      <TableCell width="120" sx={{ px: 1 }}>Discount Type</TableCell>
                      <TableCell width="120" sx={{ px: 1 }}>Discount Input</TableCell>
                      <TableCell width="150" sx={{ px: 1 }}>Discount</TableCell>
                      <TableCell width="150" align="right" sx={{ px: 1 }}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((item, index) => {
                      const amount = calculateLineAmount(item.qty, item.price);
                      const discountValue = calculateDiscount(amount, item.discountType, item.discountInput);
                      const lineTotal = amount - discountValue;

                      return (
                        <TableRow key={item.id}>
                          <TableCell align="center" sx={{ px: 1 }}>
                            <Tooltip title="Remove line item">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveLineItem(index)}
                                  disabled={lineItems.length === 1}
                                >
                                  <DeleteOutlineIcon fontSize="inherit" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ px: 1 }}>
                            <TextField
                              placeholder="Line item description"
                              size="small"
                              fullWidth
                              value={item.description}
                              onChange={handleLineItemChange(index, "description")}
                            />
                          </TableCell>
                          <TableCell sx={{ px: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Qty"
                              fullWidth
                              inputProps={{ min: 0, step: "any" }}
                              value={item.qty}
                              onChange={handleLineItemChange(index, "qty")}
                            />
                          </TableCell>
                          <TableCell sx={{ px: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="Unit Price"
                              fullWidth
                              inputProps={{ min: 0, step: "any" }}
                              value={item.price}
                              onChange={handleLineItemChange(index, "price")}
                            />
                          </TableCell>
                          <TableCell sx={{ px: 1 }}>
                            <FormControl fullWidth size="small">
                              <Select
                                value={item.discountType}
                                onChange={handleLineItemChange(index, "discountType")}
                                size="small"
                              >
                                <MenuItem value="1">Value</MenuItem>
                                <MenuItem value="2">%</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell sx={{ px: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              placeholder={item.discountType === "2" ? "Percentage" : "Value"}
                              fullWidth
                              inputProps={{ min: 0, step: "any" }}
                              value={item.discountInput}
                              onChange={handleLineItemChange(index, "discountInput")}
                            />
                          </TableCell>
                          <TableCell sx={{ px: 1 }}>
                            {formatCurrency(discountValue)}
                          </TableCell>
                          <TableCell align="right" sx={{ px: 1 }}>{formatCurrency(lineTotal)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell sx={{ px: 1 }}></TableCell>
                      <TableCell colSpan={6} align="right" sx={{ px: 1 }}>
                        <Typography fontWeight={600}>Subtotal</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ px: 1 }}>
                        <Typography fontWeight={600}>{formatCurrency(totals.subTotal)}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ px: 1 }}></TableCell>
                      <TableCell colSpan={6} align="right" sx={{ px: 1 }}>
                        <Typography fontWeight={600}>Discount</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ px: 1 }}>
                        <Typography fontWeight={600}>{formatCurrency(totals.discountTotal)}</Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ px: 1 }}></TableCell>
                      <TableCell colSpan={6} align="right" sx={{ px: 1 }}>
                        <Typography fontWeight={600}>Total</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ px: 1 }}>
                        <Typography fontWeight={600}>{formatCurrency(totals.total)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
                <Button component={Link} href="/crm/quotes/" variant="outlined" color="inherit" disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </>
  );
}

