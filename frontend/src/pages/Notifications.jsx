import React, { useState, useEffect } from "react";
import { api } from "../api";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/api/notifications");
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (notification, action) => {
    try {
      // Handle completion request (Yes/No)
      if (notification.type === 'completion_request' && notification.relatedId) {
        if (action === "accept") {
          // Confirm completion - this will mark session as completed and award points
          await api.post(`/api/sessions/${notification.relatedId}/confirm-completion`);
          alert("Session marked as completed! Points have been awarded to the mentor.");
        } else if (action === "reject") {
          // Decline completion
          await api.post(`/api/sessions/${notification.relatedId}/decline-completion`);
          alert("Completion request declined.");
        }
      } else if (notification.type === 'request' && notification.relatedId) {
        // Handle regular session request (Accept/Reject)
        const status = action === "accept" ? "accepted" : "rejected";
        await api.patch(`/api/sessions/${notification.relatedId}`, { status });
      }

      // Optimistically remove the notification card
      setNotifications((prev) => prev.filter((n) => n._id !== notification._id));
      setSelectedNotification(null);

      // Optionally, refetch notifications to ensure consistency
      fetchNotifications();
    } catch (error) {
      console.error(`Failed to ${action} notification`, error);
      alert(error.response?.data?.error || error.message || "Failed to process notification.");
      // Revert the optimistic update in case of an error
      fetchNotifications();
    }
  };

  const handleDelete = async (id) => {
    try {
      // Optimistically remove
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      
      // Call API to delete
      await api.delete(`/api/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification", error);
      fetchNotifications();
    }
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="section-title">Notifications</h1>
        <p className="section-subtitle">See recent updates and alerts</p>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No notifications available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-start gap-4 transition-all hover:shadow-md`}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 text-lg">
                  {notification.title || (notification.type === 'request' ? 'Session Request' : 'Notification')}
                </h3>
                <p className="text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>

                {notification.type === 'request' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAction(notification, "accept")}
                      className="px-6 py-2 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#0D2818] transition-colors shadow-button"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(notification, "reject")}
                      className="px-6 py-2 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition-colors shadow-button"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {notification.type === 'completion_request' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleAction(notification, "accept")}
                      className="px-6 py-2 bg-[#1B4332] text-white rounded-xl font-medium hover:bg-[#0D2818] transition-colors shadow-button"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleAction(notification, "reject")}
                      className="px-6 py-2 bg-red-700 text-white rounded-xl font-medium hover:bg-red-800 transition-colors shadow-button"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notification._id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
                title="Delete"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}