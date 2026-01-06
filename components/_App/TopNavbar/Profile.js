import * as React from "react";
import {
  IconButton,
  Typography,
  Box,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
} from "@mui/material";

import Logout from "@mui/icons-material/Logout";
import { useEffect } from "react";
import BASE_URL from "Base/api";
import KeyIcon from '@mui/icons-material/Key';
import { useRouter } from "next/router";
import PersonIcon from '@mui/icons-material/Person';

const Profile = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const [user, setUser] = React.useState(null);
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
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);


  const router = useRouter();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/authentication/sign-in/";
  };

  const navigateToChangePassword = () => {
    router.push('/change-password/');
  };

  const navigateToProfile = () => {
    router.push('/profile/');
  };

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ p: 0 }}
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          className="ml-2"
        >
          <Avatar
            src={user && user.profilePhoto ? user.profilePhoto : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
            alt={user ? user.firstName : "User"}
            sx={{ width: 40, height: 40 }}
          />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: "10px",
            boxShadow: "0px 10px 35px rgba(50, 110, 189, 0.2)",
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        className="for-dark-top-navList"
      >
        <MenuItem>
          <Avatar
            src={user && user.profilePhoto ? user.profilePhoto : "https://img.freepik.com/premium-vector/user-profile-icon-flat-style-member-avatar-vector-illustration-isolated-background-human-permission-sign-business-concept_157943-15752.jpg"}
            className="mr-1"
          />
          <Box>
            <Typography sx={{ fontSize: "11px", color: "#757FEF" }}>
              {user ? user.userRoleName : "User"}
            </Typography>
            <Typography
              sx={{
                fontSize: "13px",
                color: "#260944",
                fontWeight: "500",
              }}
            >
              {user ? user.email : "User"}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />
        <MenuItem onClick={navigateToProfile}>
          <ListItemIcon sx={{ mr: "-8px", mt: "-3px" }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="13px" color="inherit">
            Profile
          </Typography>
        </MenuItem>
        <MenuItem onClick={navigateToChangePassword}>
          <ListItemIcon sx={{ mr: "-8px", mt: "-3px" }}>
            <KeyIcon fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="13px" color="inherit">
            Change Password
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon sx={{ mr: "-8px", mt: "-3px" }}>
            <Logout fontSize="small" />
          </ListItemIcon>
          <Typography fontSize="13px" color="inherit">
            Logout
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default Profile;
