import { formatCurrency } from "@/components/utils/formatHelper";
import { Grid, Typography, Box, Card, CardMedia, CardContent, Divider, Chip, Modal, Button, TableContainer, TableHead, TableRow, TableCell, Table, TableBody, Checkbox } from "@mui/material";
import BASE_URL from "Base/api";
import React, { useEffect, useState, useMemo } from "react";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { lg: 600, xs: 350 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 2,
};

const COLORS = [
  "#f28b82", "#fbbc04", "#34a853", "#4285f4", "#a142f4", "#24c1e0", "#ff6d01", "#46bdc6"
];

const getCategoryColor = (categoryId) => {
  const key = String(categoryId || "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

export default function Offers({ onOrderClick }) {
  const [offers, setOffers] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);


  const fetchOffers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/RestaurantPOS/GetAllOffers`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setOffers(data.result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCardOpen = (item) => {
    setSelectedItem(item);
    setOpen(true);
  }

  const handleCardClose = () => {
    setSelectedItem(null);
    setOpen(false);
  }

  const handleToggleItem = (categoryId, itemIndex) => {
    setSelectedItem((prev) => {
      if (!prev) return prev;

      const updatedItems = prev.orderItems.map((it, idx) => {
        if (it.categoryId === categoryId) {
          return { ...it, isDefault: false };
        }
        return it;
      });
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        isDefault: true
      };

      return { ...prev, orderItems: updatedItems };
    });
  };


  const handleOrderItems = () => {
    if (!selectedItem) return;

    const formattedItems = [];

    const grouped = selectedItem.orderItems.reduce((acc, item) => {
      if (!acc[item.categoryId]) acc[item.categoryId] = [];
      acc[item.categoryId].push(item);
      return acc;
    }, {});

    Object.values(grouped).forEach(items => {
      if (items.length > 1) {
        const defaultItem = items.find(it => it.isDefault);
        if (defaultItem) formattedItems.push(defaultItem);
      } else {
        formattedItems.push(items[0]);
      }
    });

    const formattedOffer = {
      ...selectedItem,
      isOffer: true,
      orderItems: formattedItems,
    };

    if (onOrderClick) {
      onOrderClick(formattedOffer);
    }
    setOpen(false);
  };

  console.log(offers)

  const categoryCounts = useMemo(() => {
    const map = {};
    if (selectedItem && selectedItem.orderItems) {
      selectedItem.orderItems.forEach((it) => {
        const key = it.categoryId;
        map[key] = (map[key] || 0) + 1;
      });
    }
    return map;
  }, [selectedItem]);

  const categoryColors = useMemo(() => {
    const map = {};
    offers.forEach(offer => {
      offer.orderItems.forEach(item => {
        if (item.categoryId && !map[item.categoryId]) {
          map[item.categoryId] = getCategoryColor(item.categoryId);
        }
      });
    });
    return map;
  }, [offers]);

  return (
    <Grid container spacing={2}>
      <Grid
        item
        xs={12}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        sx={{ borderBottom: '1px solid #e5e5e5', pb: 1 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Offers</Typography>
      </Grid>

      <Grid item xs={12} sx={{ mt: 2, maxHeight: "70vh", overflowY: "scroll", '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none', paddingBottom: '100px' }}>
        <Grid container spacing={1}>
          {offers.length === 0 ? (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography>No offers available.</Typography>
            </Grid>
          ) : (
            offers.map(offer => (
              <Grid item xs={12} sm={6} md={4} key={offer.id}>
                <Card onClick={() => handleCardOpen(offer)} sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: 2, cursor: 'pointer' }}>
                  <CardContent>
                    <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', mb: 1 }}>{offer.name}</Typography>
                    <Typography sx={{ fontWeight: 'bold', color: '#fe6564', fontSize: '1rem' }}>
                      Rs. {formatCurrency(offer.sellingPrice)}
                    </Typography>
                    <Divider sx={{ mt: 1, mb: 1 }} />
                    {offer.orderItems.map((item, index) => (
                      <Box
                        key={index}
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={1}
                        sx={{
                          borderLeft: `6px solid ${categoryColors[item.categoryId] || "#ccc"}`,
                          pl: 1
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={item.image}
                          alt={item.name}
                          sx={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 1 }}
                        />
                        <Box flex={1}>
                          <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              Qty: {item.qty}
                            </Typography>
                            {item.isDefault && (
                              <Chip
                                size="small"
                                label="Default"
                                sx={{ backgroundColor: categoryColors[item.categoryId], color: "#fff" }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Grid>

      <Modal
        open={open}
        onClose={handleCardClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} className="bg-black">
          <Box>
            <Grid spacing={1} container>
              <Grid item xs={12}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Item</TableCell>
                        <TableCell sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ backgroundColor: '#fe6564', color: '#fff', fontWeight: 'bold' }}>Select Item</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedItem && selectedItem.orderItems.map((item, i) => (
                        <TableRow
                          key={i}
                          sx={{
                            borderLeft: `6px solid ${categoryColors[item.categoryId] || "#ccc"}`,
                          }}
                        >
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell align="right">
                            <Checkbox
                              checked={item.isDefault}
                              onChange={() => handleToggleItem(item.categoryId, i)}
                              disabled={(categoryCounts[item.categoryId] || 0) <= 1}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
          <Box display="flex" mt={2} justifyContent="space-between">
            <Button
              variant="outlined"
              color="error"
              onClick={handleCardClose}
              size="small"
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#fe6564',
                '&:hover': { backgroundColor: '#fe6564' },
              }}
              onClick={() => handleOrderItems(selectedItem)}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Modal>
    </Grid>
  );
}
