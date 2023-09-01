// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;
import { System } from "@latticexyz/world/src/System.sol";
import { Encounter, EncounterData, Encounterable, EncounterTrigger, MapConfig, Monster, Movable, Obstruction, Player, Position, ChatWith, PlayerAtPositon } from "../codegen/Tables.sol";
import { MonsterType } from "../codegen/Types.sol";
import { addressToEntityKey } from "../addressToEntityKey.sol";
import { positionToEntityKey } from "../positionToEntityKey.sol";

contract MapSystem is System {

  function spawn(uint32 x, uint32 y) public {
    bytes32 player = addressToEntityKey(address(_msgSender()));
    require(!Player.get(player), "already spawned");

     // Constrain position to map size, wrapping around if necessary
    (uint32 width, uint32 height, ) = MapConfig.get();
    x = (x + width) % width;
    y = (y + height) % height;
    
    bytes32 position = positionToEntityKey(x, y);
    require(!Obstruction.get(position), "this space is obstructed");

    Player.set(player, true);
    Position.set(player, x, y);
    Movable.set(player, true);
    Encounterable.set(player, true);
  }

  function move(uint32 x, uint32 y) public {
    bytes32 player = addressToEntityKey(address(_msgSender()));
    require(Movable.get(player), "not movable");

    require(!Encounter.getExists(player), "cannot move during an encounter");

    (uint32 fromX, uint32 fromY) = Position.get(player);
    require(distance(fromX, fromY, x, y) == 1, "can only move to adjacent spaces");
 
     // Constrain position to map size, wrapping around if necessary
    (uint32 width, uint32 height, ) = MapConfig.get();
    x = (x + width) % width;
    y = (y + height) % height;

    bytes32 position = positionToEntityKey(x, y);
    require(!Obstruction.get(position), "this space is obstructed");

    // check if the player is leaving a chat 
    bytes32 fromTargetPlayer = ChatWith.get(player);
    if (fromTargetPlayer != 0x0) { 
      // in chat before 
      ChatWith.deleteRecord(fromTargetPlayer);
      ChatWith.deleteRecord(player);
    }

    // check if has player at this positon
    bytes32 targetPlayer = PlayerAtPositon.get(position);
    if (targetPlayer != 0x0) {
      // enter chat 
      startChat(player, targetPlayer);
    } else {
      bytes32 fromPosition = positionToEntityKey(fromX, fromY);
      PlayerAtPositon.deleteRecord(fromPosition);
      Position.set(player, x, y);
      PlayerAtPositon.set(position, player);
      if (Encounterable.get(player) && EncounterTrigger.get(position)) {
      uint256 rand = uint256(keccak256(abi.encode(player, position, blockhash(block.number - 1), block.difficulty)));
      if (rand % 5 == 0) {
        startEncounter(player);
      }
     } 
    }

  }

  function distance(uint32 fromX, uint32 fromY, uint32 toX, uint32 toY) internal pure returns (uint32) {
    uint32 deltaX = fromX > toX ? fromX - toX : toX - fromX;
    uint32 deltaY = fromY > toY ? fromY - toY : toY - fromY;
    return deltaX + deltaY;
  }

  function startEncounter(bytes32 player) internal {
    bytes32 monster = keccak256(abi.encode(player, blockhash(block.number - 1), block.difficulty));
    MonsterType monsterType = MonsterType((uint256(monster) % uint256(type(MonsterType).max)) + 1);
    Monster.set(monster, monsterType);
    Encounter.set(player, EncounterData({ exists: true, monster: monster, catchAttempts: 0 }));
  }

  function startChat(bytes32 player0, bytes32 player1) internal {

      ChatWith.set(player0, player1);
      ChatWith.set(player1, player0);
  }

}
