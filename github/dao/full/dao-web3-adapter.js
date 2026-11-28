/**
 * dao-web3-adapter.js — Adapter Web3 & Enkripsi Dokumen IPFS untuk Full DAO
 * Menggantikan ketergantungan login OTP / Supabase sementara ketika portal dijalankan
 * sebagai Full DAO murni (MetaMask/EIP-1193 + ERC20Votes + Governor + Timelock + IPFS AES-GCM),
 * sambil tetap mendukung sinkronisasi log proposal ke Supabase gio910-api.
 *
 * Catatan: membutuhkan `ethers` v6 (tersedia via ESM CDN atau bundler Anda).
 */

export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function getVotes(address account) view returns (uint256)",
  "function delegates(address account) view returns (address)",
  "function delegate(address delegatee)"
];

export const GOVERNOR_ABI = [
  "function name() view returns (string)",
  "function proposalThreshold() view returns (uint256)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function queue(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) returns (uint256)",
  "function execute(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) payable returns (uint256)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
];

export const PROPOSAL_STATES = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed"
];

export async function connectWeb3Wallet(ethersLib) {
  if (!window.ethereum) {
    throw new Error("Dompet Web3 tidak ditemukan (instal MetaMask atau buka lewat Brave/Opera).");
  }
  const provider = new ethersLib.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();
  return { provider, signer, address, chainId: Number(network.chainId) };
}

export async function getGovernanceStatus(ethersLib, provider, tokenAddress, userAddress) {
  const token = new ethersLib.Contract(tokenAddress, TOKEN_ABI, provider);
  const [symbol, decimals, balance, votes, delegatee] = await Promise.all([
    token.symbol(),
    token.decimals(),
    token.balanceOf(userAddress),
    token.getVotes(userAddress),
    token.delegates(userAddress)
  ]);
  return {
    symbol,
    decimals: Number(decimals),
    balanceFormatted: ethersLib.formatUnits(balance, decimals),
    votesFormatted: ethersLib.formatUnits(votes, decimals),
    delegatee
  };
}

export async function delegateSelf(ethersLib, signer, tokenAddress) {
  const me = await signer.getAddress();
  const token = new ethersLib.Contract(tokenAddress, TOKEN_ABI, signer);
  const tx = await token.delegate(me);
  return await tx.wait();
}

export async function createEthTransferProposal(ethersLib, signer, governorAddress, recipient, amountEth, description) {
  const gov = new ethersLib.Contract(governorAddress, GOVERNOR_ABI, signer);
  const targets = [recipient];
  const values = [ethersLib.parseEther(String(amountEth || "0"))];
  const calldatas = ["0x"];
  const tx = await gov.propose(targets, values, calldatas, description);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, targets, values, calldatas, description };
}

export async function castDaoVote(ethersLib, signer, governorAddress, proposalId, support, reason) {
  // support: 0 = Against (Tolak), 1 = For (Setuju), 2 = Abstain
  const gov = new ethersLib.Contract(governorAddress, GOVERNOR_ABI, signer);
  const tx = reason
    ? await gov.castVoteWithReason(proposalId, support, reason)
    : await gov.castVote(proposalId, support);
  return await tx.wait();
}

export async function queueOrExecuteProposal(ethersLib, signer, governorAddress, mode, targets, values, calldatas, description) {
  const gov = new ethersLib.Contract(governorAddress, GOVERNOR_ABI, signer);
  const descHash = ethersLib.id(description);
  const tx = mode === "queue"
    ? await gov.queue(targets, values, calldatas, descHash)
    : await gov.execute(targets, values, calldatas, descHash);
  return await tx.wait();
}

export async function fetchRecentProposals(ethersLib, provider, governorAddress, fromBlockOffset = 50000) {
  const gov = new ethersLib.Contract(governorAddress, GOVERNOR_ABI, provider);
  const latest = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latest - fromBlockOffset);
  const logs = await gov.queryFilter(gov.filters.ProposalCreated(), fromBlock, latest);
  const items = await Promise.all(logs.slice(-20).reverse().map(async (ev) => {
    const pid = ev.args.proposalId;
    const [st, votes] = await Promise.all([gov.state(pid), gov.proposalVotes(pid)]);
    return {
      proposalId: pid.toString(),
      proposer: ev.args.proposer,
      description: ev.args.description,
      targets: Array.from(ev.args.targets),
      values: Array.from(ev.args.values).map((v) => v.toString()),
      calldatas: Array.from(ev.args.calldatas),
      stateCode: Number(st),
      stateLabel: PROPOSAL_STATES[Number(st)] || String(st),
      againstVotes: ethersLib.formatUnits(votes.againstVotes, 18),
      forVotes: ethersLib.formatUnits(votes.forVotes, 18),
      abstainVotes: ethersLib.formatUnits(votes.abstainVotes, 18)
    };
  }));
  return items;
}

/**
 * Enkripsi file dokumen internal Holding dengan WebCrypto AES-256-GCM sebelum diunggah ke IPFS
 * agar arsip rahasia tidak terbaca publik di gateway IPFS/4EVERLAND.
 */
async function deriveAesKeyFromPassword(passphrase, saltBytes) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 120000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptFileForIpfs(arrayBuffer, passphrase) {
  if (!passphrase || passphrase.length < 8) {
    throw new Error("Kata sandi enkripsi minimal 8 karakter.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKeyFromPassword(passphrase, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, arrayBuffer);
  const out = new Uint8Array(4 + 16 + 12 + cipher.byteLength);
  out.set(new TextEncoder().encode("KAI1"), 0);
  out.set(salt, 4);
  out.set(iv, 20);
  out.set(new Uint8Array(cipher), 32);
  return out;
}

export async function decryptFileFromIpfs(encryptedBytes, passphrase) {
  const u8 = new Uint8Array(encryptedBytes);
  const magic = new TextDecoder().decode(u8.slice(0, 4));
  if (magic !== "KAI1") throw new Error("Format berkas terenkripsi tidak valid.");
  const salt = u8.slice(4, 20);
  const iv = u8.slice(20, 32);
  const body = u8.slice(32);
  const key = await deriveAesKeyFromPassword(passphrase, salt);
  return await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, body);
}
