import NotificationTable from '@/components/Notification/NotificationTable';
import Link from 'next/link';
import styles from '@/styles/PageTitle.module.css';
import BASE_URL from 'Base/api';
import { useState } from 'react';
import { useEffect } from 'react';

export default function Notification() {
  const [notes, setNotes] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${BASE_URL}/Notification/GetAllNotification`, {
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
      setNotes(data.result);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <>
      {/* Page title */}
      <div className={styles.pageTitle}>
        <h1>Notification</h1>
        <ul>
          <li>
            <Link href="/">Dashboard</Link>
          </li>
          <li>Notification</li>
        </ul>
      </div>

      <NotificationTable notes={notes} fetchItems={fetchNotifications}/>
    </>
  );
}
