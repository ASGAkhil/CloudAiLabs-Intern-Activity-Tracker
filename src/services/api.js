
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
    getHistory: async (name) => {
        try {
            const response = await fetch(`${API_URL}?action=getHistory&name=${encodeURIComponent(name)}`);
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
                body: JSON.stringify({ action: "submitLog", ...logData }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error submitting log:", error);
            return { success: true };
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
                body: JSON.stringify({ action: "saveProfile", ...profileData }),
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
    }
};
