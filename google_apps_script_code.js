// -----------------------------------------------------------------------
// CLOUD AI LABS - BACKEND SCRIPT (Monitor Groups + Drive Uploads + Additional Admin Control)
// -----------------------------------------------------------------------
const SHEET_USERS = "Student Activity";
const SHEET_LOGS = "Activity Logs";
const SHEET_PROFILES = "Student Profiles";
const SHEET_GROUPS = "Groups";
const SHEET_COURSES = "Student Courses"; // [NEW] Dedicated tab for Course Progress

// [IMPORTANT] PASTE YOUR DRIVE FOLDER ID HERE
const DRIVE_FOLDER_ID = "12cULjLm5qkvVS50tG2obJHQjpdpemfp0";

/**
 * CHANGE LOG: 
 * 1. Added Profile Photos, Active Days Sync, and Date Parsing fix.
 * 2. Added Robust Monitor Column Detection.
 * 3. Added Cloud Course Progress (Student Courses tab).
 * 4. [SECURITY] Added Intern ID Verification (submitLog, getHistory, saveProfile, saveCourseProgress).
 * 5. [FIX] Resolved "Year 2001" Invalid Date bug (Smart Date Parsing).
 * 6. [FIX] Fixed Blank Data bug (Unified 'course'/'category' keys).
 * 7. [FIX] Optimized Profile Photo Thumbnails (sz=s1000).
 */

function doGet(e) {
    const action = e.parameter.action;

    if (action === "getUsers") {
        return getUsers();
    } else if (action === "getHistory") {
        return getHistory(e.parameter.name, e.parameter.id);
    } else if (action === "getProfile") {
        return getProfile(e.parameter.name);
    } else if (action === "getGroups") {
        return getMonitorGroups();
    } else if (action === "getCourseProgress") { // [NEW] Endpoint
        return getCourseProgress(e.parameter.name);
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
        } else if (action === "syncMonitorPermissions") {
            return syncMonitorPermissions();
        } else if (action === "saveCourseProgress") {
            return saveCourseProgress(data);
        } else if (action === "sendInternId") { // [NEW] Secure ID Delivery
            return sendInternId(data.email);
        }

        return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Action" })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        customLock.releaseLock();
    }
}

// --- AUTH HELPER (RUN THIS ONCE IN EDITOR) ---
function testEmailPermissions() {
    console.log("Checking permissions...");
    const quota = MailApp.getRemainingDailyQuota();
    console.log("Email Quota Remaining: " + quota);
    return "Permissions successfully granted!";
}



// ... [Existing Functions: syncMonitorPermissions, getMonitorGroups, getUsers, getHistory] ...

// --- NEW: CLOUD COURSE PROGRESS ---

function getCourseProgress(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_COURSES);
    // If sheet doesn't exist yet, return empty
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    // Find row for this user
    const row = data.find(r => r[0] === name);

    // Column B (Index 1) stores the JSON string
    const progressJson = row ? row[1] : "{}";

    // Safety parse
    try {
        const parsed = JSON.parse(progressJson);
        return ContentService.createTextOutput(JSON.stringify(parsed)).setMimeType(ContentService.MimeType.JSON);
    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
    }
}

