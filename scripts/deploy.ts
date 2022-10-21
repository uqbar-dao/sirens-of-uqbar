import { starknet } from "hardhat"
import fs from 'fs'
import { AccountImplementationType } from "@shardlabs/starknet-hardhat-plugin/dist/src/types";

async function main() {
  const path = `${process.cwd()}/.env${".dev"}`
  await require("dotenv").config({ path })

  const name = starknet.shortStringToBigInt("Sirens of Uqbar")
  const symbol = starknet.shortStringToBigInt("USRNS")
  const owner = BigInt(process.env.STARKNET_ADDRESS!)
  const signer = BigInt(process.env.SIGNER!);
  const default_royalty_receiver = BigInt(process.env.PROJECT_ROYALTY_RECEIVER!)
  const default_royalty_fee_basis_points = BigInt(
    process.env.PROJECT_ROYALTY_FEE_BP!
  )
  const oracle = BigInt(process.env.ORACLE!)

  const nftFactory = await starknet.getContractFactory("ERC721_VRF_Mint")
  console.log("Deploying NFT...");
  const nftContract = await nftFactory.deploy({
    name,
    symbol,
    owner,
    signer,
    default_royalty_receiver,
    default_royalty_fee_basis_points,
    oracle,
  })
  console.log(`Deployed Sirens of Uqbar to address ${nftContract.address}`);
  
  const addressPath = `${process.cwd()}/addresses/dev.json`
  const addressBook = {
    Sirens: {
      address: nftContract.address.toString(),
      name: "Sirens of Uqbar",
      symbol: "USRNS",
      owner: owner.toString(16),
      signer: signer.toString(16),
      royaltyReceiver: default_royalty_receiver.toString(16),
      royaltyFeeBP: default_royalty_fee_basis_points.toString(),
      oracle: oracle.toString(16),
    },
  }

  fs.writeFileSync(
    addressPath,
    JSON.stringify(addressBook, null, 2)
  )
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });