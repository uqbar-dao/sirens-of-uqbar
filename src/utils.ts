import { starknet, config } from "hardhat";
import { number, uint256 } from "starknet";
import { expect } from "chai";
import { Account } from "@shardlabs/starknet-hardhat-plugin/dist/src/account";


export type Uint256WithFelts = {
  low: BigInt;
  high: BigInt;
};

export const NETWORK: string = config.starknet.network!;

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Retrieve address from a wallet
 * @param myWallet
 * @returns
 */
export function getAddressFromWallet(myWallet: any): string {
  const accounts = require(myWallet.accountPath +
    "/starknet_open_zeppelin_accounts.json");
  return accounts[NETWORK][myWallet.accountName].address;
}

/**
 * To use uint256 with cairo, low and high fields must be felts (not sure if there is an library to help here)
 * @param num
 * @returns
 */
export function toUint256WithFelts(num: number.BigNumberish): Uint256WithFelts {
  const n = uint256.bnToUint256(num);
  return {
    low: BigInt(n.low.toString()),
    high: BigInt(n.high.toString()),
  };
}

/**
 * Used to reverse toUint256WithFelts
 * @param uint256WithFelts
 * @returns
 */
export function fromUint256WithFelts(
  uint256WithFelts: Uint256WithFelts
): number.BigNumberish {
  return uint256.uint256ToBN({
    low: uint256WithFelts.low.toString(),
    high: uint256WithFelts.high.toString(),
  });
}

/** Cairo Field Element Arrays allow for much bigger strings (up to 2^15 characters) and manipulation is implemented on-chain **/

/**
 * Splits a string into an array of short strings (felts). A Cairo short string (felt) represents up to 31 utf-8 characters.
 * @param {string} str - The string to convert
 * @returns {bigint[]} - The string converted as an array of short strings as felts
 */
export function strToFeltArr(str: string): BigInt[] {
  const size = Math.ceil(str.length / 31);
  const arr = Array(size);

  let offset = 0;
  for (let i = 0; i < size; i++) {
    const substr = str.substring(offset, offset + 31).split("");
    const ss = substr.reduce(
      (memo, c) => memo + c.charCodeAt(0).toString(16),
      ""
    );
    arr[i] = BigInt("0x" + ss);
    offset += 31;
  }
  return arr;
}

/**
 * Converts an array of utf-8 numerical short strings into a readable string
 * @param {bigint[]} felts - The array of encoded short strings
 * @returns {string} - The readable string
 */
export function feltArrToStr(felts: bigint[]): string {
  return felts.reduce(
    (memo, felt) => memo + Buffer.from(felt.toString(16), "hex").toString(),
    ""
  );
}

/**
 * Converts a string to a felt (short string). A Cairo short string (felt) represents up to 31 utf-8 characters.
 * @param {string} str - The string to convert
 * @returns {bigint} - The string converted to a felt (short string)
 */
export function strToFelt(str: string): BigInt {
  if (str.length > 31) {
    throw Error("unable to convert to felt: string greater than 31 chars");
  }
  const strarr = str.split("");
  const ss = strarr.reduce(
    (memo, c) => memo + c.charCodeAt(0).toString(16),
    ""
  );
  return BigInt("0x" + ss);
}

/**
 * Expects a StarkNet transaction to fail
 * @param {Promise<any>} transaction - The transaction that should fail
 * @param {string} [message] - The message returned from StarkNet
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function shouldFail(
  transaction: Promise<any>,
  message: string = "Transaction rejected."
) {
  try {
    await transaction;
    expect.fail("Transaction should fail");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    expect(err.message).to.deep.contain(message);
  }
}

/**
 * Logs the error on call fail.
 * Sometimes the error are not correctly displayed. This helper can help debug hard to find errors
 * @param {() => Promise<void>} fn - The function to test
 */
export async function tryCatch(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error(e);
    expect.fail("Test failed");
  }
}

export function formatAddress(a : string) {
  parseInt(a).toString(16).toUpperCase()
}

// NOTE: these only work with `starknet-devnet --seed 0`
export async function getAccounts(): Promise<Account[]> {
  const account0 = await starknet.getAccountFromAddress(
    "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
    "0xe3e70682c2094cac629f6fbed82c07cd",
    "OpenZeppelin"
  );

  const account1 = await starknet.getAccountFromAddress(
    "0x69b49c2cc8b16e80e86bfc5b0614a59aa8c9b601569c7b80dde04d3f3151b79",
    "0xf728b4fa42485e3a0a5d2f346baa9455",
    "OpenZeppelin"
  );

  const account2 = await starknet.getAccountFromAddress(
    "0x7447084f620ba316a42c72ca5b8eefb3fe9a05ca5fe6430c65a69ecc4349b3b",
    "0xeb1167b367a9c3787c65c1e582e2e662",
    "OpenZeppelin"
  );

  const account3 = await starknet.getAccountFromAddress(
    "0x3cad9a072d3cf29729ab2fad2e08972b8cfde01d4979083fb6d15e8e66f8ab1",
    "0xf7c1bd874da5e709d4713d60c8a70639",
    "OpenZeppelin"
  );

  const account4 = await starknet.getAccountFromAddress(
    "0x7f14339f5d364946ae5e27eccbf60757a5c496bf45baf35ddf2ad30b583541a",
    "0xe443df789558867f5ba91faf7a024204",
    "OpenZeppelin"
  );

  const account5 = await starknet.getAccountFromAddress(
    "0x27d32a3033df4277caa9e9396100b7ca8c66a4ef8ea5f6765b91a7c17f0109c",
    "0x23a7711a8133287637ebdcd9e87a1613",
    "OpenZeppelin"
  );
  return [account0, account1, account2, account3, account4, account5]
}
