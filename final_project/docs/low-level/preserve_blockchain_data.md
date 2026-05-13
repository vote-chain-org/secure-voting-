# Preserving Blockchain Data Between Restarts

By default, the `run_server_v2.sh stop` command tears down the Hyperledger Fabric Docker network and **intentionally wipes the ledger volumes**. This results in an empty, fresh blockchain every time you restart the server.

If you are moving towards a production-like environment and want the blockchain history (votes, candidates, voters) to persist between server restarts, you must modify how the stopping script handles Docker volumes.

## Modifying `run_server_v2.sh`

1. Open `run_server_v2.sh` in your text editor.
2. Locate the **Stop Mode** section at the top of the file (around Line 112).
3. Find the following line:
   ```bash
   docker-compose -f docker-compose-network.yml down --volumes --remove-orphans 2>/dev/null || true
   ```
4. **Remove the `--volumes` flag.** The updated line should look exactly like this:
   ```bash
   docker-compose -f docker-compose-network.yml down --remove-orphans 2>/dev/null || true
   ```

### Why this works:
- `docker-compose down` removes the containers and the virtual network bridging them.
- However, because you removed the `--volumes` flag, Docker will **keep** the named data volumes associated with the Fabric Peer and Orderer (`peer0.org1.example.com` and `orderer.election.example.com`).
- The next time you run `./run_server_v2.sh`, Docker will automatically remount these existing volumes. The script is already smart enough to detect the existing channel and chaincode, bypassing the initialization steps and picking up exactly where you left off!

*(Note: The newly rewritten `tmux_votechain.sh` script already has this fix applied by default!)*