function saveCourseProgress(data) {
    const { name, internId, progress } = data; // progress should be a JSON object

    // [SECURITY] Verify User
    if (!isValidUser(name, internId)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid Intern ID" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_COURSES);

    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_COURSES);
        sheet.appendRow(["Name", "Course Progress (JSON)"]);
        sheet.setRowHeight(1, 40);
        sheet.getRange("A1:B1").setFontWeight("bold").setBackground("#E0E0E0");
    }

    const dataRange = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < dataRange.length; i++) {
        if (dataRange[i][0] === name) {
            rowIndex = i + 1;
            break;
        }
    }

    const jsonString = JSON.stringify(progress);

    if (rowIndex !== -1) {
        // Update existing row
        sheet.getRange(rowIndex, 2).setValue(jsonString);
    } else {
        // Create new row
        sheet.appendRow([name, jsonString]);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- EXISTING DATA FUNCTIONS ---

// --- NEW: SMART SYNC (ROBUST SUBSET MATCHING) ---
function syncMonitorPermissions() {
    const sheetUsers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    const sheetGroups = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GROUPS);

    if (!sheetUsers || !sheetGroups) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Missing Sheets" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // 1. GLOBAL SCAN: Read Entire Groups Sheet
    const groupData = sheetGroups.getDataRange().getValues();

    // Ignored words (Common headers, cities, junk)
    // Adding cities appearing in screenshot to avoid false matching on location
    const IGNORED = new Set([
        "monitor", "group", "member", "members", "name", "date", "status", "active", "inactive",
        "timestamp", "email", "id", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10",
        "nagpur", "pune", "mumbai", "delhi", "bangalore", "bengaluru", "hyd", "hyderabad", "chennai", "kolkata",
        "maha", "maharashtra", "up", "mp", "ap", "gujarat", "karnataka", "tamil", "nadu"
    ]);

    const cleanToken = (str) => {
        return String(str)
            .replace(/\bM\d+\b/gi, "")        // Remove M1..M10
            .replace(/[0-9]/g, "")            // Remove numbers
            .replace(/[-_()|/–—]/g, " ")      // Turn all separators to spaces (inc. en-dash)
            .replace(/\u00A0/g, " ")          // Remove NBSP
            .toLowerCase()
            .trim();
    };

    // --- COLLECTION ---
    const allowedTokenSets = []; // Array of Set<string>

    for (let r = 0; r < groupData.length; r++) {
        for (let c = 0; c < groupData[r].length; c++) {
            const cellVal = groupData[r][c];
            if (cellVal) {
                // Skip errors
                if (String(cellVal).includes("#REF!") || String(cellVal).includes("Loading...")) continue;

                const clean = cleanToken(cellVal);
                // Split by space, filter short words (<3 chars unless it's a known short name? Let's stick to >2)
                const tokens = clean.split(/\s+/).filter(t => t.length > 2 && !IGNORED.has(t));

                if (tokens.length > 0) {
                    allowedTokenSets.push(new Set(tokens));
                }
            }
        }
    }

    // 2. MATCH LOGIC
    const userHeaders = sheetUsers.getRange(1, 1, 1, sheetUsers.getLastColumn()).getValues()[0];
    let targetColIndex = -1;

    for (let i = 0; i < userHeaders.length; i++) {
        if (userHeaders[i].trim() === "Monitor & Members") {
            targetColIndex = i + 1;
            break;
        }
    }

    if (targetColIndex === -1) {
        targetColIndex = 4;
        sheetUsers.getRange(1, targetColIndex).setValue("Monitor & Members").setFontWeight("bold");
    }

    const userDataRange = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, 1);
    const userNames = userDataRange.getValues();

    const checkmarks = [];
    let lastRealRowIndex = -1;
    let matchCountTotal = 0;

    for (let i = 0; i < userNames.length; i++) {
        const nameRaw = userNames[i][0];
        let isMatch = false;

        if (nameRaw) {
            lastRealRowIndex = i;
            const uClean = cleanToken(nameRaw);
            const uTokens = uClean.split(/\s+/).filter(t => t.length > 2 && !IGNORED.has(t));

            if (uTokens.length > 0) {
                // CHECK AGAINST ALL GROUP ENTRIES
                for (const groupSet of allowedTokenSets) {
                    // Intersection
                    let intersection = 0;
                    for (const ut of uTokens) {
                        if (groupSet.has(ut)) intersection++;
                    }

                    // RULE 1: Subset Match (One is fully contained in the other)
                    // If User has [Abhay, Gupta] and Group has [Abhay, Gupta, Delhi] -> Intersection 2. UserLen 2. 2/2 = 1. MATCH.
                    // If User has [Prabhu] and Group has [Prabhu, Nagpur] -> Intersection 1. UserLen 1. 1/1 = 1. MATCH.
                    // If Group has [Abhay] and User has [Abhay, Gupta] -> Intersection 1. GroupLen 1. 1/1 = 1. MATCH.

                    const userCovered = (intersection >= uTokens.length);
                    const groupCovered = (intersection >= groupSet.size);

                    if (userCovered || groupCovered) {
                        isMatch = true;
                        break;
                    }

                    // RULE 2: Majority Match (for typos or extra middle names)
                    // e.g. User: "Vijay Kumar Singh", Group: "Vijay Singh" -> 2/3 and 2/2 -> Match?
                    // Let's rely on Subset for now, but handle "Swap" via intersection count.
                    // If intersection >= 2, we assume it's a match (names usually unique enough with 2 parts)
                    if (intersection >= 2) {
                        isMatch = true;
                        break;
                    }
                }
            }
        }
        if (isMatch) matchCountTotal++;
        checkmarks.push([isMatch]);
    }

    // TRIM OUTPUT
    const trimmedCheckmarks = checkmarks.slice(0, lastRealRowIndex + 1);

    // 3. Update Sheet
    if (trimmedCheckmarks.length > 0) {
        const fullColRange = sheetUsers.getRange(2, targetColIndex, sheetUsers.getLastRow() - 1, 1);
        fullColRange.clearDataValidations().clearContent(); // Reset

        const checkboxRange = sheetUsers.getRange(2, targetColIndex, trimmedCheckmarks.length, 1);
        checkboxRange.setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
        checkboxRange.setValues(trimmedCheckmarks);
    }

    return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: matchCountTotal,
        totalFound: allowedTokenSets.length
    })).setMimeType(ContentService.MimeType.JSON);
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

    // Dynamic Column Finding for "Switch-safe" robustness
    const headers = sheetUsers.getRange(1, 1, 1, sheetUsers.getLastColumn()).getValues()[0];
    let monitorColIndex = 3; // Default to Index 3 (Column 4/D) (0-based for array access)

    // Robust search for the Monitor column (User calls it "monitors and member" or similar)
    // We check for keywords including "monitor" or "monitors"
    for (let i = 0; i < headers.length; i++) {
        const h = headers[i].toString().toLowerCase();
        if (h.includes("monitor")) {
            monitorColIndex = i;
            break;
        }
    }

    // Get Users Data - Grab enough columns to cover the dynamic index
    // We'll grab up to the monitor column or at least 4 cols
    const numColsToGrab = Math.max(monitorColIndex + 1, 4);
    const userData = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, numColsToGrab).getValues();

    // Get Logs for aggregation
    const sheetLogs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    const userStats = {}; // Map: Canonical Name -> Set(Dates)

    // --- AGGREGATION LOGIC ---

    // 1. Process Legacy "Student Activity" (Schema: Col A=Name, Col B=Timestamp)
    const sheetLegacy = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Activity");
    if (sheetLegacy && sheetLegacy.getLastRow() >= 2) {
        // [FIX] Use getValues to get Raw Date Objects (Consistent with getHistory)
        const legData = sheetLegacy.getRange(2, 1, sheetLegacy.getLastRow() - 1, 2).getValues();
        legData.forEach(row => {
            const name = row[0];
            const dateStr = row[1];
            if (name && dateStr) processLogEntry(userData, userStats, name, dateStr);
        });
    }

    // 2. Process "M1-M10" (Schema: Col A=Timestamp, Col C=Name)
    const mSources = [];
    for (let i = 1; i <= 10; i++) mSources.push(`M${i}`);

    mSources.forEach(tabName => {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
        if (sheet && sheet.getLastRow() > 1) {
            // Read Col A (Timestamp) and Col C (Name)
            // [FIX] Use getValues for Raw Date Objects
            const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
            data.forEach(row => {
                const dateStr = row[0];
                const name = row[2];
                if (name && dateStr) processLogEntry(userData, userStats, name, dateStr);
            });
        }
    });

    // 3. Process "Activity Logs" (Schema: Col A=Name, Col B=Date)
    const actSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Activity Logs");
    if (actSheet && actSheet.getLastRow() > 1) {
        // Read Col A (Name) and Col B (Date)
        const data = actSheet.getRange(2, 1, actSheet.getLastRow() - 1, 2).getValues();
        data.forEach(row => {
            const name = row[0];
            const dateStr = row[1];
            if (name && dateStr) processLogEntry(userData, userStats, name, dateStr);
        });
    }

    function processLogEntry(userList, statsMap, rawName, dateValue) {
        if (!dateValue || dateValue === "") return;

        // [FIX] ROBUST DATE KEY
        const dateKey = getCanonicalDateKey(dateValue);
        if (!dateKey) return; // [FIX] Skip invalid dates entirely

        // Name Normalization (Strict Match)
        // Check exact match first for speed
        if (statsMap[rawName]) {
            statsMap[rawName].add(dateKey);
            return;
        }

        // Find Canonical User
        const matchUser = userList.find(u => areNamesEquivalent(u[0], rawName));
        if (matchUser) {
            const officialName = matchUser[0];
            if (!statsMap[officialName]) statsMap[officialName] = new Set();
            statsMap[officialName].add(dateKey);

            // [NEW] Track Latest Date (Attach property to the Set object - a bit hacky but efficient JS)
            if (!statsMap[officialName].latest || new Date(dateKey) > new Date(statsMap[officialName].latest)) {
                statsMap[officialName].latest = dateKey;
            }
        } else {
            // Unrecognized user (add as is)
            if (!statsMap[rawName]) statsMap[rawName] = new Set();
            statsMap[rawName].add(dateKey);

            // [NEW] Track Latest Date
            if (!statsMap[rawName].latest || new Date(dateKey) > new Date(statsMap[rawName].latest)) {
                statsMap[rawName].latest = dateKey;
            }
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

        // Robust Checkbox Check: Handles Boolean true, String "TRUE", "true"
        const colVal = row[monitorColIndex];
        const isMonitor = (colVal === true || String(colVal).toLowerCase() === "true");

        return {
            name: name,
            internId: String(row[1]),
            status: row[2],
            role: "user",
            daysCompleted: daysCount,
            lastLogDate: userStats[name] && userStats[name].latest ? userStats[name].latest : "", // [NEW] For 'Active Today' count
            photo: photoUrl,
            isMonitor: isMonitor,
            hasCourseAccess: isMonitor // [FIX] Monitor check now directly enables Course Access
        };
    });

    users.push({
        name: "CIAL-Admin",
        internId: "CIALAbhayAkhil@2025",
        role: "admin",
        status: "Active",
        daysCompleted: 0,
        isMonitor: true,
        hasCourseAccess: true
    });

    return ContentService.createTextOutput(JSON.stringify(users))
        .setMimeType(ContentService.MimeType.JSON);
}

