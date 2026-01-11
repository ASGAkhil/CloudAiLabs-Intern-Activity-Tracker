// -----------------------------------------------------------------------
// CLOUD AI LABS - BACKEND SCRIPT (Monitor Groups + Drive Uploads + Additional Admin Control)
// -----------------------------------------------------------------------
const SHEET_USERS = "Student Activity";
const SHEET_LOGS = "Activity Logs";
const SHEET_PROFILES = "Student Profiles";
const SHEET_GROUPS = "Groups"; // [NEW] Read from 'Groups' tab

// [IMPORTANT] PASTE YOUR DRIVE FOLDER ID HERE
const DRIVE_FOLDER_ID = "12cULjLm5qkvVS50tG2obJHQjpdpemfp0";

/**
 * CHANGE LOG: 1. Added Profile Photos, Active Days Sync, and Date Parsing fix.
 */

function doGet(e) {
    const action = e.parameter.action;

    if (action === "getUsers") {
        return getUsers();
    } else if (action === "getHistory") {
        return getHistory(e.parameter.name);
    } else if (action === "getProfile") {
        return getProfile(e.parameter.name);
    } else if (action === "getGroups") { // [NEW] Endpoint
        return getMonitorGroups();
    }
}


function doPost(e) {
    const customLock = LockService.getScriptLock();
    try {
        // Wait for up to 30 seconds for other processes to finish.
        customLock.waitLock(30000);

        // Safety check for empty post body
        if (!e.postData || !e.postData.contents) {
            return ContentService.createTextOutput(JSON.stringify({ error: "No data" })).setMimeType(ContentService.MimeType.JSON);
        }

        const data = JSON.parse(e.postData.contents);
        const action = data.action;

        if (action === "submitLog") {
            return submitLog(data);
        } else if (action === "saveProfile") {
            return saveProfile(data);
        } else if (action === "syncMonitorPermissions") { // [NEW] Sync Action
            return syncMonitorPermissions();
        }

        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Action" })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        customLock.releaseLock();
    }
}

// --- NEW: SMART MONITOR SYNC (Token Matching) ---
function syncMonitorPermissions() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    const sheetGroups = ss.getSheetByName(SHEET_GROUPS);

    if (!sheetUsers || !sheetGroups) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Sheets not found" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Get All Monitor Members (Tokenized)
    // We treat every name as a "Set of tokens" for flexible matching
    const monitorTokens = []; // Array of Set<string>

    const groupData = sheetGroups.getDataRange().getValues();
    // Start from row 2 (index 1) to skip headers if any, or just read all non-empty
    for (let r = 1; r < groupData.length; r++) {
        for (let c = 0; c < groupData[r].length; c++) {
            const cellVal = groupData[r][c];
            if (cellVal && typeof cellVal === 'string' && cellVal.trim() !== "") {
                // Tokenize: "Naga Pranathi M5" -> ["naga", "pranathi", "m5"]
                const tokens = new Set(cellVal.toLowerCase().split(/[\s\-_]+/).filter(t => t.length > 2));
                if (tokens.size > 0) monitorTokens.push(tokens);
            }
        }
    }

    // Capture Column Headers (Row 1) to find "Monitor & Members" column
    // If it doesn't exist, we create it at Column 4 (Index 4 => Column D)
    // Wait, User asked for "right side of active inactive column"
    // Users Sheet: A=Name, B=InternID, C=Status. So D should be "Monitor & Members"

    const lastCol = sheetUsers.getLastColumn();
    let targetColIndex = 4; // Default to D

    // Check if header exists
    // header is 1-indexed in getRange, but 0-indexed in values
    const headers = sheetUsers.getRange(1, 1, 1, lastCol).getValues()[0];
    let found = false;
    for (let i = 0; i < headers.length; i++) {
        if (headers[i] === "Monitor & Members") {
            targetColIndex = i + 1;
            found = true;
            break;
        }
    }

    if (!found) {
        // If not found, insert at Column D (4) if empty, or just append
        // User said "right side of active inactive", which is usually Col C. So Col D is perfect.
        targetColIndex = 4;
        sheetUsers.getRange(1, targetColIndex).setValue("Monitor & Members").setFontWeight("bold");
    }

    // 2. Process Users
    const userDataRange = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 1); // Get Names
    const userNames = userDataRange.getValues();
    const results = [];

    // Improve Batch writing for speed
    const checkmarks = [];

    for (let i = 0; i < userNames.length; i++) {
        const nameRaw = userNames[i][0];
        let isMatch = false;

        if (nameRaw) {
            const userTokens = String(nameRaw).toLowerCase().split(/[\s\-_]+/).filter(t => t.length > 2);

            // Check against ALL monitor entries
            for (const mTokens of monitorTokens) {
                // Intersection Logic
                // If user is "Pranathi Naga", tokens = ["pranathi", "naga"]
                // Monitor is "Naga Pranathi M5", tokens = ["naga", "pranathi", "m5"]
                // Intersection = 2. Match!

                let matchCount = 0;
                for (const uToken of userTokens) {
                    if (mTokens.has(uToken)) matchCount++;
                }

                // Threshold: If 2 or more tokens match, OR (if user only has 1 token and it matches)
                if (matchCount >= 2 || (userTokens.length === 1 && matchCount === 1)) {
                    isMatch = true;
                    break;
                }
            }
        }
        checkmarks.push([isMatch]);
    }

    // 3. Update Sheet
    if (checkmarks.length > 0) {
        const checkboxRange = sheetUsers.getRange(2, targetColIndex, checkmarks.length, 1);

        // Convert to Checkboxes
        checkboxRange.setDataValidation(SpreadsheetApp.newDataValidation()
            .requireCheckbox()
            .build());

        checkboxRange.setValues(checkmarks);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, count: checkmarks.length }))
        .setMimeType(ContentService.MimeType.JSON);
}


