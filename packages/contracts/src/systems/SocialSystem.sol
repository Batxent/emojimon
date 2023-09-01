// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import { System } from "@latticexyz/world/src/System.sol";
import { addressToEntityKey } from "../addressToEntityKey.sol";
import { ChatWith } from "../codegen/Tables.sol";

contract SocialSystem is System {
    
    function leaveChat() public {
        bytes32 player = addressToEntityKey(_msgSender());
        bytes32 chater = ChatWith.get(player);
        ChatWith.deleteRecord(player);
        ChatWith.deleteRecord(chater);
    }
}