// --- NEW: SECURE ID DELIVERY (EMAILS ID TO USER) ---
function sendInternId(email) {
    if (!email || !email.includes("@")) return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Email" })).setMimeType(ContentService.MimeType.JSON);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({ error: "Sheet not found" })).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // 1. Find "Email" Column
    let emailCol = -1;
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].toString().toLowerCase().trim() === "email") {
            emailCol = i;
            break;
        }
    }

    if (emailCol === -1) {
        // Fallback: Check last column if it looks like an email?
        // Better: Return error asking user to add column
        return ContentService.createTextOutput(JSON.stringify({ error: "Column 'Email' not found in 'Student Activity' sheet." })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Search for User
    const inputEmail = email.toLowerCase().trim();
    let foundUser = null;

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (String(row[emailCol]).toLowerCase().trim() === inputEmail) {
            foundUser = {
                name: row[0],   // Name (Col A)
                id: row[1]      // ID (Col B)
            };
            break;
        }
    }

    if (!foundUser) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Email not registered." })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Send Email
    const subject = "Your CloudAiLabs Intern ID";
    const body = `Hello ${foundUser.name},\n\nHere is your Intern ID for the Activity Tracker Dashboard:\n\n${foundUser.id}\n\nPlease keep this safe.\n\nBest,\nCloudAiLabs Team`;

    try {
        MailApp.sendEmail(inputEmail, subject, body);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "ID sent to email." })).setMimeType(ContentService.MimeType.JSON);
    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Email failed: " + e.message })).setMimeType(ContentService.MimeType.JSON);
    }
}



