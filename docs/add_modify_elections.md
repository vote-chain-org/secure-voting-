# Adding or Modifying Elections

In the current architecture of the VoteChain prototype, elections and candidates are stored as a hardcoded JSON object in the React frontend. To add a new election or modify an existing one, you must edit the source code directly.

## Step-by-Step Instructions

1. **Locate the Data Source**
   Open the file `frontend/src/pages/ElectionDetail.jsx` in your code editor.

2. **Find the `electionData` Object**
   Around line 22, you will see a constant defined as `const electionData = { ... };`.
   This object contains all the election details and their respective candidates.

3. **Add a New Election**
   To add a new election, append a new key-value pair to the `electionData` object. The key should be a unique ID (e.g., `4`), and the value should be an object following this structure:

   ```javascript
   4: {
     id: 4,
     title: "Computer Science Dept Election",
     region: "Main Campus",
     location: "CS Building, Room 101",
     date: "25 May 2025",
     time: "9:00 AM – 3:00 PM",
     status: "Upcoming", // "Live", "Upcoming", or "Closed"
     eligibleCollege: "Computer Science Department",
     img: "https://images.unsplash.com/photo-example", // URL to a cover image
     about: "Election for the CS Department Representative.",
     candidates: [
       {
         id: 1, // Must match the candidate ID registered on the blockchain
         name: "Alice Smith",
         role: "Representative",
         dept: "B.Tech CS, Year 3",
         img: "https://images.unsplash.com/photo-candidate1",
         manifesto: "Better lab equipment and hackathons."
       },
       {
         id: 2, // Must match the candidate ID registered on the blockchain
         name: "Bob Jones",
         role: "Representative",
         dept: "B.Tech CS, Year 2",
         img: "https://images.unsplash.com/photo-candidate2",
         manifesto: "More study spaces and extended library hours."
       }
     ]
   }
   ```

4. **Update Homepage Display**
   If you added a new election, you must also add it to the `elections` array in `frontend/src/pages/Homepage.jsx` (around line 24) so it appears on the landing page cards. Follow the exact same structure used for the existing elections there.

5. **Blockchain Synchronization (CRITICAL)**
   If you add **new candidates** (e.g., candidates with IDs that don't currently exist in your Fabric ledger), you **must** register those candidates on the blockchain manually, or update `run_server_v2.sh` to include them in the seeding script!
   *See `docs/low-level/manual_processes_index.md` for instructions on registering candidates manually.*

6. **Restart Frontend**
   After making changes, stop the React frontend and restart it (`npm start` or via the tmux script) for the changes to take effect.
