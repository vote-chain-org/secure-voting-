package com.votechain.backend.service;

import io.grpc.ManagedChannel;
import io.grpc.netty.shaded.io.grpc.netty.GrpcSslContexts;
import io.grpc.netty.shaded.io.grpc.netty.NettyChannelBuilder;
import lombok.extern.slf4j.Slf4j;
import org.hyperledger.fabric.client.*;
import org.hyperledger.fabric.client.identity.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.*;
import java.security.InvalidKeyException;
import java.security.cert.CertificateException;
import java.util.concurrent.TimeUnit;

/**
 * FabricService — connects to Hyperledger Fabric via the Gateway Java SDK.
 *
 * Connection flow:
 *   1. Load TLS CA cert, client signing cert, and private key from crypto-config/
 *   2. Create gRPC channel to peer0.org1.example.com:7051 with TLS
 *   3. Build Gateway with X509 identity (Org1MSP) and signing key
 *   4. Get Network (electionchannel) → Contract (voting)
 *   5. Submit transactions and retrieve real txId from Fabric
 */
@Slf4j
@Service
public class FabricService {

    @Value("${fabric.peer.endpoint:localhost:7051}")
    private String peerEndpoint;

    @Value("${fabric.peer.overrideAuth:peer0.org1.example.com}")
    private String peerOverrideAuth;

    @Value("${fabric.mspId:Org1MSP}")
    private String mspId;

    @Value("${fabric.channelName:electionchannel}")
    private String channelName;

    @Value("${fabric.chaincodeName:voting}")
    private String chaincodeName;

    @Value("${fabric.certPath}")
    private String certPath;

    @Value("${fabric.keyPath}")
    private String keyPath;

    @Value("${fabric.tlsCertPath}")
    private String tlsCertPath;

    private Gateway gateway;
    private ManagedChannel grpcChannel;
    private Contract contract;

    @PostConstruct
    public void init() throws Exception {
        log.info("Initializing Fabric Gateway connection to {}", peerEndpoint);

        // 1. Load crypto materials
        // Paths may be files or directories — resolve the actual file
        Path certFilePath = resolveFile(Path.of(certPath), ".pem");
        Path keyFilePath = resolveFile(Path.of(keyPath), "_sk");
        Path tlsCertFilePath = resolveFile(Path.of(tlsCertPath), ".crt", ".pem");

        log.info("  Cert:    {}", certFilePath);
        log.info("  Key:     {}", keyFilePath);
        log.info("  TLS CA:  {}", tlsCertFilePath);

        var certificate = Identities.readX509Certificate(Files.newBufferedReader(certFilePath));
        var privateKey = Identities.readPrivateKey(Files.newBufferedReader(keyFilePath));

        // 2. Create gRPC channel with TLS
        grpcChannel = NettyChannelBuilder.forTarget(peerEndpoint)
                .sslContext(GrpcSslContexts.forClient()
                        .trustManager(tlsCertFilePath.toFile())
                        .build())
                .overrideAuthority(peerOverrideAuth)
                .build();

        // 3. Build Gateway
        gateway = Gateway.newInstance()
                .identity(new X509Identity(mspId, certificate))
                .signer(Signers.newPrivateKeySigner(privateKey))
                .connection(grpcChannel)
                .evaluateOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .endorseOptions(options -> options.withDeadlineAfter(15, TimeUnit.SECONDS))
                .submitOptions(options -> options.withDeadlineAfter(5, TimeUnit.SECONDS))
                .commitStatusOptions(options -> options.withDeadlineAfter(60, TimeUnit.SECONDS))
                .connect();

        // 4. Get contract reference
        Network network = gateway.getNetwork(channelName);
        contract = network.getContract(chaincodeName);

        log.info("Fabric Gateway connected — channel={}, chaincode={}", channelName, chaincodeName);
    }

    /**
     * Submit a vote to the blockchain.
     *
     * @param voterId     voter ID (from ML fingerprint verification)
     * @param candidateId candidate ID (from frontend)
     * @return the real transaction ID from Fabric
     */
    public String castVote(String voterId, String candidateId)
            throws EndorseException, CommitException, SubmitException, CommitStatusException {

        log.info("Submitting vote to blockchain — voter={}, candidate={}", voterId, candidateId);

        // Use the proposal workflow to get the txId
        var proposal = contract.newProposal("castVerifiedVote")
                .addArguments(voterId, candidateId)
                .build();

        var transaction = proposal.endorse();
        var submitted = transaction.submitAsync();
        String txId = submitted.getTransactionId();

        // Wait for commit
        var status = submitted.getStatus();
        if (!status.isSuccessful()) {
            throw new RuntimeException("Transaction " + txId + " failed with status: " + status.getCode());
        }

        log.info("Vote committed on blockchain — txId={}", txId);
        return txId;
    }

    /**
     * Register a voter on the blockchain.
     */
    public void registerVoter(String voterId) throws Exception {
        log.info("Registering voter on blockchain — voterId={}", voterId);
        contract.submitTransaction("registerVoter", voterId);
    }

    /**
     * Register a candidate on the blockchain.
     */
    public void registerCandidate(String candidateId, String name) throws Exception {
        log.info("Registering candidate on blockchain — candidateId={}, name={}", candidateId, name);
        contract.submitTransaction("registerCandidate", candidateId, name);
    }

    /**
     * Get election results from the blockchain.
     */
    public String getResults() throws Exception {
        byte[] result = contract.evaluateTransaction("getResults");
        return new String(result);
    }

    /**
     * Resolve a crypto material path that may be a file or a directory.
     * If it's a directory, find the first file matching one of the given suffixes.
     */
    private Path resolveFile(Path path, String... suffixes) throws IOException {
        if (Files.isRegularFile(path)) {
            return path;
        }
        if (Files.isDirectory(path)) {
            // Try to find a file matching one of the suffixes
            for (String suffix : suffixes) {
                try (var files = Files.list(path)) {
                    var found = files.filter(f -> f.toString().endsWith(suffix)).findFirst();
                    if (found.isPresent()) return found.get();
                }
            }
            // Fallback: return first file in directory
            try (var files = Files.list(path)) {
                return files.findFirst()
                        .orElseThrow(() -> new RuntimeException("No files found in " + path));
            }
        }
        throw new RuntimeException("Path does not exist: " + path);
    }

    @PreDestroy
    public void cleanup() {
        if (gateway != null) {
            gateway.close();
        }
        if (grpcChannel != null) {
            grpcChannel.shutdownNow();
        }
        log.info("Fabric Gateway connection closed");
    }
}
