import { MUDChain, latticeTestnet } from "@latticexyz/common/chains";
import { foundry, hardhat, localhost } from "@wagmi/chains";

// If you are deploying to chains other than anvil or Lattice testnet, add them here
// foundry, latticeTestnet,
export const supportedChains: MUDChain[] = [localhost, hardhat, foundry, latticeTestnet];