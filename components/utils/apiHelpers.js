/**
 * Creates authentication headers for API requests
 * @returns {Object} Headers object with Authorization and Content-Type
 */
export const createAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

/**
 * Gets the organization ID from session storage
 * @returns {number|null} Organization ID or null if not found
 */
export const getOrgId = () => {
  const orgId = sessionStorage.getItem("orgId");
  return orgId ? parseInt(orgId, 10) : null;
};

/**
 * Parses an API response to extract the result object
 * Handles different response structures from the backend
 * @param {Object} response - The JSON response from the API
 * @returns {Object} The result object from the response
 */
export const parseObjectResponse = (response) => {
  if (!response) return {};
  
  // Handle different response structures
  if (response.result !== undefined) {
    return response.result;
  }
  
  if (response.data !== undefined) {
    return response.data;
  }
  
  // If response is already the data object
  return response;
};

/**
 * Parses a paginated API response to extract items and total count
 * Handles different response structures from the backend
 * @param {Object} response - The JSON response from the API
 * @returns {Object} Object with items array and totalCount
 */
export const parsePagedResponse = (response) => {
  if (!response) {
    return { items: [], totalCount: 0 };
  }
  
  // Handle different response structures
  if (response.result) {
    if (Array.isArray(response.result)) {
      return {
        items: response.result,
        totalCount: response.result.length,
      };
    }
    
    if (response.result.items) {
      return {
        items: response.result.items || [],
        totalCount: response.result.totalCount || 0,
      };
    }
    
    return {
      items: [],
      totalCount: 0,
    };
  }
  
  if (Array.isArray(response)) {
    return {
      items: response,
      totalCount: response.length,
    };
  }
  
  if (response.items) {
    return {
      items: response.items || [],
      totalCount: response.totalCount || 0,
    };
  }
  
  return {
    items: [],
    totalCount: 0,
  };
};

/**
 * Formats a date to YYYY-MM-DD format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string or empty string if date is null
 */
export const formatDate = (date) => {
  if (date === null || date === undefined) {
    return "";
  }
  
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return "";
  }
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};

