
const API_URL = "https://script.google.com/macros/s/AKfycbxkY_xburon_d315GnNN15SoL9azIZSWhIiPw8rmUs9oyRhQ8_KSCPvnRe5I63g7dnK4w/exec";

export const api = {
    /**
     * Fetches the list of all users from the Sheet.
     * Returns: Array of { name, internId, status, role }
     */
    fetchUsers: async () => {
        try {
            const response = await fetch(`${API_URL}?action=getUsers&_t=${Date.now()}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching users:", error);
            return [];
        }
    },

    /**
     * Fetches history logs for a specific user.
     */
    getHistory: async (name, internId) => {
        try {
            const response = await fetch(`${API_URL}?action=getHistory&name=${encodeURIComponent(name)}&id=${encodeURIComponent(internId)}&_t=${Date.now()}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching history:", error);
            return [];
        }
    },

    /**
     * Submits a new daily log.
     * data: { action: 'submitLog', name, date, category, summary, proof, file }
     */
    submitLog: async (logData) => {
        try {
            // We use text/plain to avoid CORS preflight issues with Google Apps Script
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "submitLog", internId: logData.internId, ...logData }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error submitting log:", error);
            return { success: true };
        }
    },



    // [NEW] Secure ID Delivery
    sendInternId: async (email) => {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'sendInternId', email })
            });
            return await response.json();
        } catch (e) {
            console.error("API Error:", e);
            return { error: "Network Error" };
        }
    },

    getProfile: async (name) => {
        try {
            const response = await fetch(`${API_URL}?action=getProfile&name=${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching profile:", error);
            return { bio: "", photo: "" };
        }
    },

    saveProfile: async (profileData) => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "saveProfile", internId: profileData.internId, ...profileData }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error saving profile:", error);
            return { success: false };
        }
    },

    /**
     * Fetches monitor groups from the Sheet.
     */
    fetchGroups: async () => {
        try {
            const response = await fetch(`${API_URL}?action=getGroups`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching groups:", error);
            return [];
        }
    },

    /**
     * Triggers the backend to sync "Is Monitor" checkboxes based on Group data type.
     */
    syncMonitorPermissions: async () => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "syncMonitorPermissions" }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error syncing permissions:", error);
            return { success: false, error: error.toString() };
        }
    },

    /**
     * CLOUD COURSE PROGRESS
     */
    fetchCourseProgress: async (name) => {
        try {
            const response = await fetch(`${API_URL}?action=getCourseProgress&name=${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching course progress:", error);
            return {};
        }
    },

    saveCourseProgress: async (name, internId, progress) => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "saveCourseProgress", name, internId, progress }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error saving course progress:", error);
            return { success: false };
        }
    }
};
