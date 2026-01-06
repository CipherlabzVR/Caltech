import BASE_URL from 'Base/api';
import { useState } from 'react';

const useGetList = () => {
  const [data, setData] = useState([]);

  const getCustomersByName = async (value, type) => {
    try {
      const response = await fetch(
        `${BASE_URL}/Reservation/GetCustomerListByNameAndResType?cusName=${value}&reservationType=${type}`, 
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching customer list:', err);
    }
  };

  return { data, getCustomersByName };
};

export default useGetList;