// --- NEW FUNCTION: GET MONITOR GROUPS ---
function getMonitorGroups() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GROUPS);
    // Return empty if sheet doesn't exist
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    // Read from Row 2 (Headers) down to last row
    // Assuming 10 columns (B to K) roughly. We'll grab 20 columns to be safe.
    var data = sheet.getRange(2, 2, lastRow - 1, 20).getValues();

    var groups = [];
    var headers = data[0]; // Row 2 acts as header

    for (var col = 0; col < headers.length; col++) {
        var monitorName = headers[col];
        if (!monitorName || monitorName === "") continue;

        var members = [];
        for (var row = 1; row < data.length; row++) {
            var memberName = data[row][col];
            if (memberName && memberName !== "") {
                members.push(memberName);
            }
        }

        groups.push({
            monitor: monitorName,
            members: members
        });
    }

    return ContentService.createTextOutput(JSON.stringify(groups)).setMimeType(ContentService.MimeType.JSON);
}

// --- EXISTING DATA FUNCTIONS ---

function getUsers() {
    const sheetUsers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheetUsers || sheetUsers.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    // Get Users: Name(A), InternID(B), Status(C), Monitor(D)
    // We grab 4 columns now to include the new Checkbox column
    const userData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 4).getValues();

    // Get Logs for aggregation
    const sheetLogs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    const userStats = {}; // Map: Name -> { days: Set(), loadingHistory: [] }

    if (sheetLogs && sheetLogs.getLastRow() >= 2) {
        const logData = sheetLogs.getRange(2, 1, sheetLogs.getLastRow() - 1, 2).getValues(); // Get Name (Col A) and Date (Col B)
        for (var i = 0; i < logData.length; i++) {
            var name = logData[i][0];
            var dateStr = logData[i][1];
            if (!name) continue;

            // Normalize Date to YYYY-MM-DD to count unique days
            var d;
            if (typeof dateStr === 'string' && dateStr.includes("•")) {
                // Handle: "Jan 9, 2026 • 5:16 PM"
                d = new Date(dateStr.split("•")[0].trim());
            } else {
                d = new Date(dateStr);
            }

            if (isNaN(d.getTime())) continue; // Skip invalid dates
            var dateKey = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

            if (!userStats[name]) {
                userStats[name] = new Set();
            }
            userStats[name].add(dateKey);
        }
    }

    // [NEW] Get Profiles for Photos
    const sheetProfiles = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
    const userPhotos = {}; // Map: Name -> PhotoURL

    if (sheetProfiles && sheetProfiles.getLastRow() >= 2) {
        // Name (A), Bio (B), Photo (C)
        const profileData = sheetProfiles.getRange(2, 1, sheetProfiles.getLastRow() - 1, 3).getValues();
        for (var j = 0; j < profileData.length; j++) {
            var pName = profileData[j][0];
            var pPhoto = profileData[j][2];
            if (pName && pPhoto) {
                userPhotos[pName] = pPhoto;
            }
        }
    }

    const users = userData.map(row => {
        const name = row[0];
        const daysCount = userStats[name] ? userStats[name].size : 0;
        const photoUrl = userPhotos[name] || "";
        // row[3] is Column D (Monitor & Members) - Checkbox
        const isMonitor = row[3] === true;

        return {
            name: name,
            internId: String(row[1]),
            status: row[2],
            role: "user",
            daysCompleted: daysCount,
            photo: photoUrl,
            isMonitor: isMonitor
        };
    });

    users.push({ name: "CIAL-Admin", internId: "CIALAbhayAkhil@2025", role: "admin", status: "Active", daysCompleted: 0, isMonitor: true });

    return ContentService.createTextOutput(JSON.stringify(users))
        .setMimeType(ContentService.MimeType.JSON);
}

