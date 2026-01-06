import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const getSettingValueByName = (nameOrId) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          return;
        }

        const response = await fetch(`${BASE_URL}/AppSetting/GetAppSettingValueByNameAsync?name=${nameOrId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        // Silently handle errors
      } 
    };

    fetchData();
  }, [nameOrId]);

  return { data };
};

export default getSettingValueByName;
