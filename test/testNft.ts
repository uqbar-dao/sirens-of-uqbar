import { starknet } from "hardhat";
import { shouldFail, formatAddress, getAccounts } from "./utils";
import { Account } from "@shardlabs/starknet-hardhat-plugin/dist/src/account";
import { StarknetContract } from "@shardlabs/starknet-hardhat-plugin/dist/src/types"
import { expect } from "chai";

const MAX_SUPPLY = 1024
const DUMMY_RANDOMNESS = '0x75bcd15'

describe('ERC721_VRF_Mint', () => {
  let deployer : Account
  let user : Account
  let oracle : StarknetContract
  let whitelist : StarknetContract
  let nft : StarknetContract
  let beacon_address : string
  
  before(async () => {
    [deployer, user] = await getAccounts();
    
    const oracleFactory = await starknet.getContractFactory("Mock_RNG_Oracle")
    oracle = await oracleFactory.deploy()

    beacon_address = oracle.address // fake mock

    const whitelistFactory = await starknet.getContractFactory("Whitelist")
    whitelist = await whitelistFactory.deploy()

    const nftFactory = await starknet.getContractFactory("ERC721_VRF_Mint")
    nft = await nftFactory.deploy({
      name: starknet.shortStringToBigInt('Galaxy Girls'),
      symbol: starknet.shortStringToBigInt('GGIRLS'),
      owner: deployer.address,
      default_royalty_receiver: deployer.address,
      default_royalty_fee_basis_points: 500,
      whitelist: whitelist.address,
      oracle: oracle.address,
    })
  })

  describe('#premint', () => {
    xit('fails when not whitelisted')

    // this does revert, not sure how to to expect().to.be.reverted() in starknet though
    it('fails when over totalSupply', async () => {
      await shouldFail(
        user.invoke(nft, 'premint', {
          to: user.address,
          quantity: MAX_SUPPLY + 1,
        })
      )
    })

    it('mints correctly', async () => {
      await user.invoke(nft, 'premint', {
        to: user.address,
        quantity: 10,
      })

      const block = await starknet.getBlock()

      const { events } = block.transaction_receipts[0]
      const { supply } = await nft.call('totalSupply')
      const { balance } = await nft.call('balanceOf', { owner: user.address })
      expect(events.length).to.eq(10) // could check the events one by one but whatever
      expect(Number(supply.low)).to.eq(10)
      expect(Number(balance.low)).to.eq(10)
    })
  })

  describe('#request_rng', () => {
    it('fails when not called by owner', async () => {
      await shouldFail(
        user.invoke(nft, 'request_rng', { beacon_address: 0 })
      )
    })

    it('works when called by owner', async () => {
      await deployer.invoke(nft, 'request_rng', { beacon_address: 0 })
      const block = await starknet.getBlock()
      const { from_address, data } = block.transaction_receipts[0].events[0]
      expect(data[0]).to.eq('0x1')
      expect(data[1]).to.eq(DUMMY_RANDOMNESS)
      expect(
        parseInt(from_address).toString(16).toUpperCase()
      ).to.eq(
        parseInt(oracle.address).toString(16).toUpperCase()
      )
    })

  })

  describe('#resolve_rng_request', () => {
    beforeEach(async () => {
      await deployer.invoke(nft, 'request_rng', { beacon_address: 0 })
    })
    
    it('works', async () => {
      const SEED = 20

      await deployer.invoke(oracle, 'resolve_rng_request', {
        request_index: 1,
        c : { d0: SEED, d1: 0, d2: 0 }
      })
      
      const { seed } = await nft.call('seed')
      const block = await starknet.getBlock()
      const { from_address, data } = block.transaction_receipts[0].events[0]
      expect(Number(seed)).to.eq(Number(SEED))
      expect(formatAddress(from_address)).to.eq(formatAddress(nft.address))
      expect(data[0]).to.eq('0x14')
      expect(data[1]).to.eq('0x0')
      expect(data[2]).to.eq('0x0')
      expect(data[3]).to.eq('0x1')
      expect(data[4]).to.eq('0x14')

    })
  })


})