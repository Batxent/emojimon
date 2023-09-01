import { ethers, Wallet } from "ethers"
import { getNetworkConfig } from "../mud/getNetworkConfig";

// 0x864215F6080B2f4551Eae20330a470e085192d44
// 0x8C7B3884f6C9736A38DEEB6F95A1DbD61aC31Bf1
// 0x159276D8305ec9f1A7B5864550E2AdEb78d1859b
// 0xDdd2285E162A2a8A31338B08530dD4bc4364c04c
// 0x12B4Ef1123820ff2CFD389E19887d2E5E08C9bff
// 0xf1aF0298DcFCE09926D114Aa454A82E4784A89F0
// 0x87BB35e90134Ce45aF80EB1DFAe75854320f9794
// 0x1832A8533cBD5E769483d62825e5a249033fA6dc
export const SOCIAL_PLUGIN_ADDRESS = "0x1832A8533cBD5E769483d62825e5a249033fA6dc"
export const SOCIAL_PLUGIN_ABI = [
    "function follow(address _follower, address _following) external returns (bool)",
    "function unfollow(address _follower, address _following) external returns (bool)",
    "function isFollowing(address _follower, address _following) external view returns (bool)",
    "function blockUser(address _blocker, address _blocked) external returns (bool)",
    "function unblockUser(address _blocker, address _blocked) external returns (bool)",
    "function isBlocked(address _blocker, address _blocked) external view returns (bool)",
    "function setPermission(address _user, uint32 _permission) external returns (bool)",
    "function getPermission(address _user) external view returns (uint32)",
    "function canChat(address _sender, address _receiver) external view returns (bool)",
    "function setMetadata(address _user, bytes32 _metadata) external returns (bool)",
    "function getMetadata(address _user) external view returns (bytes32)"
]