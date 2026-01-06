import React, { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AddCommentIcon from "@mui/icons-material/AddComment";
import BASE_URL from "Base/api";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CloseIcon from '@mui/icons-material/Close';

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

export default function AdminChat() {
  const [chatMessages, setChatMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [chatView, setChatView] = useState(false);
  const [newChat, setNewChat] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState();
  const [currentChat, setCurrentChat] = useState();
  const chatEndRef = useRef(null);
  const userId = localStorage.getItem("userid");

  const fetchChats = async (user) => {
    try {
      const response = await fetch(
        `${BASE_URL}/ChatHistory/GetAllChatHistoryWithUserDetails`,
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
      if(data.result){
        setChats(data.result);
      }
      
    } catch (error) {
      console.error("Error fetching Chat History:", error);
    }
  };

  const fetchMessages = async (user) => {
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
      if(data.result){
        const last100Messages = data.result.slice(-100);      
      const resultMessages = last100Messages.filter(
        (message) =>
          message.senderId === parseInt(user) &&
          message.recieverId === parseInt(userId) &&  message.recieverId === 1
      );
      setChatMessages(resultMessages);
      }
    } catch (error) {
      console.error("Error fetching Chat History:", error);
    }
  };

  const navigateToChat = (user) => {
    setCurrentChat(user);
    setSelectedChatUser(user);
    fetchMessages(user);
    setChatView(true);
  };

  const backToList = () => {
    setCurrentChat();
    setChatView(false);
    setNewChat(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/User/GetAllUser`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usere");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateChat = () => {
    setNewChat(true);
    fetchUsers();
  };
  const handleCloseCreateChat = () => {
    setNewChat(false);
    fetchChats();
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (selectedChatUser) {
      setInterval(function () {
        //fetchMessages(selectedChatUser);
      }, 1000);
    }
    fetchChats();
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
        SenderReceiver: "receiver",
        SenderId: parseInt(selectedChatUser),
        RecieverId: userId,
        RecieverType: 0,
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
            fetchMessages(currentChat);
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
                  {chatView ? (
                    <IconButton
                      onClick={backToList}
                      sx={{ width: "25px", height: "25px" }}
                    >
                      <ArrowBackIosIcon sx={{ color: "#fff" }} />
                    </IconButton>
                  ) : (
                    ""
                  )}
                  <Avatar src="/images/quotation/logo.jpg" />
                  <Typography>CBASS-AI</Typography>
                </Box>
              </Box>
            </Grid>
            {chatView ? (
              <>
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
                        msg.senderReceiver === "receiver"
                          ? "flex-end"
                          : "flex-start"
                      }
                      mb={1}
                    >
                      <Box
                        sx={
                          msg.senderReceiver === "receiver"
                            ? SenderStyle
                            : ReceiverStyle
                        }
                      >
                        <Typography>{msg.text}</Typography>
                      </Box>
                      {msg.senderReceiver === "sender" && (
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#888",
                              marginLeft: "15px",
                              marginBottom: "2px",
                            }}
                          >
                            {formatTime(msg.createdOn)}
                          </Typography>
                        </>
                      )}
                      {msg.senderReceiver === "receiver" && (
                        <Box>
                          <IconButton
                            onClick={() => handleRemoveMessage(msg.id)}
                            sx={{
                              display: "none",
                              width: "25px",
                              height: "25px",
                            }}
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
              </>
            ) : (
              <Grid
                item
                xs={12}
                sx={{
                  ...customScrollbarStyle,
                  height: "500px",
                  overflowY: "auto",
                  padding: "10px",
                  backgroundColor: "#f4f4f4",
                  position: "relative",
                }}
              >
                <Box
                  sx={{ position: "absolute", bottom: "20px", left: "20px" }}
                >
                  
                  <IconButton
                    onClick={newChat ? handleCloseCreateChat : handleCreateChat}
                    sx={{
                      width: "50px",
                      height: "50px",
                      background: newChat ? "red" : "#5158a7",
                      transition: "background 0.3s ease",
                      "&:hover": {
                        background: newChat ? "red" : "#7289da",
                      },
                    }}
                  >
                    {newChat ? <CloseIcon sx={{ fontSize: "22px", color: "#fff" }} />: <AddCommentIcon sx={{ fontSize: "22px", color: "#fff" }} /> }
                    
                  </IconButton>
                </Box>
                {newChat ? (
                  <List
                    sx={{
                      width: "100%",
                    }}
                  >
                    {users.length == 0 ? (
                      <Typography>No Chats Available</Typography>
                    ) : (
                      users.map((chat, index) => (
                        <ListItem
                          key={index}
                          onClick={() => navigateToChat(chat.id)}
                          sx={{
                            background: "#fff",
                            borderBottom: "1px solid #e5e5e5",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.1)",
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={chat.firstName + " " + chat.lastName}
                            secondary={chat.lastMessage}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                ) : (
                  <List
                    sx={{
                      width: "100%",
                    }}
                  >
                    {chats.length == 0 ? (
                      <Typography>No Chats Available</Typography>
                    ) : (
                      chats.map((chat, index) => (
                        <ListItem
                          key={index}
                          onClick={() => navigateToChat(chat.userId)}
                          sx={{
                            background: "#fff",
                            borderBottom: "1px solid #e5e5e5",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "rgba(0, 0, 0, 0.1)",
                            },
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={chat.name}
                            secondary={chat.lastMessage}
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                )}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
