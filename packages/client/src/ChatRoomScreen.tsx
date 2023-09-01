import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { toast } from "react-toastify";
import { useMUD } from "./MUDContext";
import { getMetadata } from "@latticexyz/network/src/v2/schemas/tableMetadata";

type Props = {
    player: string;
    playerEmoji: string;
};

export const ChatRoomScreen = ({ player, playerEmoji }: Props) => {

    const {
        systemCalls: { leaveChat, followUser, unfollowUser, isFollowingUser, block, unblock, isBlockedUser, setPermissionSetting, getMetadata, canChatWithPlayer },
    } = useMUD();

    const [appear, setAppear] = useState(false);
    const [isFollow, setIsFollow] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [canChat, setCanChat] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        // sometimes the fade-in transition doesn't play, so a timeout is a hacky fix
        const timer = setTimeout(() => setAppear(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const refreshIsFollowing = async () => {
        const follow = await isFollowingUser(player);
        console.log("isFollowingUser: ", follow);
        setIsFollow(follow);
    }

    const refreshIsBlocked = async () => {
        const blocked = await isBlockedUser(player);
        setIsBlocked(blocked);
        console.log("isBlockedUser: ", blocked);
    }

    const refreshCanChat = async () => {
        const chat = await canChatWithPlayer(player);
        setCanChat(chat);
        console.log("canChatWithPlayer: ", chat);
    }

    const refreshStatus = async () => {
        const status = await getMetadata(player);
        setStatus(status);
        console.log("status: ", status);
    }

    useEffect(() => {
        const fetchData = async () => {
            await refreshIsFollowing();
            await refreshIsBlocked();
            await refreshCanChat();
            await refreshStatus();
        };
        fetchData();
    }, [player]);

    return (
        <div
            className={twMerge(
                "flex flex-col gap-10 items-center justify-center bg-black text-white transition-opacity duration-1000",
                appear ? "opacity-100" : "opacity-0"
            )}
        >
            <div className="text-8xl animate-bounce">{playerEmoji}</div>
            <div>Enter Chat with {player}!</div>
            <div>His/Her status {status}</div>

            <div className="flex gap-2">
                <button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={async () => {
                        if (isFollow) {
                            // string to Bytes 
                            await unfollowUser(player);
                            setIsFollow(false);

                            await refreshCanChat();
                        } else {
                            await followUser(player);
                            setIsFollow(true);

                            await refreshCanChat();
                        }
                    }}
                >
                    {isFollow ? "Unfollow" : "Follow"}
                </button>

                <button
                    type="button"
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={async () => {
                        if (isBlocked) {
                            await unblock(player);
                            setIsBlocked(false);
                            // TODO: 
                            setTimeout(async () => {
                                await refreshCanChat();
                            }, 3000);

                        } else {
                            await block(player);
                            setIsBlocked(true);
                            // TODO: 
                            setTimeout(async () => {
                                await refreshCanChat();
                            }, 3000);
                        }
                    }}
                >
                    {isBlocked ? "Unblock" : "Block"}
                </button>

                <button
                    type="button"
                    className={`font-bold py-2 px-4 rounded ${canChat ? 'bg-blue-500 hover:bg-blue-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                    onClick={async () => {
                        if (canChat) {
                            console.log("you send a message");
                        }
                    }}
                    disabled={!canChat}
                >
                    {canChat ? "SendMessage" : "You can't send message"}
                </button>

                <button
                    type="button"
                    className="bg-stone-800 hover:ring rounded-lg px-4 py-2"
                    onClick={async () => {
                        const toastId = toast.loading("leaving…");
                        await leaveChat();
                        toast.update(toastId, {
                            isLoading: false,
                            type: "default",
                            render: `You leave!`,
                            autoClose: 5000,
                            closeButton: true,
                        });
                    }}
                >
                    🏃‍♂️ leave
                </button>
            </div>
        </div>
    );
};