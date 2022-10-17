%lang starknet

from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin, SignatureBuiltin
from starkware.cairo.common.uint256 import Uint256
from starkware.cairo.common.cairo_secp.bigint import BigInt3
from starkware.cairo.common.math import unsigned_div_rem, split_felt, assert_nn_le
from starkware.cairo.common.hash import hash2
from starkware.cairo.common.signature import verify_ecdsa_signature

from openzeppelin.access.ownable.library import Ownable
from immutablex.starknet.token.erc721_token_metadata.library import ERC721_Token_Metadata
from immutablex.starknet.token.erc721.library import ERC721
from immutablex.starknet.auxiliary.erc2981.unidirectional_mutable import (
    ERC2981_UniDirectional_Mutable,
)
from ERC721_Base import (
    supportsInterface,
    name,
    symbol,
    balanceOf,
    ownerOf,
    getApproved,
    isApprovedForAll,
    contractURI,
    tokenURI,
    royaltyInfo,
    getDefaultRoyalty,
    owner,
    approve,
    setApprovalForAll,
    transferFrom,
    safeTransferFrom,
    setBaseURI,
    setTokenURI,
    resetTokenURI,
    setContractURI,
    setDefaultRoyalty,
    setTokenRoyalty,
    resetDefaultRoyalty,
    resetTokenRoyalty,
    transfer_ownership,
    renounce_ownership,
)

//
// Constants
//

const DEFAULT_ADMIN_ROLE = 0x00;
const MAX_SUPPLY = 1024;

//
// Events
//

@event
func rng_request_resolved(rng: BigInt3, request_id: felt, result: felt) {
}

//
// Interfaces
//

@contract_interface
namespace IRNGOracle {
    func request_rng(beacon_address: felt) -> (requestId: felt) {
    }
}

//
// Storage
//

@storage_var
func ERC721_totalSupply() -> (supply : felt) {
}

@storage_var
func _oracle() -> (addr : felt) {
}

@storage_var
func _is_used(hash : felt) -> (res : felt) {
}

@storage_var
func _seed() -> (rand : felt) {
}


//
// Constructor
//

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    name: felt,
    symbol: felt,
    owner: felt,
    default_royalty_receiver: felt,
    default_royalty_fee_basis_points: felt,
    oracle: felt,
) {
    ERC721.initializer(name, symbol);
    ERC721_Token_Metadata.initializer();
    ERC2981_UniDirectional_Mutable.initializer(
        default_royalty_receiver, default_royalty_fee_basis_points
    );
    Ownable.initializer(owner);
    _oracle.write(oracle);

    return ();
}

//
// Views
//

@view
func totalSupply{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (supply: Uint256) {
    let (supply) = ERC721_totalSupply.read();
    return (supply=Uint256(supply, 0));
}

@view
func oracle{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (addr: felt) {
    let (addr) = _oracle.read();
    return (addr,);
}

@view
func seed{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (seed: felt) {
    let (seed) = _seed.read();
    return (seed,);
}

@view
func hash() -> (hash: felt) {
    // TODO put the real hash in here
    return (hash=0x123456789);
}

//
// Externals (only_owner)
//

@external
func set_oracle{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
}(addr : felt) {
    Ownable.assert_only_owner();
    _oracle.write(addr);
    return();
}

//
// Externals (minting)
//

@external
func premint{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr,
    ecdsa_ptr : SignatureBuiltin*
}(to : felt, quantity : felt, sig : (felt, felt)) {
    alloc_locals;
    local ecdsa_ptr : SignatureBuiltin* = ecdsa_ptr;

    let (quantity_hash) = hash2{hash_ptr=pedersen_ptr}(to, quantity);
    let (is_used) = _is_used.read(quantity_hash);
    assert is_used = 0;
    
    // TODO probably a separate signer, not the owner
    let (owner) = Ownable.owner();
    verify_ecdsa_signature(
        message=quantity_hash,
        public_key=owner,
        signature_r=sig[0],
        signature_s=sig[1],
    );

    _is_used.write(quantity_hash, 1);

    // assert that we won't go over the supply
    let (totalSupply) = ERC721_totalSupply.read();
    assert_nn_le(totalSupply + quantity, MAX_SUPPLY);
    
    mint_many(to, quantity, totalSupply);
    return();
}

@external
func mint{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr
}(proof_len : felt, proof : felt*) {
    return();
}

@external
func request_rng{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr
}(beacon_address : felt) -> (
    request_id: felt
) {
    Ownable.assert_only_owner();
    let (oracle) = _oracle.read();
    let (request_id) = IRNGOracle.request_rng(
        contract_address=oracle, beacon_address=beacon_address
    );
    return (request_id,);
}

@external
func will_recieve_rng{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr
}(
    rng: BigInt3, request_id: felt
) {
    let (caller_address) = get_caller_address();
    let (oracle) = _oracle.read();
    assert oracle = caller_address;

    _seed.write(rng.d0);
    rng_request_resolved.emit(rng, request_id, rng.d0);
    return ();
}

//
// Internal
//

func mint_many{
    syscall_ptr: felt*,
    pedersen_ptr: HashBuiltin*,
    range_check_ptr
}(to : felt, quantity : felt, _totalSupply : felt){
    if (quantity == 0) {
        ERC721_totalSupply.write(_totalSupply);
        return ();
    }
    ERC721._mint(to, Uint256(_totalSupply + 1, 0));
    return mint_many(to, quantity - 1, _totalSupply + 1);
}
