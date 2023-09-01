import { Has, HasValue, getComponentValue, runQuery } from "@latticexyz/recs";
import { uuid, awaitStreamValue } from "@latticexyz/utils";
import { MonsterCatchResult } from "../monsterCatchResult";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { ethers } from "ethers";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { playerEntityId, playerEntity, singletonEntity, worldSend, txReduced$, socialPlugin }: SetupNetworkResult,
  { Encounter, MapConfig, MonsterCatchAttempt, Obstruction, Player, Position, ChatWith }: ClientComponents) {

  const wrapPosition = (x: number, y: number) => {
    const mapConfig = getComponentValue(MapConfig, singletonEntity);
    if (!mapConfig) {
      throw new Error("mapConfig no yet loaded or initialized");
    }
    return [(x + mapConfig.width) % mapConfig.width, (y + mapConfig.height) % mapConfig.height];
  };

  const isObstructed = (x: number, y: number) => {
    return runQuery([Has(Obstruction), HasValue(Position, { x, y })]).size > 0;
  };

  const moveTo = async (inputX: number, inputY: number) => {
    if (!playerEntity) {
      throw new Error("No player entity");
    }

    const inEncounter = !!getComponentValue(Encounter, playerEntity);
    if (inEncounter) {
      console.warn("cannot move while in encounter");
      return;
    }

    const [x, y] = wrapPosition(inputX, inputY);

    if (isObstructed(x, y)) {
      console.warn("cannot move to obstructed space");
      return;
    }

    const positionId = uuid();
    Position.addOverride(positionId, {
      entity: playerEntity,
      value: { x, y },
    });

    try {
      const tx = await worldSend("move", [x, y]);
      await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
    } finally {
      Position.removeOverride(positionId);
    }
  };

  const moveBy = async (deltaX: number, deltaY: number) => {
    if (!playerEntity) {
      throw new Error("no player");
    }

    const playerPosition = getComponentValue(Position, playerEntity);
    if (!playerPosition) {
      console.warn("cannot moveBy without a player position, not yet spawned?");
      return;
    }

    await moveTo(playerPosition.x + deltaX, playerPosition.y + deltaY);
  };

  const spawn = async (inputX: number, inputY: number) => {
    if (!playerEntity) {
      throw new Error("no player");
    }

    const canSpawn = getComponentValue(Player, playerEntity)?.value !== true;
    if (!canSpawn) {
      throw new Error("already spawned");
    }

    const [x, y] = wrapPosition(inputX, inputY);

    if (isObstructed(x, y)) {
      console.warn("cannot spawn on obstructed space");
      return;
    }

    const positionId = uuid();
    Position.addOverride(positionId, {
      entity: playerEntity,
      value: { x, y },
    });

    const playerId = uuid();
    Player.addOverride(playerId, {
      entity: playerEntity,
      value: { value: true },
    });

    try {
      const tx = await worldSend("spawn", [x, y]);
      await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
    } finally {
      Position.removeOverride(positionId);
      Player.removeOverride(playerId);
    }
  };

  const throwBall = async () => {
    const player = playerEntity;
    if (!player) {
      throw new Error("no player");
    }

    const encounter = getComponentValue(Encounter, player);
    if (!encounter) {
      throw new Error("no encounter");
    }

    const tx = await worldSend("throwBall", []);
    await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);

    const catchAttempt = getComponentValue(MonsterCatchAttempt, player);
    if (!catchAttempt) {
      throw new Error("no catch attempt found");
    }

    return catchAttempt.result as MonsterCatchResult;
  };

  const fleeEncounter = async () => {
    const tx = await worldSend("flee", []);
    await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
  };

  const leaveChat = async () => {
    const player = playerEntity;
    if (!player) {
      throw new Error("no player");
    }

    const chater = getComponentValue(ChatWith, player);
    if (!chater) {
      throw new Error("no chat member");
    }

    const tx = await worldSend("leaveChat", []);
    await awaitStreamValue(txReduced$, (txHash) => txHash === tx.hash);
  };

  const followUser = async (following: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socialPlugin.follow(player, following, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const unfollowUser = async (following: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socialPlugin.unfollow(player, following, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const isFollowingUser = async (following: string): Promise<boolean> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    console.log("social plugin: ", socialPlugin);
    return await socialPlugin.isFollowing(player, following);
  }

  const block = async (blocked: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socialPlugin.blockUser(player, blocked, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const unblock = async (blocked: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socialPlugin.unblockUser(player, blocked, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const isBlockedUser = async (blocked: string): Promise<boolean> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socialPlugin.isBlocked(player, blocked);
  }

  const setPermissionSetting = async (permission: number) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socialPlugin.setPermission(player, permission, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const getPermissionSetting = async (): Promise<number> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socialPlugin.getPermission(player);
  }

  const canChatWithPlayer = async (receiver: string): Promise<boolean> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socialPlugin.canChat(player, receiver);
  }

  // set do not disturb mode 
  const setMetadata = async (metadata: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    const result = ethers.utils.formatBytes32String(metadata);
    console.log("setMetadata", result);
    await socialPlugin.setMetadata(player, result, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const getMetadata = async (player: String): Promise<string> => {
    const bytes = await socialPlugin.getMetadata(player);
    const result = ethers.utils.parseBytes32String(bytes);
    console.log("getMetadata", result);
    return result;
  }

  return {
    moveTo,
    moveBy,
    spawn,
    throwBall,
    fleeEncounter,
    leaveChat,
    followUser,
    unfollowUser,
    isFollowingUser,
    block,
    unblock,
    isBlockedUser,
    setPermissionSetting,
    getPermissionSetting,
    canChatWithPlayer,
    setMetadata,
    getMetadata
  };
}
