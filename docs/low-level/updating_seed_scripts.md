# Retaining Blockchain Edits on Fresh Boots

When you modify the frontend `ElectionDetail.jsx` to add new candidates, or when you manually register a new voter, those changes are lost if you ever run `./run_server_v2.sh stop` or `./tmux_votechain.sh stop` (which tears down the Docker network). 

To ensure that your new candidates and test voters are **automatically re-seeded** into the fresh Blockchain, PostgreSQL DB, and ML Service on every future boot, you must update the seed data arrays in your startup scripts.

## Updating `run_server_v2.sh`

Open `run_server_v2.sh` and locate **Step 7.5 — Seeding Test Data** (around Line 374).

### 1. Adding Permanent Candidates
If you added Candidate ID `5` named "Jane Doe" to an election:
1. Find the following line (around Line 460):
   ```bash
   declare -A CANDIDATES=([1]="Priya Sharma" [2]="Arjun Kulkarni" [3]="Sneha Patil" [4]="Rohan Desai")
   ```
2. Append your new candidate to the associative array:
   ```bash
   declare -A CANDIDATES=([1]="Priya Sharma" [2]="Arjun Kulkarni" [3]="Sneha Patil" [4]="Rohan Desai" [5]="Jane Doe")
   ```
3. Update the `for` loop iteration immediately below it to include the new ID:
   ```bash
   for CID in 1 2 3 4 5; do
   ```

### 2. Adding Permanent Test Voters
If you want the system to always boot with a test voter `V004`:
1. Update the loop generating the PostgreSQL users (around Line 422):
   ```bash
   for i in 1 2 3 4; do
   ```
2. Update the loop registering voters on the Blockchain (around Line 447):
   ```bash
   for i in 1 2 3 4; do
   ```
3. Update the Python mock fingerprint generation arrays (around Lines 383 and 408):
   ```python
   voters = ['V001', 'V002', 'V003', 'V004']
   ```

## Updating `tmux_votechain.sh`
If you use the `tmux_votechain.sh` launcher, you must make these exact same updates to the large `tmux send-keys` block for **Pane 0** (around Line 132 in that script), as it contains a direct copy of the seeding logic.

By keeping these scripts in sync with your frontend React data, you ensure your test environments can be torn down and rebuilt endlessly without losing your new structural election data!