// --- NEW: Robust Date Normalizer (Global Scope) ---
function getCanonicalDateKey(dateValue) {
    if (!dateValue) return "";
    let str = dateValue.toString().trim();

    // Handle "Jan 22, 2026 • 10:30 AM" (or "Jan 22 • 2026..." due to bug)
    // improved: Replace separator with space so we keep the whole date string for parsing
    if (str.includes("•")) str = str.replace(/•/g, " ");

    // [FIX] Support DD-MM-YYYY or DD/MM/YYYY (Common in India/Excel)
    // Regex to detect "23-01-2026" or "23/01/2026"
    // Capture Groups: 1=Day, 2=Month, 3=Year
    const dmyPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
    const match = str.match(dmyPattern);

    let d;
    if (match) {
        // Manually construct correct Date (Month is 0-indexed in JS)
        // d = new Date(Year, Month-1, Day)
        d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    } else {
        // Fallback to standard parser (MM/DD/YYYY or YYYY-MM-DD or Text)
        d = new Date(str);
    }

    // If invalid, return null (don't count garbage)
    if (isNaN(d.getTime())) return null;

    return Utilities.formatDate(d, "GMT+05:30", "yyyy-MM-dd");
}

// --- SECURITY HELPER ---
function isValidUser(name, internId) {
    if (!name || !internId) return false;

    // Master Bypass for Admin (Hardcoded for safety during transitions)
    if (name === "CIAL-Admin" && internId === "CIALAbhayAkhil@2025") return true;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheet) return false;

    const data = sheet.getDataRange().getValues();
    // Col 0 = Name, Col 1 = InternID
    const userRow = data.find(r => areNamesEquivalent(r[0], name));

    if (userRow) {
        // Strict String comparison
        return String(userRow[1]).trim() === String(internId).trim();
    }
    return false;
}

