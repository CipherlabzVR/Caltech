import React, { useEffect, useState } from "react";
import usePaginationHandlers from "@/components/hooks/usePaginationHandlers";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import styles from "@/styles/PageTitle.module.css";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BASE_URL from "Base/api";
import { Search, StyledInputBase } from "@/styles/main/search-styles";
import AccessDenied from "@/components/UIElements/Permission/AccessDenied";
import IsPermissionEnabled from "@/components/utils/IsPermissionEnabled";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { parseApiDateForDisplay } from "@/components/utils/formatHelper";

function chunkFields(fields, size) {
  const chunks = [];
  for (let i = 0; i < fields.length; i += size) {
    chunks.push(fields.slice(i, i + size));
  }
  return chunks;
}

function normalizeDetailValue(value) {
  if (value === null || value === undefined) return "Not provided";
  const text = String(value).trim();
  return text === "" ? "Not provided" : text;
}

function DetailTable({ title, fields, pairsPerRow = 2 }) {
  const rows = chunkFields(fields, pairsPerRow);
  const headerColSpan = pairsPerRow * 2;
  return (
    <TableContainer component={Paper} sx={{ mb: 2, border: "1px solid #d6def5", borderRadius: 1.5, boxShadow: "none" }}>
      <Table size="small" sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell
              colSpan={headerColSpan}
              sx={{
                backgroundColor: "#3f51b5",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                py: 1,
              }}
            >
              {title}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={`${title}-row-${rowIndex}`}>
              {Array.from({ length: pairsPerRow }).map((_, idx) => {
                const field = row[idx];
                const displayValue = field ? normalizeDetailValue(field.value) : "";
                const isNotProvided = displayValue === "Not provided";
                return (
                  <React.Fragment key={`${title}-pair-${rowIndex}-${idx}`}>
                    <TableCell
                      sx={{
                        width: `${100 / headerColSpan}%`,
                        backgroundColor: "#e9edff",
                        color: "#2f3d74",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        py: 0.85,
                        borderBottom: "1px solid #e1e6fb",
                        verticalAlign: "top",
                      }}
                    >
                      {field?.label || ""}
                    </TableCell>
                    <TableCell
                      sx={{
                        width: `${100 / headerColSpan}%`,
                        backgroundColor: "#ffffff",
                        color: isNotProvided ? "text.disabled" : "#1f2937",
                        fontWeight: isNotProvided ? 400 : 500,
                        fontStyle: isNotProvided ? "italic" : "normal",
                        fontSize: "0.86rem",
                        py: 0.95,
                        borderBottom: "1px solid #eef1ff",
                        verticalAlign: "top",
                      }}
                    >
                      {displayValue}
                    </TableCell>
                  </React.Fragment>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function displayMatrimonialAccountTypeLabel(role) {
  const r = (role || "").trim();
  if (r === "Father" || r === "Mother") return "Parents";
  return r || "N/A";
}

/**
 * Reads the active Matchmaker tier (GOLD / DIAMOND) from address metadata for backoffice display.
 * Mirrors MatrimonialService.ParseMatchmakerTierToken on the server.
 * Returns null if the account is not a matchmaker, or has no active paid tier.
 */
function getActiveMatchmakerTierName(account) {
  if (!account) return null;
  const roleName = (account.userRoleName || account.UserRoleName || "").trim();
  if (roleName.toLowerCase() !== "matchmaker") return null;
  const meta = parseAddressMetadata(account.address || account.Address || "");
  const untilRaw = meta.MATCHMAKER_SUB_UNTIL;
  if (!untilRaw) return null;
  const until = new Date(untilRaw);
  if (Number.isNaN(until.getTime()) || until.getTime() < Date.now()) return null;
  const tier = String(meta.MATCHMAKER_TIER || "").toUpperCase();
  if (tier.includes("DIAMOND")) return "Diamond";
  if (tier.includes("GOLD")) return "Gold";
  return null;
}

/**
 * Custom package name from API / Address metadata.
 * System defaults (Free, Gold, Diamond, Premium) return null so those labels stay.
 */
function getCustomSubscriptionPackageName(account) {
  if (!account) return null;
  const fromApi = (account.subscriptionPackageName ?? account.SubscriptionPackageName ?? "").trim();
  if (fromApi) return fromApi;

  const meta = parseAddressMetadata(account.address || account.Address || "");
  const roleName = (account.userRoleName || account.UserRoleName || "").trim().toLowerCase();
  const isMatchmaker = roleName === "matchmaker";
  const name = (meta[isMatchmaker ? "MATCHMAKER_PACKAGE_NAME" : "SUBSCRIPTION_PACKAGE_NAME"] || "").trim();
  const key = (meta[isMatchmaker ? "MATCHMAKER_PACKAGE_KEY" : "SUBSCRIPTION_PACKAGE_KEY"] || "").trim();
  // Custom packages store a name without a system package key.
  if (name && !key) return name;
  return null;
}

/**
 * Subscription label + chip colour shown in the backoffice grid and details modal.
 * Defaults: Free / Gold / Diamond / Premium. Custom admin packages show their package name.
 */
function getMatrimonialSubscriptionDisplay(account, profile, isSubscribedFn) {
  const customName = getCustomSubscriptionPackageName(account);
  if (customName) {
    const roleName = (account?.userRoleName || account?.UserRoleName || "").trim().toLowerCase();
    return {
      label: customName,
      color: roleName === "matchmaker" ? "warning" : "success",
      variant: "filled",
    };
  }
  const tier = getActiveMatchmakerTierName(account);
  if (tier === "Gold") {
    return { label: "Gold", color: "warning", variant: "filled" };
  }
  if (tier === "Diamond") {
    return { label: "Diamond", color: "info", variant: "filled" };
  }
  if (isSubscribedFn(account, profile)) {
    return { label: "Premium", color: "success", variant: "filled" };
  }
  return { label: "Free", color: "default", variant: "outlined" };
}

function readMatrimonialSubscriptionIsLifetime(accountOrSub) {
  if (!accountOrSub) return false;
  if (accountOrSub.subscriptionIsLifetime === true || accountOrSub.SubscriptionIsLifetime === true) {
    return true;
  }
  const meta = parseAddressMetadata(accountOrSub.address || accountOrSub.Address || "");
  const roleName = (accountOrSub.userRoleName || accountOrSub.UserRoleName || "").trim();
  const isMatchmaker = roleName.toLowerCase() === "matchmaker";
  const lifetimeKey = isMatchmaker ? "MATCHMAKER_SUB_LIFETIME" : "SUBSCRIPTION_LIFETIME";
  return String(meta[lifetimeKey] || "").toLowerCase() === "true";
}

function readMatrimonialSubscriptionExpiresRaw(accountOrSub) {
  if (!accountOrSub) return null;
  const fromApi =
    accountOrSub.subscriptionExpiresAt ??
    accountOrSub.SubscriptionExpiresAt ??
    accountOrSub.subscriptionUntilUtc ??
    accountOrSub.SubscriptionUntilUtc;
  if (fromApi) return fromApi;
  const meta = parseAddressMetadata(accountOrSub.address || accountOrSub.Address || "");
  const roleName = (accountOrSub.userRoleName || accountOrSub.UserRoleName || "").trim();
  const isMatchmaker = roleName.toLowerCase() === "matchmaker";
  const untilKey = isMatchmaker ? "MATCHMAKER_SUB_UNTIL" : "SUBSCRIPTION_UNTIL";
  return meta[untilKey] || null;
}

function formatMatrimonialSubscriptionExpiry(accountOrSub, formatDateFn) {
  if (!accountOrSub) return "-";
  if (readMatrimonialSubscriptionIsLifetime(accountOrSub)) return "Lifetime";
  const raw = readMatrimonialSubscriptionExpiresRaw(accountOrSub);
  if (!raw) return "-";
  return formatDateFn(raw);
}

function normalizeMatrimonialPaymentTypeLabel(raw) {
  const lower = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (!lower) return null;
  if (lower === "bank" || lower === "banktransfer") return "Bank Transfer";
  if (lower === "card") return "Card";
  return String(raw).trim();
}

/** Payment type for premium accounts from GetAllMatrimonialUsers.SubscriptionPaymentType. */
function readMatrimonialPaymentType(account, profile) {
  if (!account) return null;
  const fromApi = normalizeMatrimonialPaymentTypeLabel(
    account.subscriptionPaymentType ?? account.SubscriptionPaymentType
  );
  if (fromApi) return fromApi;

  const meta = parseAddressMetadata(account.address || account.Address || "");
  const fromMeta = normalizeMatrimonialPaymentTypeLabel(
    meta.SUBSCRIPTION_PAYMENT_TYPE || meta.MATCHMAKER_PAYMENT_TYPE
  );
  if (fromMeta) return fromMeta;

  if (!isMatrimonialSubscriptionActive(account, profile) && !getCustomSubscriptionPackageName(account)) {
    return null;
  }
  return null;
}

/** Matches Matrimonial subscription display: Self (IsSubscriptionActive) + paid Matchmaker (MATCHMAKER_TIER / MATCHMAKER_SUB_UNTIL). */
function parseAddressMetadata(address) {
  if (!address || typeof address !== "string") return {};
  const dict = {};
  address.split(";").forEach((segment) => {
    const idx = segment.indexOf(":");
    if (idx === -1) return;
    const key = segment.slice(0, idx).trim();
    const value = segment.slice(idx + 1).trim();
    if (key) dict[key] = value;
  });
  return dict;
}

/**
 * Paid Matchmaker tier lives in Address metadata (MatrimonialService: MATCHMAKER_TIER + MATCHMAKER_SUB_UNTIL),
 * not SUBSCRIPTION_ACTIVE / UserRoleName "premium". Without this, Gold/Diamond matchmakers show as Free in the grid.
 */
function isMatchmakerPaidSubscriptionActive(account) {
  if (!account) return false;
  const roleName = (account.userRoleName || account.UserRoleName || "").trim();
  if (roleName.toLowerCase() !== "matchmaker") return false;
  const addr = account.address || account.Address || "";
  const meta = parseAddressMetadata(addr);
  const untilRaw = meta.MATCHMAKER_SUB_UNTIL;
  if (!untilRaw) return false;
  const until = new Date(untilRaw);
  if (Number.isNaN(until.getTime()) || until.getTime() < Date.now()) return false;
  const tier = String(meta.MATCHMAKER_TIER || "").toUpperCase();
  return tier.includes("GOLD") || tier.includes("DIAMOND");
}

function isMatrimonialSubscriptionActive(account, profile) {
  if (!account) return false;
  if (isMatchmakerPaidSubscriptionActive(account)) return true;
  const roleName = account.userRoleName || account.UserRoleName || "";
  if (
    roleName &&
    (roleName.toLowerCase().includes("premium") ||
      roleName.toLowerCase().includes("subscribed"))
  ) {
    return true;
  }
  const addr = account.address || account.Address || "";
  const meta = parseAddressMetadata(addr);
  const activeFlag = meta.SUBSCRIPTION_ACTIVE;
  if (activeFlag && String(activeFlag).toLowerCase() === "true") return true;
  const untilRaw = meta.SUBSCRIPTION_UNTIL;
  if (untilRaw) {
    const until = new Date(untilRaw);
    if (!Number.isNaN(until.getTime()) && until.getTime() >= Date.now()) return true;
  }
  if (addr.includes("SUBSCRIPTION_ACTIVE:true") || addr.includes("SUBSCRIPTION_ACTIVE=true")) {
    return true;
  }
  if (profile?.IsSubscribed || profile?.isSubscribed) return true;
  return false;
}

/** ApiResponse wraps PagedResult; JSON may be camelCase or PascalCase. */
function extractMatrimonialUserPage(data) {
  const wrap = data?.result ?? data?.Result;
  if (!wrap) return { items: [], total: 0 };
  const pageInner = wrap.items !== undefined || wrap.Items !== undefined ? wrap : wrap.result ?? wrap.Result ?? wrap;
  const items = pageInner?.items ?? pageInner?.Items ?? [];
  const total = Number(pageInner?.totalCount ?? pageInner?.TotalCount ?? 0) || 0;
  return { items: Array.isArray(items) ? items : [], total };
}

/** Full matrimonial profile blocks (shared by primary account and sub-accounts). */
function MatrimonialProfileFields({ profile }) {
  if (!profile) return null;
  const readValue = (...values) => {
    const v = values.find((x) => {
      if (x === null || x === undefined) return false;
      const t = String(x).trim();
      return t !== "" && t !== "-";
    });
    return v !== undefined ? String(v).trim() : undefined;
  };

  /** Optional text (ethnicity, caste, remarks, etc.): show "-" when empty. */
  const readOptionalDash = (...values) => {
    const v = values.find((x) => x !== null && x !== undefined);
    if (v === undefined) return "-";
    const t = String(v).trim();
    if (t === "" || t === "-") return "-";
    return t;
  };

  const ageRangeMin = profile.PartnerMinAge ?? profile.partnerMinAge;
  const ageRangeMax = profile.PartnerMaxAge ?? profile.partnerMaxAge;
  const ageRange = ageRangeMin || ageRangeMax ? `${ageRangeMin || "-"} - ${ageRangeMax || "-"}` : "Not provided";

  return (
    <Box sx={{ mt: 0.5 }}>
      <DetailTable
        title="Personal Details"
        fields={[
          { label: "Gender", value: readValue(profile.Gender, profile.gender) },
          { label: "Height", value: readValue(profile.Height, profile.height) },
          { label: "Complexion", value: readValue(profile.Complexion, profile.complexion) },
          { label: "Religion", value: readValue(profile.Religion, profile.religion) },
          { label: "Marital Status", value: readValue(profile.MaritalStatus, profile.maritalStatus) },
          { label: "Qualification", value: readValue(profile.QualificationLevel, profile.qualificationLevel) },
          { label: "Occupation", value: readValue(profile.Occupation, profile.occupation) },
          { label: "Horoscope", value: readValue(profile.Horoscope, profile.horoscope) },
          { label: "Remarks", value: readOptionalDash(profile.Remarks, profile.remarks) },
        ]}
        pairsPerRow={2}
      />

      <DetailTable
        title="Location"
        fields={[
          { label: "Country of Origin", value: readValue(profile.CountryOfOrigin, profile.countryOfOrigin) },
          { label: "Country of Residence", value: readValue(profile.CountryOfResidence, profile.countryOfResidence) },
          { label: "City", value: readValue(profile.CityOfResidence, profile.cityOfResidence) },
          { label: "Residency Status", value: readValue(profile.ResidencyStatus, profile.residencyStatus) },
        ]}
        pairsPerRow={2}
      />

      <DetailTable
        title="Habits"
        fields={[
          { label: "Eating", value: readValue(profile.EatingHabits, profile.eatingHabits) },
          { label: "Drinking", value: readValue(profile.DrinkingHabits, profile.drinkingHabits) },
          { label: "Smoking", value: readValue(profile.SmokingHabits, profile.smokingHabits) },
          { label: "Hobbies", value: readValue(profile.Hobbies, profile.hobbies) },
        ]}
        pairsPerRow={2}
      />

      <DetailTable
        title="Parents"
        fields={[
          { label: "Father", value: readValue(profile.FatherName, profile.fatherName) },
          { label: "Father Country of Residence", value: readValue(profile.FatherCountryOfResidence, profile.fatherCountryOfResidence) },
          { label: "Father Occupation", value: readValue(profile.FatherOccupation, profile.fatherOccupation) },
          { label: "Father Ethnicity", value: readOptionalDash(profile.FatherEthnicity, profile.fatherEthnicity) },
          { label: "Father Religion", value: readValue(profile.FatherReligion, profile.fatherReligion) },
          { label: "Father Caste", value: readOptionalDash(profile.FatherCaste, profile.fatherCaste) },
          { label: "Father Remarks", value: readOptionalDash(profile.FatherRemarks, profile.fatherRemarks) },
          { label: "Mother", value: readValue(profile.MotherName, profile.motherName) },
          { label: "Mother Country of Residence", value: readValue(profile.MotherCountryOfResidence, profile.motherCountryOfResidence) },
          { label: "Mother Occupation", value: readValue(profile.MotherOccupation, profile.motherOccupation) },
          { label: "Mother Ethnicity", value: readOptionalDash(profile.MotherEthnicity, profile.motherEthnicity) },
          { label: "Mother Religion", value: readValue(profile.MotherReligion, profile.motherReligion) },
          { label: "Mother Caste", value: readOptionalDash(profile.MotherCaste, profile.motherCaste) },
          { label: "Mother Remarks", value: readOptionalDash(profile.MotherRemarks, profile.motherRemarks) },
        ]}
        pairsPerRow={2}
      />

      <DetailTable
        title="Partner Preferences"
        fields={[
          { label: "Age Range", value: ageRange },
          { label: "Eating Habits", value: readOptionalDash(profile.PartnerEatingHabits, profile.partnerEatingHabits) },
          { label: "Drinking Habits", value: readOptionalDash(profile.PartnerDrinkingHabits, profile.partnerDrinkingHabits) },
          { label: "Smoking Habits", value: readOptionalDash(profile.PartnerSmokingHabits, profile.partnerSmokingHabits) },
          { label: "Religion", value: readValue(profile.PartnerReligion, profile.partnerReligion) },
          { label: "Ethnicity", value: readOptionalDash(profile.PartnerEthnicity, profile.partnerEthnicity) },
          { label: "Qualification", value: readValue(profile.PartnerQualificationLevel, profile.partnerQualificationLevel) },
          { label: "Additional Requirements", value: readValue(profile.PartnerAdditionalRequirements, profile.partnerAdditionalRequirements) },
        ]}
        pairsPerRow={2}
      />

      {(profile.ProfilePhoto || profile.profilePhoto || profile.ProfilePhotoFromProfile || profile.profilePhotoFromProfile) && (
        <TableContainer component={Paper} sx={{ mb: 1.5, border: "1px solid #d6def5", borderRadius: 1.5, boxShadow: "none" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: "#3f51b5", color: "#fff", fontWeight: 700, fontSize: "0.95rem", py: 1 }}>
                  Profile Photo
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ backgroundColor: "#fff", py: 1.5 }}>
                  <Box
                    component="img"
                    src={profile.ProfilePhotoFromProfile || profile.profilePhotoFromProfile || profile.ProfilePhoto || profile.profilePhoto}
                    alt="Profile"
                    sx={{
                      width: { xs: "100%", sm: 260 },
                      maxHeight: 300,
                      borderRadius: 1.5,
                      objectFit: "cover",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

/** Must match SidebarData Matrimonial → Registered Accounts categoryId. */
const MATRIMONIAL_CATEGORY_REGISTERED_ACCOUNTS = 172;

export default function MatrimonialAccounts() {
  const { navigate, create, update, remove, print, permissionsLoading } = IsPermissionEnabled(
    MATRIMONIAL_CATEGORY_REGISTERED_ACCOUNTS
  );
  const [accountsList, setAccountsList] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedSubscription, setSelectedSubscription] = useState("all");
  const [selectedAccountType, setSelectedAccountType] = useState("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState("all");
  const [registeredFromDate, setRegisteredFromDate] = useState("");
  const [registeredToDate, setRegisteredToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [subAccountDetails, setSubAccountDetails] = useState([]);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMatrimonialAccounts = async (
    currentPage = page,
    currentRowsPerPage = rowsPerPage,
    currentSearch = searchTerm,
    currentGender = selectedGender,
    currentSubscription = selectedSubscription,
    currentAccountType = selectedAccountType,
    currentPaymentType = selectedPaymentType,
    currentRegisteredFrom = registeredFromDate,
    currentRegisteredTo = registeredToDate
  ) => {
    setLoading(true);
    try {
      const size = Math.max(1, Number(currentRowsPerPage) || 10);
      const skipCount = currentPage * size;
      const searchValue = currentSearch?.trim() ? encodeURIComponent(currentSearch.trim()) : "null";
      const filterParts = [
        `gender:${currentGender || "all"}`,
        `subscription:${currentSubscription || "all"}`,
        `accountType:${currentAccountType || "all"}`,
        `paymentType:${currentPaymentType || "all"}`,
      ];
      if (currentRegisteredFrom) filterParts.push(`registeredFrom:${currentRegisteredFrom}`);
      if (currentRegisteredTo) filterParts.push(`registeredTo:${currentRegisteredTo}`);
      const filterValue = encodeURIComponent(filterParts.join(";"));
      const response = await fetch(
        `${BASE_URL}/User/GetAllMatrimonialUsers?SkipCount=${skipCount}&MaxResultCount=${size}&Search=${searchValue}&Filter=${filterValue}`,
        {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const data = await response.json();
      const { items, total } = extractMatrimonialUserPage(data);
      setAccountsList(items);
      setTotalCount(total);
    } catch (error) {
      console.error("Error fetching matrimonial accounts:", error);
      toast.error("Failed to fetch matrimonial accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sessionStorage.setItem("category", String(MATRIMONIAL_CATEGORY_REGISTERED_ACCOUNTS));
  }, []);

  useEffect(() => {
    if (permissionsLoading || !navigate) return;
    fetchMatrimonialAccounts(
      page,
      rowsPerPage,
      searchTerm,
      selectedGender,
      selectedSubscription,
      selectedAccountType,
      selectedPaymentType,
      registeredFromDate,
      registeredToDate
    );
  }, [permissionsLoading, navigate, page, rowsPerPage, searchTerm, selectedGender, selectedSubscription, selectedAccountType, selectedPaymentType, registeredFromDate, registeredToDate]);

  const {
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleChangePage,
    handleChangeRowsPerPage,
  } = usePaginationHandlers({
    page,
    pageSize: rowsPerPage,
    totalCount,
    search: searchTerm,
    setPage,
    setPageSize: setRowsPerPage,
    onSearchValueChange: setSearchTerm,
    zeroBasedPage: true,
    onFetch: () => {},
  });

  const handleViewDetails = async (account) => {
    setSelectedAccount(account);
    setSelectedProfile(null);
    setSubAccountDetails([]);
    setViewDialogOpen(true);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [profileRes, subRes] = await Promise.all([
        fetch(`${BASE_URL}/Matrimonial/GetProfile?userId=${account.id}`, {
          method: "GET",
          headers,
        }),
        fetch(`${BASE_URL}/Matrimonial/GetSubAccounts?parentUserId=${account.id}`, {
          method: "GET",
          headers,
        }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        const main = data.result ?? data.Result;
        if (main) setSelectedProfile(main);
      }

      let subs = [];
      if (subRes.ok) {
        const subData = await subRes.json();
        subs = subData.result ?? subData.Result ?? [];
      }

      const details = await Promise.all(
        (subs || []).map(async (sub) => {
          const id = sub.id ?? sub.Id;
          try {
            const r = await fetch(`${BASE_URL}/Matrimonial/GetProfile?userId=${id}`, {
              method: "GET",
              headers,
            });
            if (r.ok) {
              const d = await r.json();
              const prof = d.result ?? d.Result ?? null;
              return { sub, profile: prof };
            }
          } catch (e) {
            console.error("Error fetching sub-account profile:", e);
          }
          return { sub, profile: null };
        })
      );
      setSubAccountDetails(details);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedAccount(null);
    setSelectedProfile(null);
    setSubAccountDetails([]);
  };

  const isSubscribed = (account, profile) => isMatrimonialSubscriptionActive(account, profile);

  // Delete Handlers
  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${BASE_URL}/User/DeleteUser?id=${accountToDelete.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchMatrimonialAccounts(); // Refresh list
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
      handleCloseDeleteDialog();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = parseApiDateForDisplay(dateString);
      if (!date) return "-";
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  const readApprovedDate = (account) =>
    account?.subscriptionApprovedOn ?? account?.SubscriptionApprovedOn ?? null;

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    try {
      const birthDate = new Date(dateOfBirth);
      if (Number.isNaN(birthDate.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age < 0 ? null : age;
    } catch (error) {
      return null;
    }
  };

  /**
   * Always prefer a live age derived from the date of birth so it stays correct as
   * time passes. The stored `age` column is only a fallback when no DOB is available.
   */
  const displayAge = (dateOfBirth, storedAge) => {
    const live = calculateAge(dateOfBirth);
    if (live != null) return live;
    return storedAge != null && storedAge !== "" ? storedAge : "-";
  };

  const paginatedData = accountsList;

  if (permissionsLoading) {
    return null;
  }

  if (!navigate) {
    return <AccessDenied />;
  }

  return (
    <>
      <div className={styles.pageTitle}>
        <h1>Matrimonial Accounts</h1>
        <ul>
          <li>
            <Link href="/matrimonial/matrimonial/">Matrimonial</Link>
          </li>
        </ul>
      </div>

      <Grid
        container
        rowSpacing={1}
        columnSpacing={{ xs: 1, sm: 1, md: 1, lg: 1, xl: 2 }}
      >
        <Grid item xs={12} order={{ xs: 2, lg: 1 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <FormControl sx={{ flex: "1 1 190px", minWidth: 190 }}>
                <InputLabel id="gender-filter-label">Gender</InputLabel>
                <Select
                  labelId="gender-filter-label"
                  id="gender-filter"
                  label="Gender"
                  value={selectedGender}
                  onChange={(e) => {
                    setSelectedGender(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Genders</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: "1 1 190px", minWidth: 190 }}>
                <InputLabel id="subscription-filter-label">Subscription</InputLabel>
                <Select
                  labelId="subscription-filter-label"
                  id="subscription-filter"
                  label="Subscription"
                  value={selectedSubscription}
                  onChange={(e) => {
                    setSelectedSubscription(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="free">Free</MenuItem>
                  <MenuItem value="subscribed">Subscribed</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: "1 1 210px", minWidth: 210 }}>
                <InputLabel id="account-type-filter-label">Account Type</InputLabel>
                <Select
                  labelId="account-type-filter-label"
                  id="account-type-filter"
                  label="Account Type"
                  value={selectedAccountType}
                  onChange={(e) => {
                    setSelectedAccountType(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="Self">Self</MenuItem>
                  <MenuItem value="Parents">Parents</MenuItem>
                  <MenuItem value="Relation">Relation</MenuItem>
                  <MenuItem value="Matchmaker">Matchmaker</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ flex: "1 1 190px", minWidth: 190 }}>
                <InputLabel id="payment-type-filter-label">Payment Type</InputLabel>
                <Select
                  labelId="payment-type-filter-label"
                  id="payment-type-filter"
                  label="Payment Type"
                  value={selectedPaymentType}
                  onChange={(e) => {
                    setSelectedPaymentType(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Payment Types</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="bank">Bank Transfer</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Registered from"
                type="date"
                size="small"
                value={registeredFromDate}
                onChange={(e) => {
                  setRegisteredFromDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: "1 1 160px", minWidth: 150 }}
              />
              <TextField
                label="Registered to"
                type="date"
                size="small"
                value={registeredToDate}
                onChange={(e) => {
                  setRegisteredToDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: "1 1 160px", minWidth: 150 }}
              />
            </Box>

            <Box sx={{ width: "100%", maxWidth: 480 }}>
              <Search className="search-form">
                <StyledInputBase
                  placeholder="Search by name, email, phone, or NIC..."
                  inputProps={{ "aria-label": "search" }}
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </Search>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} order={{ xs: 3, lg: 2 }}>
          <TableContainer component={Paper}>
            <Table aria-label="matrimonial accounts table" className="dark-table">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>NIC/Passport</TableCell>
                  <TableCell>Date of Birth</TableCell>
                  <TableCell>Age</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Residence Country</TableCell>
                  <TableCell>Account Type</TableCell>
                  <TableCell align="center">Subscription</TableCell>
                  <TableCell>Payment Type</TableCell>
                  <TableCell>Subscription Expires</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registered Date</TableCell>
                  <TableCell>Approved Date</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={17} align="center">
                      <Typography>Loading...</Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell component="th" scope="row" colSpan={17}>
                        <Typography color="error">
                          No Matrimonial Accounts Found
                        </Typography>
                      </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((account, index) => (
                    <TableRow
                      key={account.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {page * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {account.firstName} {account.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{account.userName || "-"}</Typography>
                          {account.isEmailVerified ? (
                            <Chip
                              label="Verified"
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                mt: 0.5,
                              }}
                            />
                          ) : (
                            <Chip
                              label="Not Verified"
                              color="warning"
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 20,
                                fontSize: "0.7rem",
                                fontWeight: 600,
                                mt: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{account.phoneNumber || "-"}</TableCell>
                      <TableCell>{account.identityDocument || "-"}</TableCell>
                      <TableCell>
                        {formatDate(account.dateofBirth)}
                      </TableCell>
                      <TableCell>
                        {displayAge(account.dateofBirth, account.age)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.gender || account.Gender || "N/A"}
                          size="small"
                          variant="outlined"
                          color={(account.gender || account.Gender) ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220 }}>
                          {(account.countryOfResidence || account.CountryOfResidence || "").trim() || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={displayMatrimonialAccountTypeLabel(account.userRoleName || account.UserRoleName)}
                          size="small"
                          variant="outlined"
                          color={
                            (account.userRoleName || account.UserRoleName || "") === "Matchmaker"
                              ? "secondary"
                              : "primary"
                          }
                          sx={{ fontSize: "0.7rem", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          const sub = getMatrimonialSubscriptionDisplay(account, null, isSubscribed);
                          return (
                            <Chip
                              label={sub.label}
                              color={sub.color}
                              size="small"
                              variant={sub.variant}
                              sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const paymentType = readMatrimonialPaymentType(account);
                          if (!paymentType) {
                            return (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            );
                          }
                          return (
                            <Chip
                              label={paymentType}
                              size="small"
                              color={paymentType === "Bank Transfer" ? "secondary" : "info"}
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatMatrimonialSubscriptionExpiry(account, formatDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={account.status === 1 ? "Active" : "Inactive"}
                          color={account.status === 1 ? "success" : "default"}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(account.createdAt)}</TableCell>
                      <TableCell>{formatDate(readApprovedDate(account))}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            aria-label="view details"
                            onClick={() => handleViewDetails(account)}
                          >
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            aria-label="delete"
                            onClick={() => handleDeleteClick(account)}
                          >
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Grid container justifyContent="space-between" alignItems="center" mt={2} mb={2}>
            <Pagination
              count={Math.max(1, Math.ceil(totalCount / rowsPerPage))}
              page={page + 1}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
            />
            <FormControl size="small" sx={{ mr: 2, width: "100px" }}>
              <InputLabel>Page Size</InputLabel>
              <Select value={rowsPerPage} label="Page Size" onChange={handleChangeRowsPerPage}>
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>

      {/* View Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Account Details
            </Typography>
            {selectedAccount && (
              <Typography variant="body2" color="text.secondary">
                {(selectedAccount.firstName || "").trim()} {(selectedAccount.lastName || "").trim()}{" "}
                {selectedAccount.id ? `· User ID ${selectedAccount.id}` : ""}
              </Typography>
            )}
          </Box>
          {selectedAccount && (
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={isSubscribed(selectedAccount, selectedProfile) ? "Subscribed" : "Not Subscribed"}
                color={isSubscribed(selectedAccount, selectedProfile) ? "success" : "default"}
                size="small"
                variant={isSubscribed(selectedAccount, selectedProfile) ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700,
                  borderRadius: "999px",
                  px: 0.75,
                  height: 28,
                  "& .MuiChip-label": { px: 1.25 },
                  ...(isSubscribed(selectedAccount, selectedProfile)
                    ? { boxShadow: "0 1px 3px rgba(16,185,129,0.35)" }
                    : {
                        color: "#4b5563",
                        borderColor: "#cbd5e1",
                        backgroundColor: "#f8fafc",
                      }),
                }}
              />
              <Chip
                label={selectedAccount.status === 1 ? "Active" : "Inactive"}
                color={selectedAccount.status === 1 ? "success" : "default"}
                size="small"
                variant={selectedAccount.status === 1 ? "filled" : "outlined"}
                sx={{
                  fontWeight: 700,
                  borderRadius: "999px",
                  px: 0.75,
                  height: 28,
                  "& .MuiChip-label": { px: 1.25 },
                  ...(selectedAccount.status === 1
                    ? { boxShadow: "0 1px 3px rgba(16,185,129,0.35)" }
                    : {
                        color: "#6b7280",
                        borderColor: "#d1d5db",
                        backgroundColor: "#f9fafb",
                      }),
                }}
              />
            </Box>
          )}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            px: { xs: 2, md: 3 },
            py: 2.25,
            backgroundColor: "#fff",
          }}
        >
          {selectedAccount && (
            <>
              {/* Basic Account Info */}
              <DetailTable
                title="Account Information"
                fields={[
                  { label: "Full Name", value: `${selectedAccount.firstName || ""} ${selectedAccount.lastName || ""}`.trim() },
                  { label: "Email", value: selectedAccount.userName },
                  { label: "Phone", value: selectedAccount.phoneNumber },
                  { label: "NIC / Passport", value: selectedAccount.identityDocument },
                  { label: "Date of Birth", value: formatDate(selectedAccount.dateofBirth) },
                  { label: "Age", value: displayAge(selectedAccount.dateofBirth, selectedAccount.age) },
                  { label: "Gender", value: selectedAccount.gender || selectedAccount.Gender },
                  {
                    label: "Country of Residence",
                    value:
                      selectedAccount.countryOfResidence ||
                      selectedAccount.CountryOfResidence ||
                      selectedProfile?.countryOfResidence ||
                      selectedProfile?.CountryOfResidence,
                  },
                  { label: "Account Type", value: displayMatrimonialAccountTypeLabel(selectedAccount.userRoleName || selectedAccount.UserRoleName) },
                  { label: "Email Verification", value: selectedAccount.isEmailVerified ? "Verified" : "Not Verified" },
                  {
                    label: "Subscription",
                    value: getMatrimonialSubscriptionDisplay(selectedAccount, selectedProfile, isSubscribed).label,
                  },
                  {
                    label: "Payment Type",
                    value: readMatrimonialPaymentType(selectedAccount, selectedProfile) || "—",
                  },
                  {
                    label: "Subscription Expires",
                    value: formatMatrimonialSubscriptionExpiry(selectedAccount, formatDate),
                  },
                  { label: "Account Status", value: selectedAccount.status === 1 ? "Active" : "Inactive" },
                  { label: "Registered On", value: formatDate(selectedAccount.createdAt) },
                  {
                    label: "Approved Date",
                    value: formatDate(readApprovedDate(selectedAccount)),
                  },
                ]}
                pairsPerRow={2}
              />

              {/* Primary profile + sub-accounts */}
              {profileLoading ? (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>Loading profile details...</Typography>
              ) : (
                <>
                  <Box sx={{ mb: 2.25 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.25 }}>
                      Primary Profile
                    </Typography>
                    {selectedProfile ? (
                      <MatrimonialProfileFields profile={selectedProfile} />
                    ) : (
                      <Typography color="text.secondary" sx={{ py: 0.75 }}>
                        No detailed profile found for this account.
                      </Typography>
                    )}
                  </Box>

                  {subAccountDetails.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ mb: 0.75, fontWeight: 700 }}>
                        Sub-accounts ({subAccountDetails.length})
                      </Typography>
                      <Typography variant="body2" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                        Linked profiles created under this parent account (same as on the website).
                      </Typography>
                      {subAccountDetails.map(({ sub, profile }) => {
                        const sid = sub.id ?? sub.Id;
                        const firstName = sub.firstName ?? sub.FirstName ?? "";
                        const lastName = sub.lastName ?? sub.LastName ?? "";
                        const email = sub.email ?? sub.Email ?? "-";
                        const phone = sub.phoneNumber ?? sub.PhoneNumber ?? "-";
                        const dob = sub.dateofBirth ?? sub.DateofBirth ?? sub.dateOfBirth ?? sub.DateOfBirth;
                        const age = sub.age ?? sub.Age;
                        const statusVal = sub.status ?? sub.Status;
                        const photo = sub.profilePhoto ?? sub.ProfilePhoto;
                        const accountType = sub.userRoleName ?? sub.UserRoleName ?? null;
                        const gender = profile?.Gender ?? profile?.gender ?? "Not provided";
                        const residenceCountry =
                          profile?.CountryOfResidence ?? profile?.countryOfResidence ?? "Not provided";
                        const subSubscription = getMatrimonialSubscriptionDisplay(sub, profile, isSubscribed);
                        const subExpires = formatMatrimonialSubscriptionExpiry(sub, formatDate);
                        return (
                          <Accordion
                            key={sid}
                            disableGutters
                            sx={{
                              mb: 1.25,
                              "&:before": { display: "none" },
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                              backgroundColor: "background.paper",
                            }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" width="100%">
                                {photo ? (
                                  <Box
                                    component="img"
                                    src={photo}
                                    alt=""
                                    sx={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                                  />
                                ) : null}
                                <Box>
                                  <Typography fontWeight={600}>
                                    {firstName} {lastName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {email} · User ID {sid}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={subSubscription.label}
                                  color={subSubscription.color}
                                  variant={subSubscription.variant}
                                />
                                <Chip
                                  size="small"
                                  label={statusVal === 1 ? "Active" : "Inactive"}
                                  color={statusVal === 1 ? "success" : "default"}
                                  sx={{ ml: "auto" }}
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <DetailTable
                                title="Sub-account Information"
                                fields={[
                                  { label: "Email", value: email },
                                  { label: "Phone", value: phone },
                                  { label: "Date of Birth", value: dob ? formatDate(dob) : "Not provided" },
                                  { label: "Age", value: displayAge(dob, age) },
                                  { label: "Account Type", value: accountType },
                                  { label: "Gender", value: gender },
                                  { label: "Country of Residence", value: residenceCountry },
                                  {
                                    label: "Subscription",
                                    value: subSubscription.label,
                                  },
                                  {
                                    label: "Payment Type",
                                    value: readMatrimonialPaymentType(sub, profile) || "—",
                                  },
                                  {
                                    label: "Subscription Expires",
                                    value: subExpires,
                                  },
                                  { label: "Status", value: statusVal === 1 ? "Active" : "Inactive" },
                                ]}
                                pairsPerRow={2}
                              />
                              {profile ? (
                                <MatrimonialProfileFields profile={profile} />
                              ) : (
                                <Typography color="text.secondary" variant="body2">No matrimonial profile completed for this sub-account.</Typography>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog} color="primary" variant="contained" sx={{ minWidth: 110, borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the account for <strong>{accountToDelete?.firstName} {accountToDelete?.lastName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary" disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {typeof window !== "undefined" && (
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      )}
    </>
  );
}

