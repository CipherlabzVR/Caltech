import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Pagination,
  Switch,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from "@mui/material";
import Card from "@mui/material/Card";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import PhoneAndroidOutlinedIcon from "@mui/icons-material/PhoneAndroidOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { QRCodeCanvas } from "qrcode.react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import ChangePasswordForm from "@/components/Authentication/ChangePasswordForm";
import { getDeviceId, resolveDeviceDisplayId } from "@/components/utils/getDeviceId";
import usePaginatedFetch from "@/components/hooks/usePaginatedFetch";

const VALID_SECTIONS = ["personal", "devices", "settings", "login-activities", "two-factor"];

const TWO_FACTOR_CHANNELS = {
  isTwoFactorEmailEnabled: {
    apiChannel: "Email",
    verifiedKey: "isTwoFactorEmailVerified",
    label: "Email",
  },
  isTwoFactorWhatsAppEnabled: {
    apiChannel: "WhatsApp",
    verifiedKey: "isTwoFactorWhatsAppVerified",
    label: "WhatsApp",
  },
  isTwoFactorSmsEnabled: {
    apiChannel: "Sms",
    verifiedKey: "isTwoFactorSmsVerified",
    label: "SMS",
  },
  isTwoFactorAuthenticatorEnabled: {
    apiChannel: "Authenticator",
    verifiedKey: "isTwoFactorAuthenticatorVerified",
    label: "Authenticator",
  },
};

// Initial state for the authenticator (TOTP) setup dialog. Lives next to the
// existing OTP-channel dialog because the UX is meaningfully different — the
// user scans a QR code and reads a rolling code from their app instead of
// receiving an OTP from us.
const INITIAL_AUTHENTICATOR_DIALOG = {
  open: false,
  loading: false,
  verifying: false,
  error: "",
  secretKey: "",
  otpAuthUri: "",
  issuer: "",
  accountName: "",
  code: "",
  attemptsLeft: null,
  maxAttempts: null,
  locked: false,
  lockoutEndsAt: "",
};

const INITIAL_DISABLE_AUTHENTICATOR_DIALOG = {
  open: false,
  password: "",
  showPassword: false,
  submitting: false,
  error: "",
};

