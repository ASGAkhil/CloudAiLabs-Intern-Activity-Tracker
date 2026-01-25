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
            // } else if (action === "syncMonitorPermissions") {
            //    return syncMonitorPermissions();
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
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Feature Disabled by Admin" })).setMimeType(ContentService.MimeType.JSON);
    /*
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
    */
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

    // Find "Email" Column in Users Sheet
    const userHeaders = sheetUsers.getRange(1, 1, 1, sheetUsers.getLastColumn()).getValues()[0];
    let userEmailColIndex = -1;
    for (let i = 0; i < userHeaders.length; i++) {
        if (String(userHeaders[i]).toLowerCase().trim() === "email") {
            userEmailColIndex = i;
            break;
        }
    }

    // Get Users Data - Grab ALL columns to ensure we get Email (simplest)
    const userDataRaw = sheetUsers.getRange(2, 1, sheetUsers.getLastRow() - 1, sheetUsers.getLastColumn()).getValues();

    // Create a lightweight lookup list with Email
    const userLookup = userDataRaw.map(r => ({
        name: r[0],
        email: (userEmailColIndex > -1 && r[userEmailColIndex]) ? String(r[userEmailColIndex]).toLowerCase().trim() : "",
        row: r
    }));

    // Get Logs for aggregation
    const sheetLogs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    const userStats = {}; // Map: Canonical Name -> Set(Dates)

    // --- AGGREGATION LOGIC ---

    // 1. Process Legacy "Student Activity" (Schema: Col A=Name, Col B=Timestamp) - NO EMAIL
    const sheetLegacy = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Student Activity");
    if (sheetLegacy && sheetLegacy.getLastRow() >= 2) {
        const legData = sheetLegacy.getRange(2, 1, sheetLegacy.getLastRow() - 1, 2).getDisplayValues();
        legData.forEach(row => {
            const name = row[0];
            const dateStr = row[1];
            // Legacy has no email, pass null
            if (name && dateStr) processLogEntry(userLookup, userStats, name, null, dateStr);
        });
    }

    // 2. Process "M1-M10" (Schema: Col A=Timestamp, Col B=Email, Col C=Name)
    const mSources = [];
    for (let i = 1; i <= 10; i++) mSources.push(`M${i}`);

    mSources.forEach(tabName => {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
        if (sheet && sheet.getLastRow() > 1) {
            // Read Col A(Date), B(Email), C(Name)
            const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getDisplayValues();
            data.forEach(row => {
                const dateStr = row[0];
                const email = row[1];
                const name = row[2];
                if (dateStr) processLogEntry(userLookup, userStats, name, email, dateStr);
            });
        }
    });

    // 3. Process "Activity Logs" (Schema: Col A=Name, Col B=Date, Col ... Email?)
    // Activity Logs schema: Name(0), Date(1), Course(2), Summary(3), Proof(4), File(5), Duration(6). No Email explicitly stored in early versions?
    // Wait, normalizeLog says: [timestamp, email, name...] for M-tabs.
    // Let's check Activity Logs structure. It's usually: Name, Date, Category, Summary...
    // The 'submitLog' function does NOT currently save Email to "Activity Logs" sheet. It only saves Name.
    // So for Activity Logs, we must rely on Name.
    const actSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Activity Logs");
    if (actSheet && actSheet.getLastRow() > 1) {
        const data = actSheet.getRange(2, 1, actSheet.getLastRow() - 1, 2).getDisplayValues();
        data.forEach(row => {
            const name = row[0];
            const dateStr = row[1];
            if (name && dateStr) processLogEntry(userLookup, userStats, name, null, dateStr);
        });
    }

    function processLogEntry(userList, statsMap, rawName, rawEmail, dateValue) {
        if (!dateValue || dateValue === "") return;

        const dateKey = getCanonicalDateKey(dateValue);
        if (!dateKey) return;

        // CHECK 1: Email Match (Highest Priority)
        if (rawEmail && String(rawEmail).includes("@")) {
            const cleanEmail = String(rawEmail).toLowerCase().trim();
            const emailMatch = userList.find(u => u.email === cleanEmail);
            if (emailMatch) {
                addToStats(statsMap, emailMatch.name, dateKey);
                return;
            }
        }

        // CHECK 2: Name Match (Fallback)
        if (!rawName) return;

        // Exact match optimization
        if (statsMap[rawName]) {
            addToStats(statsMap, rawName, dateKey);
            return;
        }

        // Fuzzy Match
        const matchUser = userList.find(u => areNamesEquivalent(u.name, rawName));
        if (matchUser) {
            addToStats(statsMap, matchUser.name, dateKey);
        } else {
            // Unrecognized user (add as is)
            addToStats(statsMap, rawName, dateKey);
        }
    }

    function addToStats(map, officialName, dKey) {
        if (!map[officialName]) map[officialName] = new Set();
        map[officialName].add(dKey);
        // Track Latest
        if (!map[officialName].latest || new Date(dKey) > new Date(map[officialName].latest)) {
            map[officialName].latest = dKey;
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

    const users = userLookup.map(u => {
        const name = u.name;
        const row = u.row;
        const daysCount = userStats[name] ? userStats[name].size : 0;
        const photoUrl = userPhotos[name] || "";

        // Robust Checkbox Check
        const colVal = (monitorColIndex > -1) ? row[monitorColIndex] : false;
        const isMonitor = (colVal === true || String(colVal).toLowerCase() === "true");

        return {
            name: name,
            internId: String(row[1]),
            status: row[2],
            role: "user",
            daysCompleted: daysCount,
            lastLogDate: userStats[name] && userStats[name].latest ? userStats[name].latest : "",
            photo: photoUrl,
            isMonitor: isMonitor,
            hasCourseAccess: isMonitor
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

    // 3. Send Email (HTML Template)
    const subject = "Your CloudAiLabs Intern ID 🆔";

    // Banner ID from User (1doBwaupXjjT6UEL84AsXoYfGTLdxdTOp)
    // Using thumbnail endpoint for reliable embedding without complex permissions sometimes
    const bannerUrl = "https://drive.google.com/thumbnail?id=1doBwaupXjjT6UEL84AsXoYfGTLdxdTOp&sz=w1200";

    const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        
        <!-- HEADER / BANNER -->
        <div style="background-color: #0f172a; text-align: center;">
            <img src="${bannerUrl}" alt="CloudAiLabs Banner" style="width: 100%; height: auto; display: block; object-fit: cover;" />
        </div>

        <!-- BODY -->
        <div style="padding: 40px 30px; background-color: #ffffff;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 24px;">Hello ${foundUser.name},</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                Welcome to the <strong>CloudAiLabs Internship Program</strong>. We are excited to have you on board!
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                To access your daily activity tracker and dashboard, please use the secure Intern ID below. Do not share this ID with others.
            </p>

            <!-- ID CARD -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); margin: 30px 0; padding: 25px; border-radius: 12px; text-align: center; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Your Intern ID</p>
                <h1 style="margin: 10px 0 0 0; font-size: 32px; letter-spacing: 2px; font-family: monospace; font-weight: 700;">${foundUser.id}</h1>
            </div>

            <p style="color: #475569; font-size: 14px; text-align: center;">
                Use this ID to login at the dashboard portal.
            </p>
        </div>

        <!-- FOOTER -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #334155;">CloudAiLabs Team</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Bridging Cloud Innovation and Career-Ready Talent</p>
            <div style="margin-top: 15px;">
                <a href="mailto:akhil@cloudailabs.in" style="color: #0ea5e9; text-decoration: none; font-size: 12px; margin: 0 10px;">Contact Support</a>
                <a href="https://www.cloudailabs.in" style="color: #0ea5e9; text-decoration: none; font-size: 12px; margin: 0 10px;">Website</a>
            </div>
            <p style="margin-top: 20px; font-size: 10px; color: #94a3b8;">
                © 2026 CloudAiLabs. All rights reserved.
            </p>
        </div>
    </div>
    `;

    try {
        MailApp.sendEmail({
            to: inputEmail,
            subject: subject,
            htmlBody: htmlBody
        });
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "ID sent to email." })).setMimeType(ContentService.MimeType.JSON);
    } catch (e) {
        return ContentService.createTextOutput(JSON.stringify({ error: "Email failed: " + e.message })).setMimeType(ContentService.MimeType.JSON);
    }
}



// --- NEW: Robust Date Normalizer (Global Scope) ---
// --- NEW: Robust Date Normalizer (LITERAL / FACE VALUE) ---
function getCanonicalDateKey(dateValue) {
    if (!dateValue || dateValue === "") return "";

    // [CHANGE] Convert TO STRING immediately to check 'Face Value' from getDisplayValues()
    let str = String(dateValue).trim();
    if (str.includes("•")) str = str.replace(/•/g, " ");

    // 1. Try Regex for Date Parts: (\d) [/-] (\d) [/-] (\d4)
    const dmyPattern = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/;
    const matchDMY = str.match(dmyPattern);

    if (matchDMY) {
        let p1 = parseInt(matchDMY[1]); // Part 1
        let p2 = parseInt(matchDMY[2]); // Part 2
        let year = matchDMY[3];

        let day, month;

        // HEURISTIC: Detect MM/DD vs DD/MM
        // Given US Sheets context causing timezone issues, we must prioritize MM/DD
        if (p1 > 12) {
            day = p1; // 24/01 -> Day 24
            month = p2;
        } else if (p2 > 12) {
            month = p1; // 01/24 -> Day 24
            day = p2;
        } else {
            // Ambiguous (e.g. 01/10) -> Default to MM/DD (US Standard)
            // This fixes "Oct 1" appearing when user meant "Jan 10" in a US Sheet
            month = p1;
            day = p2;
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // 2. Fallback: Parse via Date object (Least desired, but necessary for weird formats)
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, "GMT+05:30", "yyyy-MM-dd");
    }

    return null;
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
        duration: row[4] || "", // [RENAME] time -> duration (Hours)
        issues: row[5] || "No",
        learning: row[6] || "",
        source: source
    };
};

// --- NEW: Helper to Extract Time String (LITERAL / FACE VALUE) ---
function getTimeString(dateValue) {
    if (!dateValue || dateValue === "") return "";

    // [CHANGE] Literal String Parsing
    let str = String(dateValue).trim().replace(/•/g, " ");

    // Regex for Time: matches "21:30" or "9:30 PM"
    // Capture: HH, MM, SS(opt), AM/PM(opt)
    const timeReg = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/;
    const match = str.match(timeReg);

    if (match) {
        let hh = parseInt(match[1]);
        const mm = match[2];
        const ampmVal = match[4] ? match[4].toUpperCase() : null;

        if (ampmVal) {
            return `${String(hh).padStart(2, '0')}:${mm} ${ampmVal}`;
        } else {
            // 24h format found -> Convert to 12h
            const suffix = hh >= 12 ? "PM" : "AM";
            hh = hh % 12 || 12;
            return `${String(hh).padStart(2, '0')}:${mm} ${suffix}`;
        }
    }

    // Fallback: Date Object if string parsing fails (e.g. ISO string)
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, "GMT+05:30", "hh:mm a");
    }
    return "";
}


function getHistory(name, internId) {
    if (!name) return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);

    // [SECURITY Bypass for Admin]
    if (!isValidUser(name, internId) && internId !== "CIALAbhayAkhil@2025") {
        return ContentService.createTextOutput("[]").setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let allLogs = [];

    // 0. FETCH USER EMAIL (Robust Matching like getUsers)
    const sheetUsers = ss.getSheetByName(SHEET_USERS);
    let userEmail = "";
    if (sheetUsers) {
        // Find Email Column
        const uHeaders = sheetUsers.getRange(1, 1, 1, sheetUsers.getLastColumn()).getValues()[0];
        let uEmailCol = -1;
        for (let i = 0; i < uHeaders.length; i++) {
            if (String(uHeaders[i]).toLowerCase().trim() === "email") {
                uEmailCol = i;
                break;
            }
        }

        if (uEmailCol > -1) {
            // Find User Row
            const uData = sheetUsers.getDataRange().getValues();
            // Skip header
            for (let i = 1; i < uData.length; i++) {
                if (areNamesEquivalent(uData[i][0], name)) {
                    if (uData[i][uEmailCol]) {
                        userEmail = String(uData[i][uEmailCol]).toLowerCase().trim();
                    }
                    break;
                }
            }
        }
    }

    // 1. Scan M1 to M10
    // These are the "Read Only" tabs from the monitors
    for (let i = 1; i <= 10; i++) {
        const sheet = ss.getSheetByName(`M${i}`);
        if (sheet && sheet.getLastRow() > 1) {
            // [FIX] Use getDisplayValues() to get "Face Value" Strings (Avoids Timezone Shifts)
            const data = sheet.getDataRange().getDisplayValues();
            // Skip Header (Row 1)
            for (let r = 1; r < data.length; r++) {
                const rowName = data[r][2]; // Col C is Name
                const rowEmail = data[r][1] ? String(data[r][1]).toLowerCase().trim() : ""; // Col B is Email

                // MATCH LOGIC: Name OR Email (Robust)
                const isNameMatch = areNamesEquivalent(rowName, name);
                const isEmailMatch = (userEmail !== "" && rowEmail === userEmail && rowEmail.includes("@"));

                if (isNameMatch || isEmailMatch) {
                    const log = normalizeLog(data[r], `M${i}`);

                    // [FIX] Normalize Date for Frontend
                    const cDate = getCanonicalDateKey(log.date);
                    // [NEW] Extract Time
                    const cTime = getTimeString(data[r][0]); // Col A is Timestamp (Raw Date Object)

                    if (cDate) { // Only add if date is valid
                        log.date = cDate;
                        log.time = cTime; // [NEW] Populate Time
                        allLogs.push(log);
                    }
                }
            }
        }
    }

    // 2. Scan Legacy 'Student Activity' - REMOVED (Caused "Program Start" / "Year 202757" Bug)
    // We strictly only show actual logs from M-tabs and Activity Logs now.


    // 3. Scan Local 'Activity Logs'
    // This is where NEW logs come in from the Dashboard
    const actSheet = ss.getSheetByName("Activity Logs");
    if (actSheet && actSheet.getLastRow() > 1) {
        // [FIX] Use getDisplayValues() to get RAW Strings (Face Value)
        const aDataRaw = actSheet.getDataRange().getDisplayValues();

        // Skip Header
        for (let r = 1; r < aDataRaw.length; r++) {
            const rowName = aDataRaw[r][0]; // Col A is Name
            const dateVal = aDataRaw[r][1]; // Col B is Date String

            // For Activity Logs, we only have Name (no email stored currently).
            if (areNamesEquivalent(rowName, name)) {
                const cDate = getCanonicalDateKey(dateVal);
                const cTime = getTimeString(dateVal); // [NEW] Extract Time

                if (cDate) {
                    allLogs.push({
                        date: cDate,
                        name: rowName,
                        course: aDataRaw[r][2] || "Learning",
                        time: cTime, // Submission Time (e.g. 10:30 AM)
                        duration: aDataRaw[r][6] || "", // [NEW] Duration from Col G (Index 6)
                        issues: "No",
                        learning: aDataRaw[r][3] || "",
                        proof: aDataRaw[r][4] || "",
                        file: aDataRaw[r][5] || "",
                        source: 'Activity Logs'
                    });
                }
            }
        }
    }

    console.log(`[getHistory] Total Logs Found OLD: ? -> NEW: ${allLogs.length}`);

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

    const tokens1 = clean1.split(/\s+/).filter(t => t.length > 1);
    const tokens2 = clean2.split(/\s+/).filter(t => t.length > 1);

    if (tokens1.length === 0 || tokens2.length === 0) return false;

    // Count Matches
    let matchCount = 0;
    const tokens2Set = new Set(tokens2);

    for (const t1 of tokens1) {
        // Direct match ONLY (Strict Mode)
        if (tokens2Set.has(t1)) {
            matchCount++;
        }
    }

    const minLen = Math.min(tokens1.length, tokens2.length);
    const maxLen = Math.max(tokens1.length, tokens2.length);

    // DECISION LOGIC

    // 1. Full Subset Match (e.g. "Shivam Kumar" inside "Shivam Kumar Jha")
    if (matchCount === minLen) return true;

    // 2. High Ratio Match for Longer Names
    if (maxLen >= 3) {
        if ((matchCount / maxLen) > 0.7) return true;
        return false;
    }

    // 3. Fallback for Short Names (len 2)
    if (matchCount >= 2) return true;

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
// --- UPDATED SUBMIT log WITH FILE UPLOAD ---
function submitLog(data) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOGS);
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_LOGS);
        // [UPDATE] Added "Duration" to header
        sheet.appendRow(["Name", "Date", "Category", "Summary", "Proof", "File", "Duration"]);
    }
    const { name, internId, date, proof, file } = data;

    // [SECURITY] Verify User
    if (!isValidUser(name, internId)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid Intern ID" }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    // [FIX] Robust Key Handling
    const category = data.category || data.course || "Learning";
    const summary = data.summary || data.learning || "";
    const duration = data.time || ""; // [NEW] Capture Duration/Time Spent

    // 1. Handle Issue File (Conditional)
    let fileUrl = "";
    if (file && file.toString().includes("base64,")) {
        try {
            const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
            const subFolder = getOrCreateSubfolder(mainFolder, "Daily Tracker");
            fileUrl = uploadToDriveFolder(subFolder, file, name + "_issue_" + Date.now());
        } catch (e) {
            fileUrl = "ERROR_UPLOADING: " + e.toString();
        }
    } else if (file) {
        fileUrl = file;
    }

    // 2. Handle Proof File (Optional "Proof of Work")
    let proofUrl = "";
    if (proof && proof.toString().includes("base64,")) {
        try {
            const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
            const subFolder = getOrCreateSubfolder(mainFolder, "Daily Tracker");
            proofUrl = uploadToDriveFolder(subFolder, proof, name + "_proof_" + Date.now());
        } catch (e) {
            proofUrl = "ERROR_UPLOADING: " + e.toString();
        }
    } else if (proof) {
        proofUrl = proof;
    }

    // [UPDATE] Appended Duration at Index 6 (Col G)
    sheet.appendRow([name, date, category, summary, proofUrl, fileUrl, duration]);

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

// --- NEW: SYNC EMAILS (M1-M10 -> Student Activity) ---
function syncStudentEmails() {
    const sheetUsers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
    if (!sheetUsers) return "User Sheet Missing";

    // 1. Build Map of { Name -> Email } from M1-M10
    const nameEmailMap = {};
    const mSources = [];
    for (let i = 1; i <= 10; i++) mSources.push(`M${i}`);

    mSources.forEach(tabName => {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
        if (sheet && sheet.getLastRow() > 1) {
            // M-Schema: Col A (Time), Col B (Email), Col C (Name)
            const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
            data.forEach(row => {
                const email = row[1];
                const name = row[2];
                if (name && email && String(email).includes("@")) {
                    // Prioritize latest? Or just overwrite.
                    // Map keys should be "Clean Tokens" for robustness
                    nameEmailMap[name.trim()] = email.trim();
                }
            });
        }
    });

    // 2. Scan Main User Sheet
    const dataRange = sheetUsers.getDataRange();
    const data = dataRange.getValues();
    const headers = data[0];

    // Find "Email" Column
    let emailColIndex = -1;
    for (let i = 0; i < headers.length; i++) {
        if (headers[i].toString().toLowerCase().trim() === "email") {
            emailColIndex = i;
            break;
        }
    }

    if (emailColIndex === -1) {
        // Create Email Column if missing
        emailColIndex = headers.length;
        sheetUsers.getRange(1, emailColIndex + 1).setValue("Email").setFontWeight("bold");
    }

    // 3. Update Emails
    let updates = 0;
    const updatesArray = []; // To batch update if needed, but row-by-row is safer for mixed data

    for (let i = 1; i < data.length; i++) {
        const rowName = data[i][0];
        const currentEmail = data[i][emailColIndex];

        // Only update if missing
        if (!currentEmail || currentEmail === "") {
            // MATCH LOGIC
            let foundEmail = null;

            // Strategy A: Exact Match
            if (nameEmailMap[rowName]) {
                foundEmail = nameEmailMap[rowName];
            } else {
                // Strategy B: Fuzzy/Token Match (Expensive O(N^2) but necessary)
                // We iterate our Map Keys
                const mapKeys = Object.keys(nameEmailMap);
                for (const potentialName of mapKeys) {
                    if (areNamesEquivalent(rowName, potentialName)) {
                        foundEmail = nameEmailMap[potentialName];
                        break;
                    }
                }
            }

            if (foundEmail) {
                // Write to Sheet (1-indexed row = i+1, col = emailColIndex+1)
                sheetUsers.getRange(i + 1, emailColIndex + 1).setValue(foundEmail);
                updates++;
            }
        }
    }

    return `Synced ${updates} emails successfully.`;
}

// --- DEBUGGING TOOL ---
function debugSystem() {
    console.log("[Diagnostic] Testing 'Shiva' vs 'Shivam'...");

    // Hypothesis: "Shiva" (log name) matches "Shivam Kumar Jha" (user)
    const logName = "Shiva";
    const user1 = "Shivam Kumar Jha";
    const user2 = "Shiva Rama Krishna Boga";

    console.log(`'${logName}' vs '${user1}' => ${areNamesEquivalent(logName, user1)} (Expect FALSE)`);
    console.log(`'${logName}' vs '${user2}' => ${areNamesEquivalent(logName, user2)} (Expect TRUE)`);

    // Hypothesis 2: "Shivam" (log name) matches "Shiva Rama..."
    const logName2 = "Shivam";
    console.log(`'${logName2}' vs '${user2}' => ${areNamesEquivalent(logName2, user2)} (Expect FALSE)`);
}