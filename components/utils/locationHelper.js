// Track if permission was denied to prevent multiple calls
let permissionDenied = false;
let isGettingLocation = false; // Prevent multiple simultaneous calls

/**
 * Get user's current location using browser geolocation API
 * Works on both mobile (GPS) and desktop (IP-based or browser geolocation)
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    // Prevent multiple simultaneous calls
    if (isGettingLocation) {
      reject(new Error("Location request already in progress. Please wait."));
      return;
    }

    // If permission was previously denied, reject immediately
    if (permissionDenied) {
      reject(new Error("Location permission denied. Please enable location access in your browser settings and refresh the page."));
      return;
    }

    isGettingLocation = true;

    const options = {
      enableHighAccuracy: false, // Don't require high accuracy (faster, works better on desktop)
      timeout: 15000, // 15 seconds timeout (increased)
      maximumAge: 0 // Don't use cached location - always get fresh location to avoid permission issues
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Try to get address from reverse geocoding
          let address = "";
          try {
            // Using OpenStreetMap Nominatim API (free, no API key required)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              {
                headers: {
                  'User-Agent': 'ApexflowERP/1.0'
                }
              }
            );
            
            if (!response.ok) {
              throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Check if we got a valid response with display_name
            if (data && data.display_name) {
              address = data.display_name;
            } else if (data && data.address) {
              // Fallback: construct address from address object
              const addr = data.address;
              const parts = [];
              if (addr.road) parts.push(addr.road);
              if (addr.suburb) parts.push(addr.suburb);
              if (addr.village) parts.push(addr.village);
              if (addr.city) parts.push(addr.city);
              if (addr.state) parts.push(addr.state);
              if (addr.country) parts.push(addr.country);
              address = parts.length > 0 ? parts.join(", ") : `${latitude}, ${longitude}`;
            } else {
              // If no address data, use coordinates
              address = `${latitude}, ${longitude}`;
            }
          } catch (error) {
            console.warn("Failed to get address from coordinates:", error);
            // Don't fail the whole operation, just use coordinates as fallback
            address = `${latitude}, ${longitude}`;
          }

          // Reset permission denied flag on success
          permissionDenied = false;
          isGettingLocation = false;
          
          const result = {
            latitude: latitude || 0,
            longitude: longitude || 0,
            address: address || `${latitude}, ${longitude}`,
            location: address || `Lat: ${latitude}, Lng: ${longitude}`,
            accuracy: position.coords?.accuracy || 0,
            timestamp: position.timestamp || Date.now()
          };
          
          console.log("Resolving location with:", result);
          resolve(result);
        } catch (error) {
          console.error("Error processing location:", error);
          isGettingLocation = false;
          // Even if there's an error, try to resolve with coordinates if we have them
          if (position && position.coords) {
            const { latitude, longitude } = position.coords;
            resolve({
              latitude,
              longitude,
              address: `${latitude}, ${longitude}`,
              location: `Lat: ${latitude}, Lng: ${longitude}`,
              accuracy: position.coords.accuracy || 0,
              timestamp: position.timestamp || Date.now()
            });
          } else {
            reject(new Error(error.message || "Failed to process location data"));
          }
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        isGettingLocation = false;
        
        // Mark permission as denied if that's the error
        if (error.code === error.PERMISSION_DENIED) {
          permissionDenied = true;
        }
        
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings and refresh the page.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please check your device's location services.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = `Failed to get location: ${error.message || "Unknown error"}`;
            break;
        }
        // Always reject on error - don't try to resolve with fallback data
        reject(new Error(errorMessage));
      },
      options
    );
  });
};

/**
 * Detect device type
 */
export const getDeviceType = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/android/i.test(userAgent)) {
    return "Mobile";
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
    return "Mobile";
  }
  if (/tablet/i.test(userAgent)) {
    return "Tablet";
  }
  return "Desktop";
};

/**
 * Get device identifier
 */
export const getDeviceIdentifier = () => {
  // Try to get a unique device identifier
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
};

