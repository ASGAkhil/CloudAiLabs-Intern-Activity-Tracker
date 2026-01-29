# Mobile Testing Instructions

To run the app on your mobile device next time, follow these **two steps**. You need to keep **two separate terminals** open.

### Step 1: Start the App (Terminal 1)
Run this command to start your local server.
```powershell
npm run dev -- --host
```
*Wait until you see "Local: http://localhost:5173/"*

### Step 2: Create the Tunnel (Terminal 2)
Open a **new** terminal window and run this command to create the public link.
```powershell
ssh -o StrictHostKeyChecking=no -R 80:localhost:5173 serveo.net
```

### Step 3: Get the Link
The second command will print a URL (green text usually) that looks like:
`https://[random-text].serveo.net`
or
`https://[random-text].serveousercontent.com`

**Open that link on your phone.**

---

### Alternative (If the above fails)
If `serveo` isn't working, you can use the other tool we tried:
```powershell
npx localtunnel --port 5173
```
*This will give you a `loca.lt` link. You may need to enter the tunnel password (which is your IP).*

### Step 4: cleanup (Stopping Everything)
When you are done for the day:
1.  Click inside the terminal window.
2.  Press **`Ctrl + C`** on your keyboard (sometimes you need to press it twice).
3.  Type `y` and Enter if asked "Terminate batch job?".
4.  Do this for **both** terminal windows.
