package com.voting.chaincode;

import org.hyperledger.fabric.contract.ContractRouter;

/**
 * VotingChaincode — entry point for the Hyperledger Fabric Java chaincode.
 *
 * Bootstraps the ContractRouter which discovers and routes all
 * @Transaction-annotated methods in VotingContract.
 */
public final class VotingChaincode {

    private VotingChaincode() { }

    public static void main(final String[] args) throws Exception {
        ContractRouter.main(args);
    }
}
