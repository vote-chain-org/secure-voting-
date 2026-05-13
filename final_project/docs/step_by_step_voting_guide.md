# Step-by-Step Voting Guide

This document outlines the complete voter journey from initial registration to casting a verified vote on the VoteChain platform.

## Phase 1: Registration and Enrollment

Before a voter can cast a ballot, they must be registered in the system and their biometric fingerprint must be enrolled in the Machine Learning (ML) service.

1. **Navigate to the Platform:** Open the voting UI in the browser and click the **"Sign Up"** tab on the navigation bar.
2. **Fill in Details:** Enter your Full Name, Email, Voter ID (e.g., your government or college ID number), Phone Number, and choose a Password.
3. **Scan Fingerprint:**
   - Ensure you are on the Windows laptop with the SecuGen scanner plugged in.
   - Click the **"Scan Fingerprint"** button.
   - Place your finger firmly on the scanner sensor. The scanner will illuminate and capture your print.
4. **Submit Registration:** Once the fingerprint is captured successfully (indicated by a green checkmark), click **"Create Account"**.
   - *Behind the scenes:* The frontend sends the textual data to the Spring Boot backend to create a database user, while the fingerprint image is routed to the Python ML Service for permanent enrollment tied to your Voter ID.
5. **Login:** Once successfully registered, you will be automatically redirected to the Login page. Enter your email and password to access the platform.

## Phase 2: Voting Process

With an active account and enrolled fingerprint, you are now ready to cast a vote.

1. **Select an Election:**
   - On the Homepage, browse the available active elections (marked with a green "Live" badge).
   - Click **"View Details"** on an election you wish to participate in.
2. **Review Candidates:** Read through the candidates' manifestos, departments, and roles.
3. **Initiate Vote:** Click the **"Vote >"** button next to your chosen candidate.
4. **Eligibility Verification:**
   - A modal will appear asking for your College/Institution ID and Roll Number.
   - Fill this out to confirm you are eligible for this specific election. Click **"Verify & Continue"**.
5. **Biometric Authorization:**
   - A final security modal will appear.
   - Click **"Scan Fingerprint"** and place the exact same finger you used during registration onto the scanner.
   - Once captured, click **"Verify & Vote"**.
   - *Behind the scenes:* The frontend submits the captured print to the backend, which forwards it to the ML Service. The ML Service confirms it matches your enrolled profile. If successful, the backend permanently writes the vote to the Hyperledger Fabric Blockchain.
6. **Confirmation:** If your fingerprint is successfully matched and you haven't voted in this election before, you will see a green **"Vote Recorded!"** screen displaying your immutable Blockchain Transaction Hash (TX).

## Phase 3: Viewing Receipts

1. Click **"My Votes"** in the top navigation bar.
2. You will see a chronological list of every election you have participated in, along with the candidate you voted for, the exact timestamp, and the Blockchain Transaction Hash serving as your digital receipt.
