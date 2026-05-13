# Manually Removing a User

To completely remove a voter from the system, you must delete their records from the PostgreSQL database and their biometric data from the ML service. 
*(Note: Blockchain records are immutable. You cannot delete a voter's history from the Fabric ledger, but removing them from the DB and ML service prevents them from authenticating or casting future votes).*

## Step 1: Remove User from PostgreSQL
1. Open a terminal on the server.
2. Connect to the PostgreSQL database:
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -d votechain
```
3. Find the user's `id` or `voter_id`:
```sql
SELECT id, full_name, voter_id FROM users;
```
4. Delete the user (for example, deleting voter `V004`):
```sql
DELETE FROM users WHERE voter_id = 'V004';
```
*(Warning: This may fail if the user has foreign key constraints tied to the `votes` table. If so, you must delete their vote receipts first, though doing so breaks local auditing).*

## Step 2: Delete Fingerprint from ML Service
The ML service currently stores enrolled fingerprints as physical `.png` files in the `backend-ml/data/fingerprints/` directory.

1. Navigate to the ML data folder:
```bash
cd backend-ml/data/fingerprints/
```
2. Delete the associated fingerprint file:
```bash
rm V004.png
```
3. Restart the ML Service so it clears its in-memory biometric templates:
```bash
# If using the tmux script, simply switch to Pane 1 and press Ctrl+C, then up-arrow to restart uvicorn.
```
