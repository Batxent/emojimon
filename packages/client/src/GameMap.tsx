import { ReactNode, useEffect, useState } from "react";
import { Entity } from "@latticexyz/recs";
import { twMerge } from "tailwind-merge";
import { useMUD } from "./MUDContext";
import { Select } from "antd";

type Props = {
  width: number;
  height: number;
  onTileClick?: (x: number, y: number) => void;
  terrain?: {
    x: number;
    y: number;
    emoji: string;
  }[];
  players?: {
    x: number;
    y: number;
    emoji: string;
    entity: Entity;
  }[];
  encounter?: ReactNode;
  chatWith?: ReactNode;
  socialPlugin?: any;
};

export const GameMap = ({
  width,
  height,
  onTileClick,
  terrain,
  players,
  encounter,
  chatWith
}: Props) => {
  const {
    systemCalls: { setPermissionSetting, getPermissionSetting, getMetadata, setMetadata },
    network: { playerEntity, playerEntityId, socialPlugin },
  } = useMUD();

  const rows = new Array(width).fill(0).map((_, i) => i);
  const columns = new Array(height).fill(0).map((_, i) => i);

  const [showEncounter, setShowEncounter] = useState(false);
  // Reset show encounter when we leave encounter
  useEffect(() => {
    if (!encounter) {
      setShowEncounter(false);
    }
  }, [encounter]);

  const [showChatRoom, setShowChatRoom] = useState(false);
  // Reset show chatWith when we leave chatRoom
  useEffect(() => {
    if (!chatWith) {
      setShowChatRoom(false);
    }
  }, [chatWith]);

  const [permissionSettings, setPermissionSettings] = useState(0x0);
  useEffect(() => {
    const fetchData = async () => {
      const setting = await getPermissionSetting();
      setPermissionSettings(setting);
    };
    fetchData();
  }, [permissionSettings]);

  const [metadata, setTheMetadata] = useState('normal');
  useEffect(() => {
    const fetchData = async () => {
      const player = playerEntityId;
      if (!player) {
        throw new Error("no player");
      }
      const result = await getMetadata(player);
      setTheMetadata(result);
    };
    fetchData();
  }, [metadata]);

  const handleChange = async (value: number) => {
    console.log(`selected ${value}`);
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await setPermissionSetting(value);
  };

  const handleMetadataChange = async (value: string) => {
    console.log(`selected ${value}`);
    const player = playerEntityId;
    if (!player) {
      throw new Error("no player");
    }
    await setMetadata(value);
  };

  return (
    <div className="inline-grid p-2 bg-lime-500 relative overflow-hidden">
      {rows.map((y) =>
        columns.map((x) => {
          const terrainEmoji = terrain?.find(
            (t) => t.x === x && t.y === y
          )?.emoji;

          const playersHere = players?.filter((p) => p.x === x && p.y === y);
          const mainPlayerHere = playersHere?.find(
            (p) => p.entity === playerEntity
          );

          return (
            <div
              key={`${x},${y}`}
              className={twMerge(
                "w-8 h-8 flex items-center justify-center",
                onTileClick ? "cursor-pointer hover:ring" : null
              )}
              style={{
                gridColumn: x + 1,
                gridRow: y + 1,
              }}
              onClick={() => {
                onTileClick?.(x, y);
              }}
            >
              {encounter && mainPlayerHere ? (
                <div
                  className="absolute z-10 animate-battle"
                  style={{
                    boxShadow: "0 0 0 100vmax black",
                  }}
                  onAnimationEnd={() => {
                    setShowEncounter(true);
                  }}
                ></div>
              ) : null}
              {chatWith && mainPlayerHere ? (
                <div
                  className="absolute z-10 animate-battle"
                  style={{
                    boxShadow: "0 0 0 100vmax black",
                  }}
                  onAnimationEnd={() => {
                    setShowChatRoom(true);
                  }}
                ></div>
              ) : null}
              <div className="flex flex-wrap gap-1 items-center justify-center relative">
                {terrainEmoji ? (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl pointer-events-none">
                    {terrainEmoji}
                  </div>
                ) : null}
                <div className="relative">
                  {playersHere?.map((p) => (
                    <span key={p.entity}>{p.emoji}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      )}

      {encounter && showEncounter ? (
        <div
          className="relative z-10 -m-2 bg-black text-white flex items-center justify-center"
          style={{
            gridColumnStart: 1,
            gridColumnEnd: width + 1,
            gridRowStart: 1,
            gridRowEnd: height + 1,
          }}
        >
          {encounter}
        </div>
      ) : null}

      {chatWith && showChatRoom ? (
        <div
          className="relative z-10 -m-2 bg-black text-white flex items-center justify-center"
          style={{
            gridColumnStart: 1,
            gridColumnEnd: width + 1,
            gridRowStart: 1,
            gridRowEnd: height + 1,
          }}
        >
          {chatWith}
        </div>
      ) : null}

      <div style={{
        display: 'flex',
        position: 'fixed',
        top: 16,
        right: 16,
      }}>
        <Select
          defaultValue={metadata}
          style={{ width: 200 }}
          onChange={handleMetadataChange}
          options={[
            {
              label: 'Status',
              options: [
                { label: 'Normal', value: 'Normal' },
                { label: 'Focus', value: 'Focus' },
                { label: 'Do not disturb', value: 'Do not disturb' },
              ],
            },
          ]}
        />
        <div
        >
          <Select
            defaultValue={permissionSettings}
            style={{ width: 200 }}
            onChange={handleChange}
            options={[
              {
                label: 'Chat Permission Settings',
                options: [
                  { label: 'Public', value: 0x0 },
                  { label: 'Follower', value: 0x1 },
                  { label: 'Following', value: 0x2 },
                  { label: 'Friend', value: 0x3 },
                ],
              },
            ]}
          />
        </div>
      </div>
    </div >
  );
};
