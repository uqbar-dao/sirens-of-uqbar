%lang starknet

%builtins pedersen range_check bitwise

from starkware.starknet.common.syscalls import get_caller_address
from starkware.cairo.common.cairo_builtins import HashBuiltin, BitwiseBuiltin
from starkware.cairo.common.cairo_secp.bigint import BigInt3
from starkware.cairo.common.math import assert_not_equal
from starkware.cairo.common.hash import hash2

@contract_interface
namespace IRNGConsumer {
    func will_recieve_rng(rng: BigInt3, request_id: felt) {
    }
}

struct Request {
    callback_address: felt,
    alpha: felt,
    public_key_hash: felt,
}

@storage_var
func requests(index: felt) -> (req: Request) {
}

@storage_var
func request_index() -> (index: felt) {
}

@storage_var
func completed_requests(index: felt) -> (is_complete: felt) {
}

@event
func request_recieved(request_index: felt, pub_key_hash: felt) {
}

@view
func get_request_index{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() -> (index: felt) {
    let index = request_index.read();
    return(index);
}

@constructor
func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}() {
    request_index.write(1);
    return ();
}

@external
func resolve_rng_request{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}(
    request_index: felt,
    c: BigInt3,
) {
    alloc_locals;

    let (is_complete: felt) = completed_requests.read(request_index);
    assert_not_equal(is_complete, 1);

    let (request: Request) = requests.read(request_index);

    IRNGConsumer.will_recieve_rng(
        contract_address=request.callback_address, rng=c, request_id=request_index
    );

    completed_requests.write(request_index, 1);

    return ();
}

@external
func request_rng{
    syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr, bitwise_ptr: BitwiseBuiltin*
}(beacon_address: felt) -> (request_id: felt) {
    alloc_locals;

    let (caller_address) = get_caller_address();
    let public_key_hash = 123456789; // recievable_beacons.read(beacon_address);

    let (curr_index) = request_index.read();

    let (alpha: felt) = hash2{hash_ptr=pedersen_ptr}(curr_index, 0);

    requests.write(
        curr_index,
        Request(callback_address=caller_address, alpha=alpha, public_key_hash=public_key_hash),
    );
    request_index.write(curr_index + 1);

    request_recieved.emit(request_index=curr_index, pub_key_hash=public_key_hash);

    return (curr_index,);
}

@view
func get_request{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(
    request_id: felt
) -> (request: Request) {
    let (request) = requests.read(request_id);
    return (request,);
}
