# Admin Guide

The Admin Dashboard provides real-time visibility into the election tallies without compromising voter anonymity. It pulls immutable vote counts directly from the Hyperledger Fabric Blockchain.

## Accessing the Dashboard

1. **Admin Account Requirement:**
   Currently, the prototype does not explicitly block regular users from navigating to the admin route, but in a production environment, only users with the `ADMIN` role in the PostgreSQL database can view this page.
2. **Navigation:**
   While logged into the platform, click the **"Admin"** link in the top right navigation bar.

## Understanding the Dashboard

### Total Votes Cast
At the top of the dashboard, a large counter displays the **Total Votes Cast** across all elections. This aggregate number helps administrators monitor overall voter turnout in real-time.

### Election Results Breakdown
The dashboard displays a card for every active election in the system.

- **Candidate Tallies:** Under each election, you will see a list of participating candidates alongside the total number of verified blockchain votes they have received.
- **Data Source:** These numbers are not calculated by the PostgreSQL database. Instead, the Spring Boot backend queries the Hyperledger Fabric Smart Contract (Chaincode) using the `getResults` function. The Blockchain iterates through its ledger to tally the final, immutable counts.

### Refreshing Data
The dashboard does not auto-refresh continuously to prevent overwhelming the Blockchain network. To get the absolute latest tallies:
1. Click the **"Refresh Results"** button in the top right corner of the dashboard.
2. The UI will indicate it is refreshing and pull the latest state from the ledger.