// --- HELPER: Normalize Log Data ---
const normalizeLog = (row, source) => {
    // M1-M10 Schema (and new Activity Logs): 
    // [timestamp, email, name, course, time, issues, learning]
    // Index: 0, 1, 2, 3, 4, 5, 6

    return {
        date: row[0],
        email: row[1],
        name: row[2], // Canonical Name
        course: row[3] || "Learning",
        time: row[4] || "",
        issues: row[5] || "No",
        learning: row[6] || "",
        source: source
    };
};

function getHistory(name, internId) {
    if (!name) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);

    // [SECURITY] Login Check (Skip for 'Test' or basic debugging if needed, but enforce for real data)
    // We allow Admin to view anyone (handled in frontend logic? No, backend should be strict)
    // Actually, Admin viewer needs a bypass or master key. 
    // For now, let's assume if name == "Admin", we trust? No, "isValidUser" handles regular users.
    // IF the requester provides the correct ID for the requested Name, they get data.
    // [SECURITY] Login Check
    // 1. Standard Check: Does the ID belong to the Name?
    // 2. Admin Bypass: Is the ID the Master Admin ID?
    if (!isValidUser(name, internId) && internId !== "CIALAbhayAkhil@2025") {
        // Return empty to silently fail or error object? Empty is safer to not leak info.
        return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let allLogs = [];

    console.log(`[getHistory] Starting search for: '${name}'`);

    // 0. Scan Legacy 'Student Activity' (Schema: Col A=Name, Col B=Timestamp)
    const sheetLegacy = ss.getSheetByName("Student Activity");
    if (sheetLegacy && sheetLegacy.getLastRow() > 1) {
        // Use getDisplayValues for WYSIWYG reading of Name, but we might want RAW date?
        // Let's use getValues() for better Date handling, same as getUsers/getCanonicalDateKey
        const lData = sheetLegacy.getDataRange().getValues();
        for (let r = 1; r < lData.length; r++) {
            const rowName = lData[r][0]; // Col A is Name
            if (areNamesEquivalent(rowName, name)) {
                // Push formatted log
                allLogs.push({
                    date: getCanonicalDateKey(lData[r][1]), // Col B is Date
                    name: rowName,
                    course: "Legacy Log", // No course col in Legacy?
                    time: "",
                    issues: "",
                    learning: "Activity Logged via Form",
                    proof: "",
                    file: "",
                    source: 'Student Activity'
                });
            }
        }
    }

    // 1. Scan M1 to M10
    // These are the "Read Only" tabs from the monitors
    for (let i = 1; i <= 10; i++) {
        const sheet = ss.getSheetByName(`M${i}`);
        if (sheet && sheet.getLastRow() > 1) {
            const data = sheet.getDataRange().getValues();
            // Skip Header (Row 1)
            for (let r = 1; r < data.length; r++) {
                const rowName = data[r][2]; // Col C is Name

                // Strict Name Match
                if (areNamesEquivalent(rowName, name)) {
                    // console.log(`[GH-M${i}] MATCH at Row ${r+1}`);
                    const log = normalizeLog(data[r], `M${i}`);
                    // [FIX] Normalize Date for Frontend
                    log.date = getCanonicalDateKey(log.date);
                    allLogs.push(log);
                }
            }
        }
    }

    // 2. Scan Local 'Activity Logs'
    // This is where NEW logs come in from the Dashboard (Schema: Name, Date, Category, Summary, Proof, File)
    const actSheet = ss.getSheetByName("Activity Logs");
    if (actSheet && actSheet.getLastRow() > 1) {
        const aData = actSheet.getDataRange().getDisplayValues();
        // Skip Header
        for (let r = 1; r < aData.length; r++) {
            const rowName = aData[r][0]; // Col A is Name

            if (areNamesEquivalent(rowName, name)) {
                allLogs.push({
                    date: getCanonicalDateKey(aData[r][1]), // Col B is Date (Normalized)
                    name: rowName,
                    course: aData[r][2] || "Learning", // Col C is Category
                    time: "",
                    issues: "No",
                    learning: aData[r][3] || "", // Col D is Summary
                    proof: aData[r][4] || "",
                    file: aData[r][5] || "",
                    source: 'Activity Logs'
                });
            }
        }
    }

    console.log(`[getHistory] Total Logs Found: ${allLogs.length}`);

    // Sort by Date (Desc - Newest First)
    allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    return ContentService.createTextOutput(JSON.stringify(allLogs)).setMimeType(ContentService.MimeType.JSON);
}

