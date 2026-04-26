# Creating an Admin User

By default, all users who register via the frontend are assigned the `VOTER` role. To access the Admin Dashboard, a user must have the `ADMIN` role in the PostgreSQL database.

## Option 1: Direct SQL Method (No Fingerprint/UI Needed)

This is the fastest way to create an admin account directly from the server terminal. This bypasses the frontend entirely, so no fingerprint or biometric data is required.

Run this command to create an admin with the password `password123`:

```bash
sudo -u postgres psql -d votechain -c "INSERT INTO users (full_name, email, password, voter_id, role) VALUES ('System Admin', 'admin@test.com', '\$2a\$10\$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymGe07xd00DMxs.TVuHOnu', 'ADMIN001', 'ADMIN');"
```

*Note: The password is pre-hashed using BCrypt. You can change the email and name in the command if desired.*

---

## Option 2: Promote an Existing User

If you have already registered a user via the frontend and want to promote them:

### Step 1: Run the Update Command
Run the following command in your terminal:

```bash
sudo -u postgres psql -d votechain -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@test.com';"
```

*(Replace `admin@test.com` with the actual email used.)*

### Step 2: Verify the Change
```bash
sudo -u postgres psql -d votechain -c "SELECT email, role FROM users WHERE email = 'admin@test.com';"
```

---

## Logging In
Once the user exists in the database with the `ADMIN` role, simply go to the login page on the frontend. After logging in, you will see the **"Admin"** link in the navigation bar.

---

## FAQ

### Will my admin work if I wipe the blockchain?
**Yes.** The user accounts are stored in the PostgreSQL database on your host machine. Running `docker volume rm` only wipes the Hyperledger Fabric ledger (votes, candidates, etc.), but it does **not** delete your user accounts. Your admin login will continue to work.

### How do I revert an admin to a voter?
Simply run the update command again with the `VOTER` role:
```bash
sudo -u postgres psql -d votechain -c "UPDATE users SET role = 'VOTER' WHERE email = 'admin@test.com';"
```
