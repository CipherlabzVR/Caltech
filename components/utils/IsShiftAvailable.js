import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const IsShiftAvailable = () => {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Shift/IsShiftAvailable`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      //
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, refetch: fetchData };
};

export default IsShiftAvailable;
