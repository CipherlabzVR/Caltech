import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, Grid } from "@mui/material";
import Card from "@mui/material/Card";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import BASE_URL from "Base/api";
import { toast } from "react-toastify";

const PersonalInformation = () => {
  const [profileImg, setProfileImg] = useState(null);
  const [user, setUser] = useState(null);
  const userEmail = localStorage.getItem("user");

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

  useEffect(() => {
    fetchUser();
  }, []);

  const personalInfo = [
    { title: "Full Name :", text: user ? user.firstName + " " + user.lastName : "" },
    { title: "Mobile :", text: user ? user.phoneNumber : "" },
    { title: "Email :", text: user ? user.email : "" },
    { title: "Location :", text: user ? user.address : "" },
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("UserId", user.id);
    formData.append("ProfileImage", file);
    await uploadFile(formData);
  };

  const handleImageRemove = async () => {
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

  return (
    <Box sx={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
      <Card sx={{ position: "relative", width: "100%", boxShadow: "0px 2px 10px rgba(0,0,0,0.08)", borderRadius: "16px", p: "25px", mb: "20px" }}>
        <Grid container>
          <Grid item xs={6}>
            <Box sx={{ position: "relative", width: 150, height: 150, borderRadius: "20px", overflow: "hidden", border: "4px solid white", boxShadow: "0px 4px 12px rgba(0,0,0,0.15)", background: "#f5f5f5" }}>
              <img src={profileImg || "/images/usertest.png"} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <Box sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", bgcolor: "rgba(0,0,0,0.4)", opacity: 0, display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.3s", cursor: "pointer", ":hover": { opacity: 1 } }}>
                <IconButton component="label" sx={{ color: "white" }}>
                  <PhotoCamera />
                  <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                </IconButton>
                {profileImg && (
                  <IconButton onClick={handleImageRemove} component="label">
                    <DeleteIcon color="error" />
                  </IconButton>
                )}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6} display="flex" justifyContent="end">
            <a href="/change-password/">edit password</a>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: "1px solid #EEF0F7", paddingBottom: "10px", mb: "20px", mt: "20px" }} className="for-dark-bottom-border">
          <Typography as="h3" sx={{ fontSize: 18, fontWeight: 600 }}>Personal Information</Typography>
        </Box>

        <Box>
          <Typography mb={2}>Hello, I’m passionate about connecting with people, exploring new features, and growing within this community.</Typography>
          {personalInfo.map((info) => (
            <Box sx={{ display: "flex", borderBottom: "1px solid #F7FAFF", p: "10px 0" }} key={info.title} className="for-dark-bottom-border">
              <Typography as="h4" fontWeight="500" fontSize="14px" width="120px">{info.title}</Typography>
              <Typography>{info.text}</Typography>
            </Box>
          ))}
        </Box>
      </Card>
    </Box>
  );
};

export default PersonalInformation;
