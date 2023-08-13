import { useComponentValue } from "@latticexyz/react";
import { useMUD } from "./MUDContext";
import { GameBoard } from "./GameBoard";
import { SyncStep, singletonEntity } from "@latticexyz/store-sync/recs";

export const App = () => {
  const {
    components: { SyncProgress },
  } = useMUD();

  const syncProgress = useComponentValue(SyncProgress, singletonEntity, {
    step: SyncStep.INITIALIZE,
    message: "Connecting",
    percentage: 0,
    latestBlockNumber: 0n,
    lastBlockNumberProcessed: 0n,
  });

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      {syncProgress.step !== SyncStep.LIVE ? (
        <div>
          {syncProgress.message} ({Math.floor(syncProgress.percentage)}%)
        </div>
      ) : (
        <GameBoard />
      )}
    </div>
  );
};
