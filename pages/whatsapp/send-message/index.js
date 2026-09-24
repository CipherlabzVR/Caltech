import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/styles/PageTitle.module.css";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import { getSendingAccounts, getTemplates, sendMessage, sendTemplateMessage } from "@/Services/whatsRay";

export default function WhatsAppSendMessage() {
  const cId = typeof window !== "undefined" ? sessionStorage.getItem("category") : null;
  const { navigate, create } = IsPermissionEnabled(cId);

  const [activeTab, setActiveTab] = useState(0);
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [mobileCode, setMobileCode] = useState("94");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [variables, setVariables] = useState({});
  const [sending, setSending] = useState(false);
  const [templateError, setTemplateError] = useState(null);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data = await getSendingAccounts();
        if (data.statusCode === 200) {
          const list = (data.result || []).filter((item) => item.isActive);
          setAccounts(list);
          if (list.length > 0) {
            setAccountId(list[0].id);
          }
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message || "Failed to load WhatsApp connections.");
      }
    };

    loadAccounts();
  }, []);

  const loadTemplates = useCallback(async (selectedAccountId) => {
    if (!selectedAccountId) return;
    setTemplateError(null);
    try {
      const data = await getTemplates(selectedAccountId, "all");
      if (data.statusCode === 200) {
        setTemplates(data.result || []);
      } else {
        setTemplates([]);
        setTemplateError(data.message);
      }
    } catch (error) {
      setTemplates([]);
      setTemplateError(error.message || "Failed to load templates.");
    }
  }, []);

  useEffect(() => {
    if (activeTab === 1 && accountId) {
      loadTemplates(accountId);
    }
  }, [activeTab, accountId, loadTemplates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => String(item.id) === String(templateId)),
    [templates, templateId]
  );

  const approvedTemplates = useMemo(
    () => templates.filter((item) => (item.status || "").toLowerCase() === "approved"),
    [templates]
  );

  const pendingTemplates = useMemo(
    () => {
      const value = (status) => (status || "").toLowerCase();
      return templates.filter((item) => value(item.status) === "pending" || item.status === "0");
    },
    [templates]
  );

  useEffect(() => {
    setVariables({});
  }, [templateId]);

  const validateRecipient = () => {
    if (!accountId) {
      toast.error("Select the WhatsApp account to send from.");
      return false;
    }
    if (!mobile.trim()) {
      toast.error("Enter the recipient mobile number.");
      return false;
    }
    return true;
  };

  const handleSendText = async () => {
    if (!validateRecipient()) return;
    if (!message.trim()) {
      toast.error("Enter a message to send.");
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("AccountId", accountId);
      formData.append("MobileCode", mobileCode.replace(/\D/g, ""));
      formData.append("Mobile", mobile.replace(/\D/g, ""));
      formData.append("Message", message);

      const data = await sendMessage(formData);
      if (data.statusCode === 200) {
        toast.success(data.message);
        setMessage("");
      } else {
        toast.error(data.message, { autoClose: 12000 });
      }
    } catch (error) {
      toast.error(error.message || "Failed to send the message.");
    } finally {
      setSending(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!validateRecipient()) return;
    if (!templateId) {
      toast.error("Select a template to send.");
      return;
    }

    const required = [
      ...(selectedTemplate?.headerVariables || []),
      ...(selectedTemplate?.bodyVariables || []),
    ];
    const missing = required.filter((name) => !variables[name]?.trim());
    if (missing.length > 0) {
      toast.error(`Provide a value for: ${missing.join(", ")}`);
      return;
    }

    const pick = (names) =>
      (names || []).reduce((acc, name) => ({ ...acc, [name]: variables[name] ?? "" }), {});

    setSending(true);
    try {
      const data = await sendTemplateMessage({
        accountId,
        mobileCode: mobileCode.replace(/\D/g, ""),
        mobile: mobile.replace(/\D/g, ""),
        templateId: String(templateId),
        headerVariables: pick(selectedTemplate?.headerVariables),
        bodyVariables: pick(selectedTemplate?.bodyVariables),
      });

      if (data.statusCode === 200) {
        toast.success(data.message);
        setVariables({});
      } else {
        toast.error(data.message, { autoClose: 12000 });
      }
    } catch (error) {
      toast.error(error.message || "Failed to send the template message.");
    } finally {
      setSending(false);
    }
  };

  if (!navigate) {
    return <AccessDenied />;
  }

  const allVariables = [
    ...(selectedTemplate?.headerVariables || []),
    ...(selectedTemplate?.bodyVariables || []),
  ];

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Send WhatsApp Message</h1>
        <ul>
          <li>
            <Link href="/whatsapp/integration/">WhatsApp</Link>
          </li>
          <li>Send Message</li>
        </ul>
      </div>

      <ToastContainer />

      {accounts.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your user is not mapped to a WhatsApp number. Ask an administrator to map you under
          WhatsApp → User Mapping.
        </Alert>
      )}

      <Paper sx={{ p: 2 }} className="bg-black">
        <Grid container spacing={1} mb={2}>
          <Grid item xs={12} lg={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Send From"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
            >
              {accounts.length === 0 ? (
                <MenuItem value="">No connections available</MenuItem>
              ) : (
                accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name} ({account.phoneNumber})
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
          <Grid item xs={4} lg={2}>
            <TextField
              fullWidth
              size="small"
              label="Country Code"
              value={mobileCode}
              onChange={(event) => setMobileCode(event.target.value)}
              placeholder="94"
            />
          </Grid>
          <Grid item xs={8} lg={4}>
            <TextField
              fullWidth
              size="small"
              label="Recipient Mobile"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              placeholder="741218373"
              helperText="Without the country code and leading zero."
            />
          </Grid>
        </Grid>

        <Tabs
          value={activeTab}
          onChange={(event, value) => setActiveTab(value)}
          sx={{ mb: 2 }}
        >
          <Tab label="Text Message" />
          <Tab label="Template Message" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              A plain text message only reaches a contact inside an open 24-hour conversation
              window. Use a template to start a new conversation.
            </Alert>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={sending || !create}
                onClick={handleSendText}
              >
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </Box>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {templateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {templateError}
              </Alert>
            )}

            {approvedTemplates.length === 0 && pendingTemplates.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {pendingTemplates.map((item) => item.name).join(", ")}{" "}
                {pendingTemplates.length === 1 ? "is" : "are"} waiting for Meta approval.
                {pendingTemplates.length === 1 ? " It" : " They"} will appear here once WhatsApp
                marks {pendingTemplates.length === 1 ? "it" : "them"} Approved. Check status under
                WhatsApp → Templates (Pending).
              </Alert>
            )}

            {approvedTemplates.length === 0 && pendingTemplates.length === 0 && !templateError && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No templates found for this number. Create one in the WhatsRay dashboard, wait for
                Meta to approve it, then reopen this tab.
              </Alert>
            )}

            <TextField
              select
              fullWidth
              size="small"
              label="Approved Template"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {approvedTemplates.length === 0 ? (
                <MenuItem value="">No approved templates available</MenuItem>
              ) : (
                approvedTemplates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} {template.language ? `(${template.language})` : ""}
                  </MenuItem>
                ))
              )}
            </TextField>

            {selectedTemplate?.bodyText && (
              <Paper variant="outlined" sx={{ p: 2, mt: 2, whiteSpace: "pre-wrap" }}>
                <Typography variant="body2" color="text.secondary">
                  Preview
                </Typography>
                <Typography variant="body2">{selectedTemplate.bodyText}</Typography>
              </Paper>
            )}

            {allVariables.length > 0 && (
              <Grid container spacing={1} mt={1}>
                {allVariables.map((variable) => (
                  <Grid item xs={12} lg={6} key={variable}>
                    <TextField
                      fullWidth
                      size="small"
                      label={variable}
                      value={variables[variable] ?? ""}
                      onChange={(event) =>
                        setVariables((current) => ({ ...current, [variable]: event.target.value }))
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}

            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                disabled={sending || !create}
                onClick={handleSendTemplate}
              >
                {sending ? "Sending..." : "Send Template"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </>
  );
}
