import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Button, Chip, Pagination } from "@mui/material";
import Card from "@mui/material/Card";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";
import ChangePasswordForm from "@/components/Authentication/ChangePasswordForm";

const PersonalInformation = () => {
  const [profileImg, setProfileImg] = useState(null);
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [activeSection, setActiveSection] = useState("personal");
  const [activityPage, setActivityPage] = useState(1);
  const userEmail = typeof window !== "undefined" ? localStorage.getItem("user") : "";
  const ACTIVITY_PAGE_SIZE = 10;

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

  useEffect(() => {
    if (!userEmail) {
      return;
    }

    fetchUser();
    fetchDevices();
  }, []);

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

  const getLoginActivities = () => {
    const activities = [];

    devices.forEach((device) => {
      const deviceName = device.deviceName || "Unknown Device";
      const loginTime = device.createdOn;
      const lastActiveTime = device.updatedOn || device.createdOn;

      if (loginTime) {
        activities.push({
          id: `${device.id}-login`,
          type: "Login",
          deviceName,
          ipAddress: device.ipAddress || "N/A",
          timestamp: loginTime,
          isCurrentDevice: Boolean(device.isCurrentDevice),
        });
      }

      if (device.updatedOn && device.updatedOn !== device.createdOn) {
        activities.push({
          id: `${device.id}-active`,
          type: "Last Activity",
          deviceName,
          ipAddress: device.ipAddress || "N/A",
          timestamp: lastActiveTime,
          isCurrentDevice: Boolean(device.isCurrentDevice),
        });
      }
    });

    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
                <Typography fontSize="14px" color="text.secondary">
                  IP Address: {device.ipAddress || "N/A"}
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
    const loginActivities = getLoginActivities();
    const totalPages = Math.max(1, Math.ceil(loginActivities.length / ACTIVITY_PAGE_SIZE));
    const currentPage = Math.min(activityPage, totalPages);
    const startIndex = (currentPage - 1) * ACTIVITY_PAGE_SIZE;
    const paginatedActivities = loginActivities.slice(startIndex, startIndex + ACTIVITY_PAGE_SIZE);

    if (loginActivities.length === 0) {
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

    return (
      <Box
        sx={{
          border: "1px solid #EEF0F7",
          borderRadius: "16px",
          p: { xs: 2, md: 2.5 },
          backgroundColor: "#fff",
        }}
        className="for-dark-bottom-border"
      >
        <Box sx={{ display: "grid", gap: 1.5 }}>
          {paginatedActivities.map((activity) => (
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
                  color={activity.type === "Login" ? "primary" : "default"}
                  variant={activity.type === "Login" ? "filled" : "outlined"}
                />
                {activity.isCurrentDevice && (
                  <Chip size="small" label="Current Device" color="success" variant="outlined" />
                )}
              </Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600 }}>
                {activity.deviceName}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
                IP: {activity.ipAddress}
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
                Time: {formatDate(activity.timestamp)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, gap: 2, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>
            Showing {startIndex + 1}-{Math.min(startIndex + ACTIVITY_PAGE_SIZE, loginActivities.length)} of {loginActivities.length}
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            color="primary"
            size="small"
            onChange={(_, page) => setActivityPage(page)}
          />
        </Box>
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
          </Grid>
        </Grid>
      </Card>

    </Box>
  );
};

export default PersonalInformation;
