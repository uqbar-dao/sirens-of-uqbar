# Galaxy Girls NFTs

## Reveal
the contract must contain a hash of the shuffle algorithm that will be used for the reveal. Furthermore, the preimage of the metadata hash (concatenation of all the metadata) must be published beforehand and included in the hash to make sure that no post-deployment manipulation will be done.

# Dev Notes

## Setup
First install poetry, like npm but for python. Install our dependencies and compile our contracts:

```sh
npm run setup
```

## Testing
install starknet-devnet and run
```sh
starknet-devnet --seed 0
```

then in another terminal run
```sh
npm run test
```