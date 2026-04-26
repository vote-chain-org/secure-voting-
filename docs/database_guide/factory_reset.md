# Total Factory Reset Guide

This guide explains how to perform a **Hard Reset** of the entire VoteChain system. 

Running these steps will wipe **EVERYTHING**:
- All Registered Users & Admins (from PostgreSQL)
- All Votes (from PostgreSQL)
- The entire Blockchain Ledger (from Hyperledger Fabric)
- All Candidates (from the Blockchain)

Use this when you want a completely fresh slate for a new demonstration or if your database and blockchain have become unsynced during testing.

---

## Step 1: Stop the Server
Ensure that the Spring Boot backend and React frontend are stopped. 
If you are running `./run_server_v2.sh`, press `Ctrl+C` in your terminal to stop it.

## Step 2: Wipe the Blockchain (Fabric)
You need to delete the Docker containers and, most importantly, the persistent data volumes where the blockchain saves its ledger.

Run this from your `final_project` directory:
```bash
cd docker
docker compose -f docker-compose-network.yml down -v --remove-orphans
cd ..
```
*(The `-v` flag is critical here: it tells Docker to delete the volumes storing the CouchDB world state and the Fabric block files).*

## Step 3: Wipe the PostgreSQL Database
Since PostgreSQL is running natively on your Ubuntu system (not in Docker), we need to clear it manually. 

The easiest and cleanest way to wipe all users and votes is to drop the entire database and recreate it empty. Spring Boot will automatically recreate the `users` and `votes` tables the next time you start the server.

Run these commands in your terminal:
```bash
# 1. Drop the existing database (this deletes all tables and data)
sudo -u postgres psql -c "DROP DATABASE votechain;"

# 2. Recreate an empty database
sudo -u postgres psql -c "CREATE DATABASE votechain;"
```

## Step 3.5: Wipe Fingerprint Data
To ensure that biometric verification logic doesn't retain old data, wipe the locally stored PNG fingerprints in the ML service.

```bash
# Clear the ML service fingerprints directory
rm -rf backend-ml/data/fingerprints/*
```

## Step 4: Restart the System
Now that both the blockchain and the database are completely empty, you can start the system normally.

```bash
./run_server_v2.sh
```

### What happens on restart?
1. **Spring Boot** will connect to the empty `votechain` database and automatically generate the `users` and `votes` tables (because of `spring.jpa.hibernate.ddl-auto=update`).
2. **Fabric** will generate a new genesis block, create a new `electionchannel`, and deploy a fresh `voting` chaincode.
3. You will have 0 users and 0 votes. You will need to create a new Admin account and register voters from scratch.