// --- UTILITY: FORMAT IMPORTRANGE DATA (Make it look good!) ---
function formatGroupsSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_GROUPS);
    if (!sheet) return "Sheet not found";

    // 1. CLEAR OLD FORMATS (Keep Data)
    const fullRange = sheet.getDataRange();
    fullRange.clearFormat();

    // 2. HEADER STYLING (Assuming Row 2 based on your screenshot)
    // We'll find the last column dynamically
    const lastCol = sheet.getLastColumn();
    if (lastCol < 2) return "No data found to format";

    // Header Range: Row 2, from Col 2 (B) to Last Col
    const headerRange = sheet.getRange(2, 2, 1, lastCol - 1);
    headerRange
        .setFontWeight("bold")
        .setFontSize(11)
        .setBackground("#93c47d") // Nice Green (like screenshot)
        .setFontColor("black")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setWrap(true)
        .setBorder(true, true, true, true, true, true, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // 3. TABLE BODY STYLING
    const lastRow = sheet.getLastRow();
    if (lastRow > 2) {
        const bodyRange = sheet.getRange(3, 2, lastRow - 2, lastCol - 1);
        bodyRange
            .setFontSize(10)
            .setVerticalAlignment("middle")
            .setWrap(true)
            .setBorder(true, true, true, true, true, true, "#555555", SpreadsheetApp.BorderStyle.SOLID); // Thin grey borders

        // 4. ALTERNATING COLORS (For readability)
        // Since we can't copy source colors with IMPORTRANGE, we use a clean alternating pattern
        bodyRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
    }

    // 5. RESIZE
    sheet.setRowHeight(2, 40); // Taller Header
    sheet.autoResizeColumns(2, lastCol - 1);

    return "Formatted Successfully! (Green Headers + Borders + Alternating Colors)";
}

