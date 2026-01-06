import BASE_URL from 'Base/api';
import { useState, useEffect } from 'react';

const IsAppSettingEnabled = (nameOrId) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/AppSetting/IsAppSettingEnabled?nameOrId=${nameOrId}`, {
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
      } catch (err) {
      //
      } 
    };

    fetchData();
  }, [nameOrId]);

  return { data };
};

export default IsAppSettingEnabled;
