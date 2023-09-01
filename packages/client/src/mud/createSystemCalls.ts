import { Has, HasValue, getComponentValue, runQuery } from "@latticexyz/recs";
import { uuid, awaitStreamValue } from "@latticexyz/utils";
import { MonsterCatchResult } from "../monsterCatchResult";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkResult } from "./setupNetwork";
import { Bytes } from "ethers";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  { playerEntityId, playerEntity, singletonEntity, worldSend, txReduced$, socailPlugin }: SetupNetworkResult,
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
    console.log("player: ", player);
    await socailPlugin.follow(player, following, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const unfollowUser = async (following: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socailPlugin.unfollow(player, following, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const isFollowingUser = async (following: string): Promise<boolean> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    console.log("social plugin: ", socailPlugin);
    return await socailPlugin.isFollowing(player, following);
  }

  const block = async (blocked: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socailPlugin.blockUser(player, blocked, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const unblock = async (blocked: string) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socailPlugin.unblockUser(player, blocked, { gasLimit: 1000000, maxPriorityFeePerGas: 0, maxFeePerGas: 0 });
  }

  const isBlockedUser = async (blocked: string): Promise<boolean> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socailPlugin.isBlocked(player, blocked);
  }

  const setPermissionSetting = async (permission: number) => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await socailPlugin.setPermission(player, permission);
  }

  const getPermissionSetting = async (): Promise<number> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socailPlugin.getPermission(player);
  }

  const canChatWithPlayer = async (receiver: string): Promise<boolean> => {
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    return await socailPlugin.canChat(player, receiver);
  }

  // const follow = async (following: string) => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   await socailPlugin.follow(player, following)
  // }

  // const unfollow = async (following: string) => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   await socailPlugin.unfollow(player, following)
  // }

  // const isFollowing = async (following: string): Promise<boolean> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.isFollowing(player, following);
  // }

  // const blockUser = async (blocked: string): Promise<boolean> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.blockUser(player, blocked)
  // }

  // const unblockUser = async (blocked: string): Promise<boolean> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.unblockUser(player, blocked)
  // }

  // const blockedList = async (): Promise<[string]> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.blockedList(player);
  // }

  // const isBlocked = async (blocked: string): Promise<boolean> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.isBlocked(player, blocked);
  // }

  // const setPermission = async (permission: number): Promise<boolean> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.setPermission(player, permission)
  // }

  // const getPermission = async (user: string): Promise<number> => {
  //   return await socailPlugin.getPermission(user)
  // }

  // const canChat = async (receiver: string): Promise<boolean> => {
  //   const player = playerEntityId;
  //   if (!player) {
  //     throw new Error("no player");
  //   }
  //   return await socailPlugin.canChat(player, receiver)
  // }

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
  };
}