const PersonalInformation = () => {
  const router = useRouter();
  const [profileImg, setProfileImg] = useState(null);
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeSection, setActiveSection] = useState("personal");

  // Sync the active tab with the ?section= query param so deep links from
  // elsewhere in the app (e.g. the top navbar "Change Password" menu item)
  // open the correct profile section.
  useEffect(() => {
    if (!router.isReady) return;
    const queryValue = router.query?.section;
    const requested = Array.isArray(queryValue) ? queryValue[0] : queryValue;
    if (requested && VALID_SECTIONS.includes(requested) && requested !== activeSection) {
      setActiveSection(requested);
    }
  }, [router.isReady, router.query?.section]);
  const {
    data: loginActivities,
    totalCount: loginActivitiesTotal,
    page: activityPage,
    pageSize: activityPageSize,
    loading: loginActivitiesLoading,
    setPage: setActivityPage,
    setPageSize: setActivityPageSize,
    fetchData: fetchLoginActivities,
  } = usePaginatedFetch("User/GetLoginActivities", "", 10, false, false);
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    isTwoFactorEmailEnabled: false,
    isTwoFactorWhatsAppEnabled: false,
    isTwoFactorSmsEnabled: false,
    isTwoFactorAuthenticatorEnabled: false,
    isTwoFactorEmailVerified: false,
    isTwoFactorWhatsAppVerified: false,
    isTwoFactorSmsVerified: false,
    isTwoFactorAuthenticatorVerified: false,
  });
  const [authenticatorDialog, setAuthenticatorDialog] = useState(
    INITIAL_AUTHENTICATOR_DIALOG
  );
  const [disableAuthenticatorDialog, setDisableAuthenticatorDialog] = useState(
    INITIAL_DISABLE_AUTHENTICATOR_DIALOG
  );
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorUpdatingKey, setTwoFactorUpdatingKey] = useState("");
  const [verifyDialog, setVerifyDialog] = useState({
    open: false,
    key: null,
    apiChannel: null,
    label: "",
    recipient: "",
    otp: "",
    sending: false,
    verifying: false,
    sent: false,
    error: "",
    locked: false,
    lockoutEndsAt: "",
    attemptsLeft: null,
    maxAttempts: null,
  });
  const [lockoutNowTick, setLockoutNowTick] = useState(0);

  // Self-service "Edit Profile" dialog. Lets the signed-in user update their
  // own first name, last name, email, and mobile number.
  const [editProfileDialog, setEditProfileDialog] = useState({
    open: false,
    saving: false,
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    errors: {},
    apiError: "",
  });

  useEffect(() => {
    if (!verifyDialog.locked || !verifyDialog.lockoutEndsAt) return undefined;
    const id = setInterval(() => setLockoutNowTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [verifyDialog.locked, verifyDialog.lockoutEndsAt]);
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("user") : "";
  const currentDeviceId = typeof window !== "undefined" ? getDeviceId() : "";

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const query = `${BASE_URL}/User/GetUserDetailByEmail?email=${userEmail}`;
      const response = await fetch(query, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setUser(data.result);
      setProfileImg(data.result.profilePhoto);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/GetLoggedInDevices`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch devices");

      const data = await response.json();
      setDevices(data.result || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to load devices");
    }
  };

  const applyTwoFactorResult = (result) => {
    setTwoFactorSettings({
      isTwoFactorEmailEnabled: !!result.isTwoFactorEmailEnabled,
      isTwoFactorWhatsAppEnabled: !!result.isTwoFactorWhatsAppEnabled,
      isTwoFactorSmsEnabled: !!result.isTwoFactorSmsEnabled,
      isTwoFactorAuthenticatorEnabled: !!result.isTwoFactorAuthenticatorEnabled,
      isTwoFactorEmailVerified: !!result.isTwoFactorEmailVerified,
      isTwoFactorWhatsAppVerified: !!result.isTwoFactorWhatsAppVerified,
      isTwoFactorSmsVerified: !!result.isTwoFactorSmsVerified,
      isTwoFactorAuthenticatorVerified: !!result.isTwoFactorAuthenticatorVerified,
    });
  };

  const fetchTwoFactorSettings = async () => {
    setTwoFactorLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/GetTwoFactorAuthSettings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch 2FA settings");
      const data = await response.json();
      if (data?.statusCode === 200 && data.result) {
        applyTwoFactorResult(data.result);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const persistTwoFactorSetting = async (key, value) => {
    const previousSettings = { ...twoFactorSettings };
    const nextSettings = {
      ...twoFactorSettings,
      [key]: value,
    };

    setTwoFactorSettings(nextSettings);
    setTwoFactorUpdatingKey(key);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/UpdateTwoFactorAuthSettings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isTwoFactorEmailEnabled: nextSettings.isTwoFactorEmailEnabled,
          isTwoFactorWhatsAppEnabled: nextSettings.isTwoFactorWhatsAppEnabled,
          isTwoFactorSmsEnabled: nextSettings.isTwoFactorSmsEnabled,
          isTwoFactorAuthenticatorEnabled: nextSettings.isTwoFactorAuthenticatorEnabled,
        }),
      });
      const data = await response.json();
      if (data?.statusCode === 200) {
        if (data.result) {
          applyTwoFactorResult(data.result);
        }
        toast.success(data.message || "Two-factor authentication settings updated.");
      } else {
        setTwoFactorSettings(previousSettings);
        toast.error(data?.message || "Failed to update settings.");
      }
    } catch (error) {
      setTwoFactorSettings(previousSettings);
      toast.error(error.message || "Failed to update settings.");
    } finally {
      setTwoFactorUpdatingKey("");
    }
  };

  const handleTwoFactorToggle = async (key, checked) => {
    const channel = TWO_FACTOR_CHANNELS[key];
    if (!channel) return;

    if (!checked) {
      await persistTwoFactorSetting(key, false);
      return;
    }

    if (twoFactorSettings[channel.verifiedKey]) {
      await persistTwoFactorSetting(key, true);
      return;
    }

    // Authenticator (TOTP) uses a dedicated QR-code setup dialog instead of
    // the OTP send/verify flow used by Email/WhatsApp/SMS.
    if (key === "isTwoFactorAuthenticatorEnabled") {
      await openAuthenticatorSetupDialog();
      return;
    }

    setVerifyDialog({
      open: true,
      key,
      apiChannel: channel.apiChannel,
      label: channel.label,
      recipient: "",
      otp: "",
      sending: false,
      verifying: false,
      sent: false,
      error: "",
      locked: false,
      lockoutEndsAt: "",
      attemptsLeft: null,
      maxAttempts: null,
    });
  };

  // ---- Google Authenticator (TOTP) handlers ----

  const openAuthenticatorSetupDialog = async () => {
    setAuthenticatorDialog({ ...INITIAL_AUTHENTICATOR_DIALOG, open: true, loading: true });
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/SetupAuthenticator`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (data?.statusCode === 200 && data.result?.otpAuthUri) {
        setAuthenticatorDialog((prev) => ({
          ...prev,
          loading: false,
          secretKey: data.result.secretKey || "",
          otpAuthUri: data.result.otpAuthUri || "",
          issuer: data.result.issuer || "",
          accountName: data.result.accountName || "",
          error: "",
        }));
      } else {
        const msg = data?.message || "Could not start authenticator setup.";
        toast.error(msg);
        setAuthenticatorDialog((prev) => ({ ...prev, loading: false, error: msg }));
      }
    } catch (error) {
      const msg = error.message || "Could not start authenticator setup.";
      toast.error(msg);
      setAuthenticatorDialog((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  const closeAuthenticatorDialog = () => {
    setAuthenticatorDialog(INITIAL_AUTHENTICATOR_DIALOG);
  };

  const handleAuthenticatorCodeChange = (event) => {
    const value = event.target.value.replace(/[^0-9]/g, "").slice(0, 8);
    setAuthenticatorDialog((prev) => ({ ...prev, code: value, error: "" }));
  };

  const handleVerifyAuthenticatorSetup = async () => {
    if (!authenticatorDialog.code || authenticatorDialog.code.length < 6) {
      setAuthenticatorDialog((prev) => ({
        ...prev,
        error: "Please enter the 6-digit code from your authenticator app.",
      }));
      return;
    }
    setAuthenticatorDialog((prev) => ({ ...prev, verifying: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/VerifyAuthenticatorSetup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: authenticatorDialog.code.trim() }),
      });
      const data = await response.json();
      if (data?.statusCode === 200) {
        if (data.result) applyTwoFactorResult(data.result);
        toast.success(data.message || "Google Authenticator enabled.");
        setAuthenticatorDialog(INITIAL_AUTHENTICATOR_DIALOG);
      } else {
        const msg = data?.message || "Invalid authenticator code.";
        toast.error(msg);
        const lockInfo = extractLockoutInfo(data, msg);
        setAuthenticatorDialog((prev) => ({
          ...prev,
          verifying: false,
          code: "",
          error: msg,
          ...lockInfo,
        }));
      }
    } catch (error) {
      const msg = error.message || "Verification failed.";
      toast.error(msg);
      setAuthenticatorDialog((prev) => ({
        ...prev,
        verifying: false,
        code: "",
        error: msg,
      }));
    }
  };

  const handleCopyAuthenticatorSecret = async () => {
    if (!authenticatorDialog.secretKey) return;
    try {
      await navigator.clipboard.writeText(authenticatorDialog.secretKey);
      toast.success("Secret key copied to clipboard.");
    } catch {
      toast.error("Could not copy. You can select and copy it manually.");
    }
  };

  const openDisableAuthenticatorDialog = () => {
    setDisableAuthenticatorDialog({ ...INITIAL_DISABLE_AUTHENTICATOR_DIALOG, open: true });
  };

  const closeDisableAuthenticatorDialog = () => {
    if (disableAuthenticatorDialog.submitting) return;
    setDisableAuthenticatorDialog(INITIAL_DISABLE_AUTHENTICATOR_DIALOG);
  };

  const handleDisableAuthenticatorSubmit = async () => {
    if (!disableAuthenticatorDialog.password) {
      setDisableAuthenticatorDialog((prev) => ({
        ...prev,
        error: "Please enter your password.",
      }));
      return;
    }
    setDisableAuthenticatorDialog((prev) => ({ ...prev, submitting: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/DisableAuthenticator`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: disableAuthenticatorDialog.password }),
      });
      const data = await response.json();
      if (data?.statusCode === 200) {
        if (data.result) applyTwoFactorResult(data.result);
        toast.success(data.message || "Google Authenticator removed.");
        setDisableAuthenticatorDialog(INITIAL_DISABLE_AUTHENTICATOR_DIALOG);
      } else {
        const msg = data?.message || "Could not disable authenticator.";
        toast.error(msg);
        setDisableAuthenticatorDialog((prev) => ({
          ...prev,
          submitting: false,
          error: msg,
        }));
      }
    } catch (error) {
      const msg = error.message || "Could not disable authenticator.";
      toast.error(msg);
      setDisableAuthenticatorDialog((prev) => ({
        ...prev,
        submitting: false,
        error: msg,
      }));
    }
  };

  const closeVerifyDialog = () => {
    setVerifyDialog((prev) => ({ ...prev, open: false }));
  };

  const isLockoutMessage = (msg) => {
    if (!msg) return false;
    const lower = msg.toLowerCase();
    return lower.includes("too many") || lower.includes("try again in") || lower.includes("temporarily locked");
  };

  // Pull structured lockout fields from the API result so the dialog can show
  // "X attempts left" and the precise "try again at HH:MM" time.
  const extractLockoutInfo = (data, msg) => {
    const r = data?.result || {};
    return {
      locked: !!r.locked || isLockoutMessage(msg),
      lockoutEndsAt: r.lockoutEndsAt || "",
      attemptsLeft: typeof r.attemptsLeft === "number" ? r.attemptsLeft : null,
      maxAttempts: typeof r.maxAttempts === "number" ? r.maxAttempts : null,
    };
  };

  const handleSendVerificationOtp = async () => {
    if (!verifyDialog.apiChannel || verifyDialog.locked) return;
    setVerifyDialog((prev) => ({ ...prev, sending: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/SendTwoFactorVerificationOtp`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: verifyDialog.apiChannel }),
      });
      const data = await response.json();
      if (data?.statusCode === 200) {
        toast.success(data.message || "Verification code sent.");
        setVerifyDialog((prev) => ({
          ...prev,
          sending: false,
          sent: true,
          recipient: data?.result?.recipient || "",
          error: "",
        }));
      } else {
        const msg = data?.message || "Could not send the verification code.";
        toast.error(msg);
        const lockInfo = extractLockoutInfo(data, msg);
        setVerifyDialog((prev) => ({
          ...prev,
          sending: false,
          error: msg,
          ...lockInfo,
        }));
      }
    } catch (error) {
      const msg = error.message || "Could not send the verification code.";
      toast.error(msg);
      setVerifyDialog((prev) => ({
        ...prev,
        sending: false,
        error: msg,
        locked: isLockoutMessage(msg),
      }));
    }
  };

  const handleVerifyOtp = async () => {
    if (!verifyDialog.apiChannel || !verifyDialog.otp.trim()) {
      setVerifyDialog((prev) => ({ ...prev, error: "Please enter the verification code." }));
      return;
    }
    setVerifyDialog((prev) => ({ ...prev, verifying: true, error: "" }));
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/VerifyTwoFactorChannel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: verifyDialog.apiChannel,
          otp: verifyDialog.otp.trim(),
        }),
      });
      const data = await response.json();
      if (data?.statusCode === 200) {
        if (data.result) {
          applyTwoFactorResult(data.result);
        }
        toast.success(data.message || "Verified successfully.");
        setVerifyDialog((prev) => ({
          ...prev,
          open: false,
          verifying: false,
          otp: "",
          sent: false,
          error: "",
          locked: false,
          lockoutEndsAt: "",
          attemptsLeft: null,
          maxAttempts: null,
        }));
      } else {
        const msg = data?.message || "Verification failed.";
        toast.error(msg);
        const lockInfo = extractLockoutInfo(data, msg);
        setVerifyDialog((prev) => ({
          ...prev,
          verifying: false,
          otp: "",
          error: msg,
          ...lockInfo,
        }));
      }
    } catch (error) {
      const msg = error.message || "Verification failed.";
      toast.error(msg);
      setVerifyDialog((prev) => ({
        ...prev,
        verifying: false,
        otp: "",
        error: msg,
        locked: isLockoutMessage(msg),
      }));
    }
  };

  useEffect(() => {
    if (!userEmail) {
      return;
    }

    fetchUser();
    fetchDevices();
    fetchTwoFactorSettings();
  }, []);

  useEffect(() => {
    if (!userEmail || activeSection !== "login-activities") {
      return;
    }

    fetchLoginActivities(1, "", activityPageSize);
    setActivityPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, userEmail]);

  const personalInfo = [
    { title: "Full Name", text: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not available" : "Not available" },
    { title: "Mobile", text: user?.phoneNumber || "Not available" },
    { title: "Email", text: user?.email || "Not available" },
    { title: "Location", text: user?.address || "Not available" },
  ];

  const sections = [
    {
      value: "personal",
      label: "Personal Information",
      description: "View your profile details and manage your profile photo.",
      icon: <PersonOutlineIcon fontSize="small" />,
    },
    {
      value: "devices",
      label: "Logged In Devices",
      description: "Review devices that have been used to access your account.",
      icon: <DevicesOutlinedIcon fontSize="small" />,
    },
    {
      value: "settings",
      label: "Change Password",
      description: "Update your account security settings.",
      icon: <SettingsOutlinedIcon fontSize="small" />,
    },
    {
      value: "login-activities",
      label: "Login Activities",
      description: "Review your recent login and activity timeline.",
      icon: <DevicesOutlinedIcon fontSize="small" />,
    },
    {
      value: "two-factor",
      label: "2 Factor Authentication",
      description: "Add an extra layer of security to your account by enabling two-factor authentication.",
      icon: <SecurityOutlinedIcon fontSize="small" />,
    },
  ];

  const activeSectionDetails = sections.find((section) => section.value === activeSection) || sections[0];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) {
      return;
    }

    const formData = new FormData();
    formData.append("UserId", user.id);
    formData.append("ProfileImage", file);
    await uploadFile(formData);
  };

  const handleImageRemove = async () => {
    if (!user?.id) {
      return;
    }

    const formData = new FormData();
    formData.append("UserId", user.id);
    formData.append("ProfileImage", null);
    await uploadFile(formData);
  };

  const uploadFile = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/UpdateUserProfileAsync`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.statusCode === 200) {
        toast.success(data.message);
        fetchUser();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "");
    }
  };

  // ---- Edit Profile (self-service) handlers ----
  const openEditProfileDialog = () => {
    setEditProfileDialog({
      open: true,
      saving: false,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      mobileNumber: user?.phoneNumber || "",
      errors: {},
      apiError: "",
    });
  };

  const closeEditProfileDialog = () => {
    setEditProfileDialog((prev) => ({ ...prev, open: false }));
  };

  const handleEditProfileChange = (field) => (event) => {
    const value = event.target.value;
    setEditProfileDialog((prev) => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: "" },
      apiError: "",
    }));
  };

  const validateEditProfile = () => {
    const errors = {};
    const firstName = editProfileDialog.firstName.trim();
    const lastName = editProfileDialog.lastName.trim();
    const email = editProfileDialog.email.trim();
    const mobile = editProfileDialog.mobileNumber.trim();

    if (!firstName) errors.firstName = "First name is required.";
    if (!lastName) errors.lastName = "Last name is required.";
    if (!email) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!mobile) errors.mobileNumber = "Mobile number is required.";

    return errors;
  };

  const handleSaveProfile = async () => {
    const errors = validateEditProfile();
    if (Object.keys(errors).length > 0) {
      setEditProfileDialog((prev) => ({ ...prev, errors }));
      return;
    }

    setEditProfileDialog((prev) => ({ ...prev, saving: true, apiError: "" }));

    const newEmail = editProfileDialog.email.trim();
    const newPhone = editProfileDialog.mobileNumber.trim();
    const previousEmail = user?.email || "";
    const previousPhone = user?.phoneNumber || "";

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/User/UpdateMyProfile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: editProfileDialog.firstName.trim(),
          lastName: editProfileDialog.lastName.trim(),
          email: newEmail,
          mobileNumber: newPhone,
        }),
      });
      const data = await response.json();

      if (data?.statusCode === 200) {
        toast.success(data.message || "Profile updated successfully.");

        // Email is the auth identifier the app uses for fetching the user;
        // keep localStorage in sync so subsequent calls don't 404.
        const emailChanged = !!data?.result?.emailChanged
          || (previousEmail && previousEmail.toLowerCase() !== newEmail.toLowerCase());
        const phoneChanged = !!data?.result?.phoneChanged
          || (previousPhone !== newPhone);

        if (emailChanged && typeof window !== "undefined") {
          localStorage.setItem("user", newEmail);
        }

        if (emailChanged || phoneChanged) {
          // Surface an extra heads-up because we just dropped any 2FA
          // verification that was tied to the old email/phone.
          toast.info(
            "Your contact details changed. Please re-verify the new "
              + (emailChanged && phoneChanged ? "email and mobile" : emailChanged ? "email" : "mobile")
              + " before re-enabling two-factor authentication."
          );
        }

        setEditProfileDialog((prev) => ({ ...prev, saving: false, open: false }));

        // Refresh user + 2FA settings so the UI reflects the cleared flags.
        await fetchUser();
        await fetchTwoFactorSettings();
      } else {
        const msg = data?.message || "Failed to update profile.";
        toast.error(msg);
        setEditProfileDialog((prev) => ({ ...prev, saving: false, apiError: msg }));
      }
    } catch (error) {
      const msg = error.message || "Failed to update profile.";
      toast.error(msg);
      setEditProfileDialog((prev) => ({ ...prev, saving: false, apiError: msg }));
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "N/A";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString();
  };

  // Map the current page's UserLoginActivities rows to display rows.
  // The Login row is always shown; for sessions still open we add a small
  // "Last Activity" row, otherwise a "Logout" row.
  // One UserLoginActivity row -> one card. Pagination is server-driven, so the
  // page size value (10 by default) maps 1:1 to the number of cards on screen.
  const getLoginActivities = () => {
    return loginActivities.map((entry) => {
      const deviceDisplayId = resolveDeviceDisplayId(
        {
          deviceIdentifier: entry.deviceIdentifier,
          ipAddress: entry.ipAddress,
          id: entry.loggedInDeviceIpId,
        },
        currentDeviceId
      );

      const isActiveSession = Boolean(entry.isActive);
      const status = entry.logoutTime ? "Logged Out" : isActiveSession ? "Active" : "Login";

      return {
        id: entry.id,
        type: status,
        deviceName: entry.deviceName || "Unknown Device",
        deviceId: deviceDisplayId,
        loggedInTime: entry.loggedInTime,
        logoutTime: entry.logoutTime,
        timestamp: entry.loggedInTime,
        isCurrentDevice: Boolean(entry.isCurrentDevice),
        isActiveSession,
      };
    });
  };

  const renderPersonalSection = () => (
    <Box>
      <Box
        sx={{
          border: "1px solid #EEF0F7",
          borderRadius: "18px",
          p: { xs: 2, md: 3 },
          background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
          mb: 3,
        }}
        className="for-dark-bottom-border"
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                width: { xs: 120, md: 150 },
                height: { xs: 120, md: 150 },
                borderRadius: "24px",
                overflow: "hidden",
                border: "4px solid #fff",
                boxShadow: "0px 12px 30px rgba(15, 23, 42, 0.10)",
                backgroundColor: "#F1F5F9",
              }}
            >
              <img
                src={profileImg || "/images/usertest.png"}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography component="h2" sx={{ fontSize: 24, fontWeight: 700, mb: 1 }}>
              {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User Profile" : "User Profile"}
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 1 }}>
              {user?.email || "No email available"}
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 3 }}>
              Manage your profile photo and keep your personal details up to date.
            </Typography>

            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<PhotoCamera />}
                disabled={!user?.id}
                sx={{
                  borderRadius: "10px",
                  textTransform: "capitalize",
                  color: "#fff !important",
                }}
              >
                {profileImg ? "Change Photo" : "Upload Photo"}
                <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleImageRemove}
                disabled={!profileImg || !user?.id}
                sx={{ borderRadius: "10px", textTransform: "capitalize" }}
              >
                Remove Photo
              </Button>

              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={openEditProfileDialog}
                disabled={!user?.id}
                sx={{ borderRadius: "10px", textTransform: "capitalize" }}
              >
                Edit Profile
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2}>
        {personalInfo.map((info) => (
          <Grid item xs={12} sm={6} key={info.title}>
            <Box
              sx={{
                border: "1px solid #EEF0F7",
                borderRadius: "16px",
                p: 2.5,
                height: "100%",
                backgroundColor: "#fff",
              }}
              className="for-dark-bottom-border"
            >
              <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 1 }}>
                {info.title}
              </Typography>
              <Typography sx={{ fontSize: "16px", fontWeight: 600, wordBreak: "break-word" }}>
                {info.text}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          border: "1px solid #EEF0F7",
          borderRadius: "16px",
          p: 2.5,
          mt: 3,
          backgroundColor: "#fff",
        }}
        className="for-dark-bottom-border"
      >
        <Typography component="h3" sx={{ fontSize: "16px", fontWeight: 600, mb: 1 }}>
          About
        </Typography>
        <Typography color="text.secondary">
          Hello, I’m passionate about connecting with people, exploring new features, and growing within this community.
        </Typography>
      </Box>
    </Box>
  );

  const renderDevicesSection = () => {
    if (devices.length === 0) {
      return (
        <Box
          sx={{
            border: "1px dashed #CBD5E1",
            borderRadius: "16px",
            p: 4,
            textAlign: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 1 }}>No devices found</Typography>
          <Typography color="text.secondary">
            Logged in devices will appear here when they are available.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {devices.map((device) => (
          <Grid item lg={6} md={6} xs={12} key={device.id}>
            <Box
              sx={{
                border: "1px solid #EEF0F7",
                borderRadius: "16px",
                p: "20px",
                backgroundColor: "#fff",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
              className="for-dark-bottom-border"
            >
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                  <Typography fontWeight="600" fontSize="16px">
                    {device.deviceName || "Unknown Device"}
                  </Typography>
                  {device.isCurrentDevice && (
                    <Chip label="Current Device" size="small" color="primary" />
                  )}
                  {!device.isCurrentDevice && (
                    <Chip
                      label={device.isActive ? "Active" : "Inactive"}
                      size="small"
                      color={device.isActive ? "success" : "default"}
                      variant={device.isActive ? "filled" : "outlined"}
                    />
                  )}
                </Box>
                <Typography
                  fontSize="14px"
                  color="text.secondary"
                  sx={{ wordBreak: "break-all" }}
                >
                  Device ID: {resolveDeviceDisplayId(device, currentDeviceId)}
                </Typography>
                <Typography fontSize="14px" color="text.secondary" sx={{ mt: 1 }}>
                  Last Active: {formatDate(device.updatedOn || device.createdOn)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderLoginActivitiesSection = () => {
    if (loginActivitiesLoading && loginActivities.length === 0) {
      return (
        <Box
          sx={{
            border: "1px solid #EEF0F7",
            borderRadius: "16px",
            p: 4,
            textAlign: "center",
            backgroundColor: "#fff",
          }}
        >
          <CircularProgress size={28} />
          <Typography sx={{ mt: 2, color: "text.secondary" }}>
            Loading login activities…
          </Typography>
        </Box>
      );
    }

    const activities = getLoginActivities();
    const totalCount = loginActivitiesTotal;
    const totalPages = Math.max(1, Math.ceil(totalCount / activityPageSize));
    const currentPage = Math.min(Math.max(activityPage, 1), totalPages);
    const startIndex = totalCount === 0 ? 0 : (currentPage - 1) * activityPageSize;
    const endIndex =
      totalCount === 0
        ? 0
        : Math.min(startIndex + loginActivities.length, totalCount);

    const handleActivityPageChange = (_, value) => {
      setActivityPage(value);
      fetchLoginActivities(value, "", activityPageSize);
    };

    const handleActivityPageSizeChange = (event) => {
      const size = Number(event.target.value);
      setActivityPageSize(size);
      setActivityPage(1);
      fetchLoginActivities(1, "", size);
    };

    if (totalCount === 0) {
      return (
        <Box
          sx={{
            border: "1px dashed #CBD5E1",
            borderRadius: "16px",
            p: 4,
            textAlign: "center",
            backgroundColor: "#F8FAFC",
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 1 }}>No login activities found</Typography>
          <Typography color="text.secondary">
            Login and activity events will appear here.
          </Typography>
        </Box>
      );
    }

    const chipColorByType = {
      Login: "primary",
      Active: "success",
      "Logged Out": "warning",
    };

    return (
      <Box
        sx={{
          border: "1px solid #EEF0F7",
          borderRadius: "16px",
          p: { xs: 2, md: 2.5 },
          backgroundColor: "#fff",
          position: "relative",
        }}
        className="for-dark-bottom-border"
      >
        {loginActivitiesLoading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.6)",
              borderRadius: "16px",
              zIndex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        <Box sx={{ display: "grid", gap: 1.5 }}>
          {activities.map((activity) => (
            <Box
              key={activity.id}
              sx={{
                border: "1px solid #EEF0F7",
                borderRadius: "12px",
                p: 1.5,
                backgroundColor: "#FAFBFF",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                <Chip
                  size="small"
                  label={activity.type}
                  color={chipColorByType[activity.type] || "default"}
                  variant={activity.type === "Logged Out" ? "outlined" : "filled"}
                />
                {activity.isCurrentDevice && (
                  <Chip size="small" label="Current Device" color="success" variant="outlined" />
                )}
                {activity.isActiveSession && !activity.isCurrentDevice && (
                  <Chip size="small" label="Active Session" color="info" variant="outlined" />
                )}
              </Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                {activity.deviceName}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "text.secondary", wordBreak: "break-all" }}>
                Device ID: {activity.deviceId}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
                Login Time: {formatDate(activity.loggedInTime)}
              </Typography>
              {activity.logoutTime && (
                <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
                  Logout Time: {formatDate(activity.logoutTime)}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          mt={2}
          mb={1}
          gap={1}
        >
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handleActivityPageChange}
            color="primary"
            shape="rounded"
            disabled={loginActivitiesLoading}
          />
          <Typography sx={{ fontSize: "13px", color: "text.secondary", flexGrow: 1, textAlign: "center" }}>
            Showing {startIndex + 1}-{endIndex} of {totalCount}
          </Typography>
          <FormControl size="small" sx={{ width: "100px" }}>
            <InputLabel>Page Size</InputLabel>
            <Select
              value={activityPageSize}
              label="Page Size"
              onChange={handleActivityPageSizeChange}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Box>
    );
  };

  const renderSettingsSection = () => (
    <Box sx={{ maxWidth: 760 }}>
      <Box
        sx={{
          border: "1px solid #EEF0F7",
          borderRadius: "16px",
          p: { xs: 2, md: 3 },
          backgroundColor: "#fff",
        }}
        className="for-dark-bottom-border"
      >
        <Typography sx={{ fontSize: "14px", color: "text.secondary", mb: 3 }}>
          Use the form below to update your password. Your new password must include uppercase, lowercase, a number, and a special character.
        </Typography>
        <ChangePasswordForm embedded />
      </Box>
    </Box>
  );

  const twoFactorMethods = [
    {
      key: "isTwoFactorEmailEnabled",
      verifiedKey: "isTwoFactorEmailVerified",
      title: "Authentication Using Email",
      description: user?.email
        ? `A one-time code will be sent to ${user.email} during sign-in.`
        : "A one-time code will be sent to your registered email address during sign-in.",
      icon: <EmailOutlinedIcon sx={{ fontSize: 22, color: "#0D6EFD" }} />,
      iconBg: "#E7F1FF",
      comingSoon: true,
    },
    {
      key: "isTwoFactorWhatsAppEnabled",
      verifiedKey: "isTwoFactorWhatsAppVerified",
      title: "Authentication Using WhatsApp",
      description: user?.phoneNumber
        ? `A one-time code will be sent via WhatsApp to ${user.phoneNumber} during sign-in.`
        : "A one-time code will be sent via WhatsApp to your registered mobile number during sign-in.",
      icon: <WhatsAppIcon sx={{ fontSize: 22, color: "#25D366" }} />,
      iconBg: "#E6F9EE",
    },
    {
      key: "isTwoFactorSmsEnabled",
      verifiedKey: "isTwoFactorSmsVerified",
      title: "Authentication Using Mobile Number SMS",
      description: user?.phoneNumber
        ? `A one-time code will be sent via SMS to ${user.phoneNumber} during sign-in.`
        : "A one-time code will be sent via SMS to your registered mobile number during sign-in.",
      icon: <SmsOutlinedIcon sx={{ fontSize: 22, color: "#7C3AED" }} />,
      iconBg: "#F1ECFE",
      comingSoon: true,
    },
    {
      key: "isTwoFactorAuthenticatorEnabled",
      verifiedKey: "isTwoFactorAuthenticatorVerified",
      title: "Authentication Using Google Authenticator",
      description:
        "Use Google Authenticator, Microsoft Authenticator, Authy, or any compatible TOTP app to generate a 6-digit code during sign-in.",
      icon: <PhoneAndroidOutlinedIcon sx={{ fontSize: 22, color: "#1F8E3D" }} />,
      iconBg: "#E6F4EA",
      supportsRemove: true,
    },
  ];

  const renderTwoFactorSection = () => {
    const enabledCount = twoFactorMethods.filter((m) => twoFactorSettings[m.key]).length;

    return (
      <Box sx={{ maxWidth: 760 }}>
        <Box
          sx={{
            border: "1px solid #EEF0F7",
            borderRadius: "16px",
            p: { xs: 2, md: 3 },
            mb: 3,
            background: "linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)",
          }}
          className="for-dark-bottom-border"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                backgroundColor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <SecurityOutlinedIcon sx={{ color: "#4338CA" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
                Two-Factor Authentication
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
                {enabledCount > 0
                  ? `${enabledCount} method${enabledCount > 1 ? "s" : ""} enabled`
                  : "No methods enabled"}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: "14px", color: "text.secondary" }}>
            Choose how you want to verify your identity when signing in. You can enable one or more
            methods below.
          </Typography>
        </Box>

        {twoFactorLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {twoFactorMethods.map((method) => {
              const enabled = !!twoFactorSettings[method.key];
              const verified = !!twoFactorSettings[method.verifiedKey];
              const isUpdating = twoFactorUpdatingKey === method.key;
              return (
                <Grid item xs={12} key={method.key}>
                  <Box
                    sx={{
                      border: "1px solid #EEF0F7",
                      borderRadius: "16px",
                      p: { xs: 2, md: 2.5 },
                      backgroundColor: method.comingSoon ? "#FAFAFA" : "#fff",
                      opacity: method.comingSoon ? 0.7 : 1,
                      display: "flex",
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                      gap: 2,
                      flexDirection: { xs: "column", sm: "row" },
                    }}
                    className="for-dark-bottom-border"
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: "12px",
                          backgroundColor: method.iconBg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {method.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
                            {method.title}
                          </Typography>
                          {method.comingSoon ? (
                            <Chip
                              size="small"
                              label="Coming Soon"
                              sx={{
                                backgroundColor: "#FFF3E0",
                                color: "#E65100",
                                fontWeight: 600,
                              }}
                            />
                          ) : (
                            <>
                              <Chip
                                size="small"
                                label={enabled ? "Enabled" : "Disabled"}
                                color={enabled ? "success" : "default"}
                                variant={enabled ? "filled" : "outlined"}
                              />
                              {verified ? (
                                <Chip
                                  size="small"
                                  icon={<VerifiedOutlinedIcon sx={{ fontSize: 16 }} />}
                                  label="Verified"
                                  color="primary"
                                  variant="outlined"
                                />
                              ) : (
                                <Chip
                                  size="small"
                                  label="Not verified"
                                  color="warning"
                                  variant="outlined"
                                />
                              )}
                            </>
                          )}
                        </Box>
                        <Typography
                          sx={{ fontSize: "13px", color: "text.secondary", mt: 0.5, wordBreak: "break-word" }}
                        >
                          {method.description}
                        </Typography>
                        {method.comingSoon ? (
                          <Typography sx={{ fontSize: "12px", color: "#E65100", mt: 0.5 }}>
                            This feature is not yet available. It will be enabled in a future update.
                          </Typography>
                        ) : (
                          !verified && (
                            <Typography sx={{ fontSize: "12px", color: "#B45309", mt: 0.5 }}>
                              You'll be asked to verify this channel before it can be enabled.
                            </Typography>
                          )
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, alignSelf: { xs: "flex-end", sm: "center" } }}>
                      {isUpdating && <CircularProgress size={18} />}
                      {method.supportsRemove && verified && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={openDisableAuthenticatorDialog}
                          disabled={isUpdating || twoFactorLoading}
                          sx={{ textTransform: "none", borderRadius: "8px" }}
                        >
                          Remove
                        </Button>
                      )}
                      <Switch
                        checked={method.comingSoon ? false : enabled}
                        disabled={method.comingSoon || isUpdating || twoFactorLoading}
                        onChange={(e) => handleTwoFactorToggle(method.key, e.target.checked)}
                        color="primary"
                        inputProps={{ "aria-label": method.title }}
                      />
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      <Card
        sx={{
          position: "relative",
          width: "100%",
          boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
          borderRadius: "20px",
          p: { xs: 2, md: 3 },
          mb: "20px",
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4} lg={3}>
            <Box
              sx={{
                border: "1px solid #EEF0F7",
                borderRadius: "20px",
                p: 2,
                backgroundColor: "#F8FAFC",
                position: { md: "sticky" },
                top: { md: 24 },
              }}
              className="for-dark-bottom-border"
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    overflow: "hidden",
                    backgroundColor: "#E2E8F0",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={profileImg || "/images/usertest.png"}
                    alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "16px", fontWeight: 700 }}>
                    {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User Profile" : "User Profile"}
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: "text.secondary", wordBreak: "break-word" }}>
                    {user?.email || "No email available"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {sections.map((section) => (
                  <Button
                    key={section.value}
                    fullWidth
                    onClick={() => {
                      setActiveSection(section.value);
                      if (section.value === "login-activities") {
                        setActivityPage(1);
                      }
                      if (router.isReady) {
                        router.replace(
                          { pathname: router.pathname, query: { ...router.query, section: section.value } },
                          undefined,
                          { shallow: true }
                        );
                      }
                    }}
                    startIcon={section.icon}
                    variant={activeSection === section.value ? "contained" : "text"}
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: "12px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2,
                      py: 1.3,
                      color: activeSection === section.value ? "#fff !important" : "#334155",
                      backgroundColor: activeSection === section.value ? undefined : "#fff",
                      border: activeSection === section.value ? "none" : "1px solid #E2E8F0",
                      "&:hover": {
                        backgroundColor: activeSection === section.value ? undefined : "#F1F5F9",
                      },
                    }}
                  >
                    {section.label}
                  </Button>
                ))}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={8} lg={9}>
            <Box sx={{ mb: 3 }}>
              <Typography component="h2" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 700, mb: 1 }}>
                {activeSectionDetails.label}
              </Typography>
              <Typography color="text.secondary">
                {activeSectionDetails.description}
              </Typography>
            </Box>

            {activeSection === "personal" && renderPersonalSection()}
            {activeSection === "devices" && renderDevicesSection()}
            {activeSection === "settings" && renderSettingsSection()}
            {activeSection === "login-activities" && renderLoginActivitiesSection()}
            {activeSection === "two-factor" && renderTwoFactorSection()}
          </Grid>
        </Grid>
      </Card>

      <Dialog
        open={verifyDialog.open}
        onClose={verifyDialog.sending || verifyDialog.verifying ? undefined : closeVerifyDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          {verifyDialog.locked ? "Verification Locked" : `Verify ${verifyDialog.label}`}
          <IconButton
            onClick={closeVerifyDialog}
            disabled={verifyDialog.sending || verifyDialog.verifying}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="small"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {verifyDialog.locked ? (
            <>
              <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                {verifyDialog.error || "Too many failed attempts. Please try again later."}
              </Alert>
              {verifyDialog.lockoutEndsAt && (() => {
                const endsAt = new Date(verifyDialog.lockoutEndsAt);
                if (isNaN(endsAt.getTime())) return null;
                const localTime = endsAt.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const localDate = endsAt.toLocaleDateString();
                const remainingMs = Math.max(0, endsAt.getTime() - Date.now());
                const remainingMin = Math.floor(remainingMs / 60000);
                const remainingSec = Math.floor((remainingMs % 60000) / 1000);
                const remainingLabel =
                  remainingMin > 0
                    ? `${remainingMin} min ${remainingSec.toString().padStart(2, "0")} sec`
                    : `${remainingSec} second${remainingSec === 1 ? "" : "s"}`;
                // Reference lockoutNowTick to keep this re-rendering every second
                // while the dialog is locked. The variable itself is unused.
                void lockoutNowTick;
                return (
                  <Box
                    sx={{
                      mb: 2,
                      p: 1.5,
                      borderRadius: "10px",
                      backgroundColor: "#FFF4F4",
                      border: "1px solid #F8C8C8",
                    }}
                  >
                    <Typography sx={{ fontSize: "13px", color: "#B71C1C", fontWeight: 600 }}>
                      You can try again at {localTime} ({localDate}).
                    </Typography>
                    {remainingMs > 0 && (
                      <Typography sx={{ fontSize: "12px", color: "#7F1D1D", mt: 0.25 }}>
                        Time remaining: {remainingLabel}
                      </Typography>
                    )}
                  </Box>
                );
              })()}
            </>
          ) : (
            <Typography sx={{ fontSize: "14px", color: "text.secondary", mb: 2 }}>
              To enable {verifyDialog.label} authentication, we need to verify your{" "}
              {verifyDialog.apiChannel === "Email" ? "email address" : "mobile number"}.
              {verifyDialog.sent
                ? " Enter the 6-digit code we just sent you."
                : " Click \"Send Code\" to receive a verification code."}
            </Typography>
          )}

          {verifyDialog.sent && verifyDialog.recipient && !verifyDialog.locked && (
            <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 2 }}>
              Code sent to: <strong>{verifyDialog.recipient}</strong>
            </Typography>
          )}

          {!verifyDialog.locked &&
            verifyDialog.error &&
            typeof verifyDialog.attemptsLeft === "number" && (
              <Alert
                severity={verifyDialog.attemptsLeft <= 1 ? "error" : "warning"}
                sx={{ mb: 2, borderRadius: "10px" }}
              >
                {verifyDialog.error}
                {typeof verifyDialog.maxAttempts === "number"
                  ? ` (${verifyDialog.attemptsLeft} of ${verifyDialog.maxAttempts} attempts remaining)`
                  : ` (${verifyDialog.attemptsLeft} attempt${verifyDialog.attemptsLeft === 1 ? "" : "s"} remaining)`}
              </Alert>
            )}

          {verifyDialog.sent && (
            <TextField
              fullWidth
              autoFocus
              label="Verification code"
              placeholder="Enter 6-digit code"
              value={verifyDialog.otp}
              onChange={(e) =>
                setVerifyDialog((prev) => ({
                  ...prev,
                  otp: e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !verifyDialog.locked) handleVerifyOtp();
              }}
              inputProps={{ inputMode: "numeric", maxLength: 6 }}
              error={
                !!verifyDialog.error &&
                !verifyDialog.locked &&
                typeof verifyDialog.attemptsLeft !== "number"
              }
              helperText={
                !verifyDialog.locked &&
                typeof verifyDialog.attemptsLeft !== "number" &&
                verifyDialog.error
                  ? verifyDialog.error
                  : " "
              }
              disabled={verifyDialog.verifying || verifyDialog.locked}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeVerifyDialog}
            disabled={verifyDialog.sending || verifyDialog.verifying}
            sx={{ textTransform: "none", color: "#475569" }}
          >
            {verifyDialog.locked ? "Close" : "Cancel"}
          </Button>

          {!verifyDialog.locked && (
            <>
              {!verifyDialog.sent ? (
                <Button
                  onClick={handleSendVerificationOtp}
                  variant="contained"
                  disabled={verifyDialog.sending}
                  startIcon={verifyDialog.sending ? <CircularProgress size={16} color="inherit" /> : null}
                  sx={{ textTransform: "none", color: "#fff !important" }}
                >
                  {verifyDialog.sending ? "Sending..." : "Send Code"}
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSendVerificationOtp}
                    disabled={verifyDialog.sending || verifyDialog.verifying}
                    sx={{ textTransform: "none" }}
                  >
                    Resend
                  </Button>
                  <Button
                    onClick={handleVerifyOtp}
                    variant="contained"
                    disabled={verifyDialog.verifying || verifyDialog.otp.length < 4}
                    startIcon={verifyDialog.verifying ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{ textTransform: "none", color: "#fff !important" }}
                  >
                    {verifyDialog.verifying ? "Verifying..." : "Verify & Enable"}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Self-service Edit Profile dialog */}
      <Dialog
        open={editProfileDialog.open}
        onClose={editProfileDialog.saving ? undefined : closeEditProfileDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Edit Profile
          <IconButton
            onClick={closeEditProfileDialog}
            disabled={editProfileDialog.saving}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="small"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 2 }}>
            Update your name, email, or mobile number. Changing your email or
            mobile will reset any matching two-factor authentication channel,
            and you will need to re-verify it.
          </Typography>

          {editProfileDialog.apiError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
              {editProfileDialog.apiError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                fullWidth
                size="small"
                value={editProfileDialog.firstName}
                onChange={handleEditProfileChange("firstName")}
                error={!!editProfileDialog.errors.firstName}
                helperText={editProfileDialog.errors.firstName || ""}
                disabled={editProfileDialog.saving}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                fullWidth
                size="small"
                value={editProfileDialog.lastName}
                onChange={handleEditProfileChange("lastName")}
                error={!!editProfileDialog.errors.lastName}
                helperText={editProfileDialog.errors.lastName || ""}
                disabled={editProfileDialog.saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                size="small"
                value={editProfileDialog.email}
                onChange={handleEditProfileChange("email")}
                error={!!editProfileDialog.errors.email}
                helperText={
                  editProfileDialog.errors.email
                  || (user?.email
                    && editProfileDialog.email.trim().toLowerCase() !== (user.email || "").toLowerCase()
                      ? "Changing email will sign you in with the new address next time and reset Email 2FA."
                      : "")
                }
                disabled={editProfileDialog.saving}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Mobile Number"
                fullWidth
                size="small"
                value={editProfileDialog.mobileNumber}
                onChange={handleEditProfileChange("mobileNumber")}
                error={!!editProfileDialog.errors.mobileNumber}
                helperText={
                  editProfileDialog.errors.mobileNumber
                  || (user?.phoneNumber
                    && editProfileDialog.mobileNumber.trim() !== (user.phoneNumber || "")
                      ? "Changing your mobile will reset WhatsApp and SMS 2FA verification."
                      : "")
                }
                disabled={editProfileDialog.saving}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeEditProfileDialog}
            disabled={editProfileDialog.saving}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveProfile}
            variant="contained"
            disabled={editProfileDialog.saving}
            startIcon={editProfileDialog.saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", color: "#fff !important" }}
          >
            {editProfileDialog.saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Google Authenticator (TOTP) setup dialog */}
      <Dialog
        open={authenticatorDialog.open}
        onClose={authenticatorDialog.verifying || authenticatorDialog.loading ? undefined : closeAuthenticatorDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Set up Google Authenticator
          <IconButton
            onClick={closeAuthenticatorDialog}
            disabled={authenticatorDialog.verifying || authenticatorDialog.loading}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="small"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {authenticatorDialog.loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Typography sx={{ fontSize: "14px", color: "text.secondary", mb: 2 }}>
                1. Open Google Authenticator (or Microsoft Authenticator / Authy) on
                your phone and scan the QR code below.
              </Typography>

              {authenticatorDialog.otpAuthUri && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 2,
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    mb: 2,
                  }}
                >
                  <QRCodeCanvas
                    value={authenticatorDialog.otpAuthUri}
                    size={184}
                    includeMargin
                    level="M"
                  />
                </Box>
              )}

              <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 1 }}>
                Can&apos;t scan? Enter this key manually:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1.25,
                  borderRadius: "10px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  mb: 2,
                  wordBreak: "break-all",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "13px",
                    fontWeight: 600,
                    flex: 1,
                    letterSpacing: "1px",
                  }}
                >
                  {authenticatorDialog.secretKey}
                </Typography>
                <IconButton
                  size="small"
                  onClick={handleCopyAuthenticatorSecret}
                  aria-label="Copy secret key"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography sx={{ fontSize: "14px", color: "text.secondary", mb: 1 }}>
                2. Enter the 6-digit code shown in the app to finish setup.
              </Typography>

              {authenticatorDialog.locked && authenticatorDialog.error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                  {authenticatorDialog.error}
                </Alert>
              )}

              {!authenticatorDialog.locked &&
                authenticatorDialog.error &&
                typeof authenticatorDialog.attemptsLeft === "number" && (
                  <Alert
                    severity={authenticatorDialog.attemptsLeft <= 1 ? "error" : "warning"}
                    sx={{ mb: 2, borderRadius: "10px" }}
                  >
                    {authenticatorDialog.error}
                    {typeof authenticatorDialog.maxAttempts === "number"
                      ? ` (${authenticatorDialog.attemptsLeft} of ${authenticatorDialog.maxAttempts} attempts remaining)`
                      : ` (${authenticatorDialog.attemptsLeft} attempt${authenticatorDialog.attemptsLeft === 1 ? "" : "s"} remaining)`}
                  </Alert>
                )}

              <TextField
                fullWidth
                autoFocus
                label="Authenticator code"
                placeholder="6-digit code"
                value={authenticatorDialog.code}
                onChange={handleAuthenticatorCodeChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !authenticatorDialog.locked) handleVerifyAuthenticatorSetup();
                }}
                inputProps={{
                  inputMode: "numeric",
                  maxLength: 8,
                  style: { letterSpacing: "0.4em", fontSize: 18, textAlign: "center" },
                }}
                error={
                  !!authenticatorDialog.error &&
                  !authenticatorDialog.locked &&
                  typeof authenticatorDialog.attemptsLeft !== "number"
                }
                helperText={
                  !authenticatorDialog.locked &&
                  typeof authenticatorDialog.attemptsLeft !== "number" &&
                  authenticatorDialog.error
                    ? authenticatorDialog.error
                    : " "
                }
                disabled={authenticatorDialog.verifying || authenticatorDialog.locked}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeAuthenticatorDialog}
            disabled={authenticatorDialog.verifying || authenticatorDialog.loading}
            sx={{ textTransform: "none", color: "#475569" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerifyAuthenticatorSetup}
            variant="contained"
            disabled={
              authenticatorDialog.loading ||
              authenticatorDialog.verifying ||
              authenticatorDialog.locked ||
              authenticatorDialog.code.length < 6
            }
            startIcon={
              authenticatorDialog.verifying ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ textTransform: "none", color: "#fff !important" }}
          >
            {authenticatorDialog.verifying ? "Verifying..." : "Verify & Enable"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Google Authenticator dialog – password confirmation */}
      <Dialog
        open={disableAuthenticatorDialog.open}
        onClose={closeDisableAuthenticatorDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 700 }}>
          Remove Google Authenticator
          <IconButton
            onClick={closeDisableAuthenticatorDialog}
            disabled={disableAuthenticatorDialog.submitting}
            sx={{ position: "absolute", right: 8, top: 8 }}
            size="small"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ fontSize: "14px", color: "text.secondary", mb: 2 }}>
            For your security, please confirm your password to remove Google
            Authenticator from this account. You will need to set it up again
            next time.
          </Typography>

          {disableAuthenticatorDialog.error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
              {disableAuthenticatorDialog.error}
            </Alert>
          )}

          <TextField
            fullWidth
            autoFocus
            label="Password"
            type="password"
            value={disableAuthenticatorDialog.password}
            onChange={(e) =>
              setDisableAuthenticatorDialog((prev) => ({
                ...prev,
                password: e.target.value,
                error: "",
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") handleDisableAuthenticatorSubmit();
            }}
            disabled={disableAuthenticatorDialog.submitting}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={closeDisableAuthenticatorDialog}
            disabled={disableAuthenticatorDialog.submitting}
            sx={{ textTransform: "none", color: "#475569" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDisableAuthenticatorSubmit}
            variant="contained"
            color="error"
            disabled={disableAuthenticatorDialog.submitting || !disableAuthenticatorDialog.password}
            startIcon={
              disableAuthenticatorDialog.submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{ textTransform: "none", color: "#fff !important" }}
          >
            {disableAuthenticatorDialog.submitting ? "Removing..." : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default PersonalInformation;
