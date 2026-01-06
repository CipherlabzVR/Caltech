import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "Base/api";
import useApi from "@/components/utils/useApi";
import { formatDate } from "@/components/utils/formatHelper";

const defaultPriorityPalette = {
  1: { label: "Low", color: "#1976D2" },
  2: { label: "Medium", color: "#F57C00" },
  3: { label: "High", color: "#D32F2F" },
  4: { label: "Critical", color: "#C62828" },
};

const CustomerHelpDeskPortal = () => {
  const { data: categoriesData } = useApi("/HelpDesk/GetActiveCategories");
  const { data: prioritySettingsData } = useApi("/HelpDesk/GetPrioritySettings");

  const categories = Array.isArray(categoriesData?.result)
    ? categoriesData.result
    : Array.isArray(categoriesData)
      ? categoriesData
      : [];

  const prioritySettings = Array.isArray(prioritySettingsData?.result)
    ? prioritySettingsData.result
    : Array.isArray(prioritySettingsData)
      ? prioritySettingsData
      : [];

  const priorityPalette = useMemo(() => {
    const map = { ...defaultPriorityPalette };
    prioritySettings.forEach((setting) => {
      const baseColorRaw = setting.colorHex || map[setting.priority]?.color || "#2563EB";
      const baseColor = baseColorRaw.startsWith("#") ? baseColorRaw : `#${baseColorRaw}`;
      map[setting.priority] = {
        label: setting.displayName || map[setting.priority]?.label || `Priority ${setting.priority}`,
        color: baseColor,
      };
    });
    return map;
  }, [prioritySettings]);

  const defaultPriorityValue = prioritySettings.find((p) => p.isDefault)?.priority ?? prioritySettings[0]?.priority ?? 2;

  const [createValues, setCreateValues] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCompany: "",
    subject: "",
    description: "",
    categoryId: categories[0]?.id || "",
    priority: defaultPriorityValue,
  });

  const [searchValues, setSearchValues] = useState({
    customerEmail: "",
    customerPhone: "",
    ticketNumber: "",
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleCreateChange = (field, value) => {
    setCreateValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (field, value) => {
    setSearchValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitTicket = async () => {
    if (!createValues.subject.trim() || !createValues.description.trim()) {
      toast.error("Subject and description are required.");
      return;
    }
    if (!createValues.customerEmail.trim()) {
      toast.error("Customer email is required.");
      return;
    }
    if (!createValues.categoryId) {
      toast.error("Please select a category.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${BASE_URL}/HelpDesk/SubmitCustomerTicket`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: createValues.subject.trim(),
          description: createValues.description.trim(),
          priority: createValues.priority,
          categoryId: Number(createValues.categoryId),
          customerName: createValues.customerName.trim() || null,
          customerEmail: createValues.customerEmail.trim(),
          customerPhone: createValues.customerPhone.trim() || null,
          customerCompany: createValues.customerCompany.trim() || null,
          assignedToUserId: null,
          project: null,
          projectId: null,
          startDate: null,
          dueDate: null,
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        toast.success(data.message || "Ticket submitted successfully!");
        setCreateValues({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          customerCompany: "",
          subject: "",
          description: "",
          categoryId: categories[0]?.id || "",
          priority: defaultPriorityValue,
        });
      } else {
        toast.error(data.message || "Failed to submit ticket");
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("An unexpected error occurred while submitting the ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTickets = async () => {
    if (!searchValues.customerEmail.trim() && !searchValues.customerPhone.trim() && !searchValues.ticketNumber.trim()) {
      toast.error("Provide at least one filter (email, phone, or ticket number).");
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`${BASE_URL}/HelpDesk/GetCustomerTickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: searchValues.customerEmail.trim(),
          customerPhone: searchValues.customerPhone.trim(),
          ticketNumber: searchValues.ticketNumber.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && (data.status === "SUCCESS" || data.statusCode === 200)) {
        setSearchResults(Array.isArray(data.result) ? data.result : data.result?.items || []);
        if (!data.result || (Array.isArray(data.result) && data.result.length === 0)) {
          toast.info("No tickets found for the provided filters.");
        }
      } else {
        toast.error(data.message || "Failed to retrieve tickets");
      }
    } catch (error) {
      console.error("Error searching tickets:", error);
      toast.error("An unexpected error occurred while searching tickets.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: "#1A202C" }}>
        Help Desk Customer Portal
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Submit a New Ticket
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Customer Name"
                    fullWidth
                    value={createValues.customerName}
                    onChange={(e) => handleCreateChange("customerName", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Customer Email *"
                    fullWidth
                    value={createValues.customerEmail}
                    onChange={(e) => handleCreateChange("customerEmail", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Customer Phone"
                    fullWidth
                    value={createValues.customerPhone}
                    onChange={(e) => handleCreateChange("customerPhone", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Company"
                    fullWidth
                    value={createValues.customerCompany}
                    onChange={(e) => handleCreateChange("customerCompany", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Subject *"
                    fullWidth
                    value={createValues.subject}
                    onChange={(e) => handleCreateChange("subject", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description *"
                    fullWidth
                    multiline
                    minRows={4}
                    value={createValues.description}
                    onChange={(e) => handleCreateChange("description", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      label="Category *"
                      value={createValues.categoryId}
                      onChange={(e) => handleCreateChange("categoryId", e.target.value)}
                    >
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Priority *</InputLabel>
                    <Select
                      label="Priority *"
                      value={createValues.priority}
                      onChange={(e) => handleCreateChange("priority", e.target.value)}
                    >
                      {Object.entries(priorityPalette).map(([key, value]) => (
                        <MenuItem key={key} value={Number(key)}>
                          {value.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSubmitTicket}
                    disabled={isSubmitting}
                    sx={{ py: 1.25, fontWeight: 600 }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Ticket"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Check Ticket Status
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Ticket Number"
                    fullWidth
                    value={searchValues.ticketNumber}
                    onChange={(e) => handleSearchChange("ticketNumber", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Customer Email"
                    fullWidth
                    value={searchValues.customerEmail}
                    onChange={(e) => handleSearchChange("customerEmail", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Customer Phone"
                    fullWidth
                    value={searchValues.customerPhone}
                    onChange={(e) => handleSearchChange("customerPhone", e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleSearchTickets}
                    disabled={isSearching}
                    sx={{ py: 1.25, fontWeight: 600 }}
                  >
                    {isSearching ? "Searching..." : "Search Tickets"}
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Results
              </Typography>
              {searchResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No tickets found. Provide filters above to search for tickets.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 360 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Ticket #</TableCell>
                        <TableCell>Subject</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Due</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {searchResults.map((result) => {
                        const priority = priorityPalette[result.priority] || defaultPriorityPalette[result.priority] || { label: result.priority, color: "#2563EB" };
                        const status = statusConfig.find((s) => s.value === result.status)?.label || "Unknown";
                        return (
                          <TableRow key={result.id}>
                            <TableCell>{result.ticketNumber}</TableCell>
                            <TableCell>{result.subject}</TableCell>
                            <TableCell>{status}</TableCell>
                            <TableCell>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: priority.color }} />
                                {priority.label}
                              </Box>
                            </TableCell>
                            <TableCell>{result.createdOn ? formatDate(result.createdOn) : "-"}</TableCell>
                            <TableCell>{result.dueDate ? formatDate(result.dueDate) : "-"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

const statusConfig = [
  { value: 1, label: "Open" },
  { value: 2, label: "In Progress" },
  { value: 3, label: "Resolved" },
  { value: 4, label: "Closed" },
  { value: 5, label: "On Hold" },
];

export default CustomerHelpDeskPortal;

