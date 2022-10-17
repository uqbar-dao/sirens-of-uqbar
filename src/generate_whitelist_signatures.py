import json
import os
from dotenv import load_dotenv
from starkware.crypto.signature.signature import (
    pedersen_hash, private_to_stark_key, sign)
load_dotenv()

# Generate key pairs.
PRIV_KEY = int(os.getenv('PRIV_KEY'), 16)

f = open ('./src/whitelist.json', "r")
whitelist = json.loads(f.read())

signatures = []
# Generate 3 votes of voters 3, 5, and 8.
for thing in whitelist:
    address = int(thing["address"], 16)
    quantity = int(thing["quantity"])
    r, s = sign(
        msg_hash=pedersen_hash(address, quantity),
        priv_key=PRIV_KEY
    )

    signatures.append({ "address": address, "quantity": quantity, "r": r, "s": s })

with open('whitelist_output.json', 'w') as f:
    json.dump(signatures, f)
    f.write('\n')