function getProfile(name) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PROFILES);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    // Use Strict Token Match
    const row = data.find(r => areNamesEquivalent(r[0], name));

    if (row) {
        return ContentService.createTextOutput(JSON.stringify({
            name: row[0],
            bio: row[1],
            photo: row[2],
            linkedin: row[3],
            instagram: row[4]
        })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
}


// --- HELPER: STRICT TOKEN MATCHING ---
// Matches "Test" with "Test User", but NOT with "Contest"
// --- HELPER: STRICT TOKEN MATCHING (ROBUST FUZZY) ---
// Matches "Mulkala Laxmanacharry" with "Mulkala Laxman" OR "Laxmanacharry Mulkala"
function areNamesEquivalent(name1, name2) {
    if (!name1 || !name2) return false;
    const n1 = String(name1).toLowerCase().trim();
    const n2 = String(name2).toLowerCase().trim();

    // 1. Exact Match (Fast Path)
    if (n1 === n2) return true;

    // 2. Token Matching (Set Intersection)
    // Remove special chars, keep only letters/numbers
    const clean1 = n1.replace(/[^a-z0-9\s]/g, "");
    const clean2 = n2.replace(/[^a-z0-9\s]/g, "");

    const tokens1 = clean1.split(/\s+/).filter(t => t.length > 1); // Ignore single chars like initials for now unless necessary
    const tokens2 = clean2.split(/\s+/).filter(t => t.length > 1);

    if (tokens1.length === 0 || tokens2.length === 0) return false;

    // Count Matches
    let matchCount = 0;
    let exactMatchCount = 0;
    const tokens2Set = new Set(tokens2);

    // Check tokens from Name1 against Name2
    for (const t1 of tokens1) {
        // Direct match
        if (tokens2Set.has(t1)) {
            matchCount++;
            exactMatchCount++;
            continue;
        }
        // Partial Sub-match (e.g. "Laxman" inside "Laxmanacharry")
        // Only if token is significant length (>3)
        if (t1.length > 3) {
            for (const t2 of tokens2) {
                if (t2.includes(t1) || t1.includes(t2)) {
                    matchCount++;
                    break;
                }
            }
        }
    }

    // DECISION LOGIC
    // 1. If we have 2 or more matching tokens, it's a very strong match (First + Last Name usually)
    if (matchCount >= 2) return true;

    // 2. If one name ONLY has 1 token and it matches (e.g. "Mulkala" vs "Mulkala")
    // [FIX] Require EXACT match for single tokens to avoid "Kanishk" matching "Kanishka"
    if (matchCount === 1 && (tokens1.length === 1 || tokens2.length === 1)) {
        return exactMatchCount > 0;
    }

    // 3. High Ratio Match (e.g. 2 out of 3 tokens match)
    const minLen = Math.min(tokens1.length, tokens2.length);
    if (minLen > 0 && (matchCount / minLen) >= 0.6) return true;

    return false;
}


// --- NEW: PROFILE PHOTO UPLOAD (Called by saveProfile) ---
function saveProfile(data) {
    const { name, internId, bio, photo, linkedin, instagram } = data;

    // [SECURITY] Verify User
    if (!isValidUser(name, internId)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid Intern ID" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

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

// --- UPDATED SUBMIT log WITH FILE UPLOAD ---
function submitLog(data) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_LOGS);
        sheet.appendRow(["Name", "Date", "Category", "Summary", "Proof", "File"]);
    }
    const { name, internId, date, proof, file } = data;

    // [SECURITY] Verify User
    if (!isValidUser(name, internId)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid Intern ID" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // [FIX] Robust Key Handling (Frontend might send 'course' or 'learning')
    const category = data.category || data.course || "Learning";
    const summary = data.summary || data.learning || "";

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
    // &sz=s1000 ensures we get a high-quality "poster" image (s=size, w=width)
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=s1000";
}

// --- NEW: SETUP M1-M10 TABS (Run ONCE) ---
function setupMonitorTabs() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Source Sheet ID (Monitor Logs)
    const SOURCE_ID = "1vUpOql7mrmigvMvegpP2jS03t-1JGMHnvIHWye3Cwls";

    for (let i = 1; i <= 10; i++) {
        const tabName = `M${i}`;
        let sheet = ss.getSheetByName(tabName);

        if (!sheet) {
            sheet = ss.insertSheet(tabName);
        } else {
            sheet.clear(); // Clear old data/formulas
        }

        // 1. Insert IMPORTRANGE Formula in A1
        // Imports the entire column range A:Z from the corresponding tab in the source
        const formula = `=IMPORTRANGE("${SOURCE_ID}", "${tabName}!A:Z")`;
        sheet.getRange("A1").setFormula(formula);

        // 2. Format Header (Row 1) - Visual Polish
        // Note: IMPORTRANGE loads data dynamically, so formatting might apply to the loading text first.
        // We apply static formatting to Row 1 assuming headers will land there.
        const headerRange = sheet.getRange(1, 1, 1, 10); // Format first 10 cols
        headerRange
            .setBackground("#5c2b9a") // Deep Purple (similar to screenshot)
            .setFontColor("white")
            .setFontWeight("bold")
            .setFontSize(11)
            .setVerticalAlignment("middle")
            .setHorizontalAlignment("center")
            .setBorder(true, true, true, true, true, true, "black", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

        sheet.setRowHeight(1, 35);

        // Optional: Freeze Top Row
        sheet.setFrozenRows(1);

        // Log
        console.log(`Setup complete for ${tabName}`);
    }

    return "Tabs M1 to M10 created/updated with IMPORTRANGE formulas.";
}

// --- DEBUGGING TOOL ---
function debugSystem() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const m1 = ss.getSheetByName("M1");
    if (!m1) return "ERROR: Tab M1 not found.";

    const rows = m1.getLastRow();
    const data = m1.getRange(1, 1, Math.min(rows, 5), 5).getValues(); // Read top 5 rows

    let result = `M1 Status: Found ${rows} rows.\n`;
    result += `Top Data Check:\n`;
    data.forEach((row, i) => {
        result += `Row ${i + 1}: [${row.join(", ")}]\n`;
    });

    // Check 'Test' user matching
    const testName = "Test";
    if (rows > 1) {
        const row2Name = data[1][2]; // Row 2, Col C
        const isMatch = areNamesEquivalent(row2Name, testName);
        result += `\nMatch Check: '${row2Name}' vs '${testName}' => ${isMatch}`;
    }

    return result;
}

