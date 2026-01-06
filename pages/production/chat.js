import React, { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import BASE_URL from "Base/api";
import DeleteIcon from "@mui/icons-material/Delete";

const SenderStyle = {
  backgroundColor: "#d1e7ff",
  color: "#000",
  padding: "10px",
  borderRadius: "10px",
  maxWidth: "60%",
  wordWrap: "break-word",
  marginRight: "10px",
};
const ReceiverStyle = {
  backgroundColor: "#e1ffc7",
  color: "#000",
  padding: "10px",
  borderRadius: "10px",
  maxWidth: "60%",
  wordWrap: "break-word",
  marginLeft: "10px",
};

const customScrollbarStyle = {
  "&::-webkit-scrollbar": {
    width: "10px",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f4f4f4",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#888",
    borderRadius: "10px",
    border: "2px solid #f4f4f4",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "#555",
  },
};

export default function Chat() {
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState("");
  const chatEndRef = useRef(null);
  const userId = localStorage.getItem("userid");

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/ChatHistory/GetAllChatHistory`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Chat History");
      }
      const data = await response.json();
      const last100Messages = data.result.slice(-100);
      const resultMessages = last100Messages.filter(
        (message) =>
          message.senderId === parseInt(userId) &&
          message.receiverId === 1 &&
          message.receiverType === 0
      );
      
      setChatMessages(resultMessages);
    } catch (error) {
      console.error("Error fetching Chat History:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours < 10 ? "0" + hours : hours}:${minutesStr} ${ampm}`;
  };

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      const token = localStorage.getItem("token");
      const name = localStorage.getItem("name");      

      const bodyData = {
        Name: name,
        Text: message,
        SenderReceiver: "sender",
        SenderId: userId,
        RecieverId: 1,
        RecieverType: 1,
      };

      fetch(`${BASE_URL}/ChatHistory/CreateChatHistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.statusCode == 200) {
            fetchMessages();
            setMessage("");
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    }
  };

  const handleRemoveMessage = async (id) => {
    const response = await fetch(
      `${BASE_URL}/ChatHistory/DeleteChatHistory?id=${id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      fetchMessages();
    }
  };

  return (
    <>
      <Grid container>
        <Grid item xs={12} mt={2} sx={{ border: "1px solid #e5e5e5" }}>
          <Grid container>
            <Grid
              item
              xs={12}
              p={2}
              sx={{ background: "#5158a7", color: "#fff" }}
            >
              <Box display="flex" justifyContent="space-between">
                <Box display="flex" sx={{ gap: "5px" }} alignItems="center">
                  <Avatar src="/images/quotation/logo.jpg" />
                  <Typography>CBASS-AI</Typography>
                </Box>
                <AvatarGroup total={4}>
                  <Avatar alt="Remy Sharp" src="/static/images/avatar/1.jpg" />
                  <Avatar
                    alt="Travis Howard"
                    src="/static/images/avatar/2.jpg"
                  />
                </AvatarGroup>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              sx={{
                ...customScrollbarStyle,
                height: "400px",
                overflowY: "auto",
                padding: "10px",
                backgroundColor: "#f4f4f4",
              }}
            >
              {chatMessages.map((msg) => (
                <Box
                  key={msg.id}
                  display="flex"
                  flexDirection="column"
                  alignItems={
                    msg.senderReceiver === "sender" ? "flex-end" : "flex-start"
                  }
                  mb={1}
                >
                  <Box
                    sx={
                      msg.senderReceiver === "sender"
                        ? SenderStyle
                        : ReceiverStyle
                    }
                  >
                    <Typography>{msg.text}</Typography>
                  </Box>
                  {msg.senderReceiver === "receiver" && (
                    <>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#888",
                          marginLeft: "15px",
                          marginBottom: "2px",
                        }}
                      >
                        {msg.name} - {formatTime(msg.createdOn)}
                      </Typography>
                    </>
                  )}
                  {msg.senderReceiver === "sender" && (
                    <Box>
                      <IconButton

                        onClick={() => handleRemoveMessage(msg.id)}
                        sx={{ display:'none', width: "25px", height: "25px" }}
                      >
                        <DeleteIcon
                          color="error"
                          sx={{ width: "20px", height: "20px" }}
                        />
                      </IconButton>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#888",
                          marginRight: "15px",
                          marginBottom: "2px",
                        }}
                      >
                        {formatTime(msg.createdOn)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Grid>
            <Grid
              item
              xs={12}
              display="flex"
              p={1}
              sx={{ border: "3px solid #5158a7", color: "#fff" }}
            >
              <TextField
                sx={{ background: "#fff", color: "#5158a7" }}
                size="small"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button variant="contained" onClick={handleSendMessage}>
                Send
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
