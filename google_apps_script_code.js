// -----------------------------------------------------------------------
// CLOUD AI LABS - BACKEND SCRIPT (Monitor Groups + Drive Uploads)
// -----------------------------------------------------------------------
const SHEET_USERS = "Student Activity";
const SHEET_LOGS = "Activity Logs";
const SHEET_PROFILES = "Student Profiles";
const SHEET_GROUPS = "Groups"; // [NEW] Read from 'Groups' tab

// [IMPORTANT] PASTE YOUR DRIVE FOLDER ID HERE
const DRIVE_FOLDER_ID = "12cULjLm5qkvVS50tG2obJHQjpdpemfp0";

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
        }

        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Action" })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        customLock.releaseLock();
    }
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheet || sheet.getLastRow() < 2) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();

    const users = data.map(row => ({
        name: row[0],
        internId: String(row[1]),
        status: row[2],
        role: "user"
    }));
    users.push({ name: "CIAL-Admin", internId: "CIALAbhayAkhil@2025", role: "admin", status: "Active" });
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

    if (contentType.includes("image")) {
        fileName += ".png"; // Add extension if image
    } else if (contentType.includes("pdf")) {
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