// --- DEBUGGING TOOL ---
function debugSystem() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Check M1 Tab
    const m1 = ss.getSheetByName("M1");
    if (!m1) {
        console.log("CRITICAL ERROR: Tab 'M1' is missing.");
        return;
    }
    const rows = m1.getLastRow();
    // Read first 3 rows to check specific columns
    const data = m1.getRange(1, 1, Math.min(rows, 3), 10).getValues();

    console.log(`[Diagnostic] M1 Tab Check: Found ${rows} rows.`);
    console.log(`[Diagnostic] Row 1 (Header): ${JSON.stringify(data[0])}`);
    if (data.length > 1) {
        console.log(`[Diagnostic] Row 2 (Data):   ${JSON.stringify(data[1])}`);
        console.log(`[Diagnostic] User in Row 2:  '${data[1][2]}'`); // Index 2 = Name
    }

    // 2. Test getHistory Logic Directly
    const testUser = "Pranali Nikhil Solaskar"; // Taken from your previous debug log
    console.log(`\n[Diagnostic] Testing getHistory('${testUser}')...`);

    try {
        const responseEntry = getHistory(testUser);
        const jsonString = responseEntry.getContent();
        const parsed = JSON.parse(jsonString);

        console.log(`[Diagnostic] Result Count: ${parsed.length}`);

        if (parsed.length > 0) {
            console.log("SUCCESS! Found logs. Sample:", parsed[0]);
        } else {
            console.log("FAILURE! Returned 0 logs. Checking Name Matching...");
            // Debug the match specifically
            if (data.length > 1) {
                const sheetName = data[1][2];
                const cleanSheet = String(sheetName).toLowerCase().trim();
                const cleanTest = String(testUser).toLowerCase().trim();
                console.log(`   Sheet Name Clean: '${cleanSheet}'`);
                console.log(`   Test User Clean:  '${cleanTest}'`);
                console.log(`   areNamesEquivalent: ${areNamesEquivalent(sheetName, testUser)}`);
            }
        }
    } catch (e) {
        console.log("CRITICAL ERROR in getHistory execution: " + e.toString());
    }
}