function getHistory(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    const history = data.slice(1)
        .filter(row => row[0] === name)
        .map(row => ({
            date: row[1],
            category: row[2],
            summary: row[3],
            proof: row[4],
            file: row[5]
        })).reverse();
    return ContentService.createTextOutput(JSON.stringify(history))
        .setMimeType(ContentService.MimeType.JSON);
}

function getProfile(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ bio: "", photo: "" })).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    const profile = data.find(row => row[0] === name);

    return ContentService.createTextOutput(JSON.stringify({
        bio: profile ? profile[1] : "",
        photo: profile ? profile[2] : ""
    })).setMimeType(ContentService.MimeType.JSON);
}

function saveProfile(data) {
    const { name, bio, photo } = data;
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);

    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_PROFILES);
        sheet.appendRow(["Name", "Bio", "Photo"]);
        sheet.setRowHeight(1, 40);
        sheet.getRange("A1:C1").setFontWeight("bold").setBackground("#E0E0E0");
    }

    const dataRange = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][0] === name) {
            rowIndex = i + 1;
            break;
        }
    }

    let finalPhotoValue = "";

    // Use Main Folder for Profiles
    if (photo && photo.toString().includes("base64,")) {
        try {
            const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
            finalPhotoValue = uploadToDriveFolder(folder, photo, name + "_profile_" + Date.now());
        } catch (e) {
            finalPhotoValue = "ERROR_UPLOADING: " + e.toString();
        }
    } else if (photo) {
        finalPhotoValue = photo;
    }

    if (!photo && rowIndex !== -1) {
        finalPhotoValue = dataRange[rowIndex - 1][2];
    }

    if (rowIndex !== -1) {
        if (bio !== undefined) sheet.getRange(rowIndex, 2).setValue(bio);
        if (finalPhotoValue) sheet.getRange(rowIndex, 3).setValue(finalPhotoValue);
    } else {
        sheet.appendRow([name, bio || "", finalPhotoValue || ""]);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, photo: finalPhotoValue }))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- UPDATED SUBMIT LOG WITH FILE UPLOAD ---
function submitLog(data) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_LOGS);
        sheet.appendRow(["Name", "Date", "Category", "Summary", "Proof", "File"]);
    }
    const { name, date, category, summary, proof, file } = data;

    let fileUrl = "";

    // Upload Logic for Daily Logs
    if (file && file.toString().includes("base64,")) {
        try {
            // 1. Get/Create "Daily Tracker" Subfolder
            const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
            const subFolder = getOrCreateSubfolder(mainFolder, "Daily Tracker");

            // 2. Upload File to Subfolder
            fileUrl = uploadToDriveFolder(subFolder, file, name + "_log_" + Date.now());

        } catch (e) {
            fileUrl = "ERROR_UPLOADING: " + e.toString();
        }
    } else if (file) {
        fileUrl = file; // Assume it's a URL if not base64
    }

    sheet.appendRow([name, date, category, summary, proof, fileUrl]);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- HELPER FUNCTIONS ---

// Helper: Find or Create a folder inside a parent folder
function getOrCreateSubfolder(parentFolder, subFolderName) {
    const folders = parentFolder.getFoldersByName(subFolderName);
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return parentFolder.createFolder(subFolderName);
    }
}

// Helper: Handle the Base64 Upload
function uploadToDriveFolder(folder, base64String, fileName) {
    // Clean the base64 string
    const base64Data = base64String.split("base64,")[1];
    const contentType = base64String.split(";")[0].split(":")[1] || "application/octet-stream";

    // [FIX] Smart Extension Logic
    if (contentType.includes("image") && !fileName.includes(".")) {
        if (contentType.includes("jpeg") || contentType.includes("jpg")) fileName += ".jpg";
        else if (contentType.includes("png")) fileName += ".png";
        else fileName += ".png"; // Fallback
    } else if (contentType.includes("pdf") && !fileName.includes(".")) {
        fileName += ".pdf";
    }

    const bytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(bytes, contentType, fileName);
    const file = folder.createFile(blob);

    // [New] Ensure file is publicly viewable (optional, but good for embedding)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    Utilities.sleep(500); // Wait for sharing to propagate

    // Use the thumbnail link endpoint which is more friendly for embedding
    // &sz=w1000 ensures we get a high-quality "poster" image
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
}
