import { OnionBuilder, ServiceNode, LogLevel } from 'onion-request-lib';
import axios from 'axios';

export const OXEN_SEED_NODES = [
    'http://seed1.getsession.org/json_rpc',
    'http://seed2.getsession.org/json_rpc',
    'http://seed3.getsession.org/json_rpc'
] as const;


// Mock service nodes for development - replace with real Oxen service nodes
export const SERVICE_NODES: ServiceNode[] = [
    {
        "pubkey_ed25519": "3b41cd525d8a823b4c4a50ceb1ab6a79967354fe057311499b55c2884ec70f28",
        "pubkey_x25519": "81a950fde45f22db69e5f52d58cf6384578208c20c73e0609c0cb6c23b48ad1d",
        "public_ip": "172.93.108.154",
        "storage_lmq_port": 20208,
        "storage_port": 22108,
        "swarm_id": 2053641430080946175
    },
    {
        "pubkey_ed25519": "84daeb764b9c23047cc595a44da14d8dd1c1596f318bc7714025b64d5c660980",
        "pubkey_x25519": "33e98e7291e4686efce62df1ac9d624379b0a26921d20042a85894bb71618b14",
        "public_ip": "5.161.216.4",
        "storage_lmq_port": 22020,
        "storage_port": 22021,
        "swarm_id": 12033618204333965311
    },
    {
        "pubkey_ed25519": "d1d935f6fe71384ee7f5765fd3e909d1df294d15db0183be2de0b59552e2335d",
        "pubkey_x25519": "e7149af982603279f13ac0dd9fb2091523587f7a81c31495fc701a726f1d0a64",
        "public_ip": "64.235.33.156",
        "storage_lmq_port": 22020,
        "storage_port": 22021,
        "swarm_id": 9655717601082343423
    },
    {
        "pubkey_ed25519": "d458bccd428b87db4da22a20b41da2a5672d6d0e3976a24e9f3e594ac593abfd",
        "pubkey_x25519": "5c27d9a28c3fe2c4ccc58359c661f34dcbbbfc96faa31d5e0de8450f054c8061",
        "public_ip": "185.219.84.241",
        "storage_lmq_port": 22020,
        "storage_port": 22021,
        "swarm_id": 17942340915444056063
    },
    // {
    //     "pubkey_ed25519": "772b436c009f56c3cb27b78541d27ba41d3c3ac839784dad2d0295689083a027",
    //     "pubkey_x25519": "dd3649b11681729d3607239d68c0181c046dcba3e4357fe968a3b0b5247cac27",
    //     "public_ip": "102.219.85.100",
    //     "storage_lmq_port": 20200,
    //     "storage_port": 22100,
    //     "swarm_id": 13402712491054596095
    // },
    // {
    //     "pubkey_ed25519": "ff7a9782e66b20bc29ee97c6c7591da1a72333df6e3e76ee85b4708cc6788c0b",
    //     "pubkey_x25519": "3d723113a98838d576438176230613ea1dd478cfcb890383ba09272796813431",
    //     "public_ip": "154.12.246.164",
    //     "storage_lmq_port": 22020,
    //     "storage_port": 22021,
    //     "swarm_id": 18302628885633695743
    // },
    // {
    //     "pubkey_ed25519": "373773ffdeee58dc4771ffc899f8bf5d3465f6515fce6a69d9a37703702078e0",
    //     "pubkey_x25519": "13e17f861b4d558500cf04342ffccf9676f2840d37e4ec0ef168101b3157a74d",
    //     "public_ip": "199.195.251.163",
    //     "storage_lmq_port": 22020,
    //     "storage_port": 22021,
    //     "swarm_id": 2269814212194729983
    // },
    // {
    //     "pubkey_ed25519": "1f515f2776f6ddf826715f8d7a3e54de65ad1b1e2f29ab3dee4f536f69aa637e",
    //     "pubkey_x25519": "3a03530090426934c5821d2823f64d1f8ec447a813f3f1c4a5fc5464a964bb0b",
    //     "public_ip": "172.93.103.156",
    //     "storage_lmq_port": 20215,
    //     "storage_port": 22115,
    //     "swarm_id": 3710966092953288703
    // },
    // {
    //     "pubkey_ed25519": "5ef7c8a50f9dbd313735fcbca10c6744dbe23fde7b0c41f210dbe88fc729dc68",
    //     "pubkey_x25519": "093dc02a7a20661bf99d42bbfb020a703a9aa09552678362782d311c533e4765",
    //     "public_ip": "188.40.83.187",
    //     "storage_lmq_port": 22020,
    //     "storage_port": 22021,
    //     "swarm_id": 2269814212194729983
    // },
    // {
    //     "pubkey_ed25519": "15d5aff81157128e0a5d9c3dc278c0b8c23f5ad734b3627a15d708e9bd50eb21",
    //     "pubkey_x25519": "d4620c192bb23eea61d64451b59ecf10a8f17fd32240dca030a76d2a6acdf56f",
    //     "public_ip": "95.217.218.66",
    //     "storage_lmq_port": 22401,
    //     "storage_port": 22101,
    //     "swarm_id": 15996785876420001791
    // }
];

// Create browser-compatible axios instance
const axiosInstance = axios.create({
  timeout: 10000,
});

// Add response interceptor for better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error);
    return Promise.reject(error);
  }
);

// Create onion builder instance - using LogLevel.PROD
export const onionBuilder = new OnionBuilder(SERVICE_NODES, axiosInstance, 3, LogLevel.PROD, process.env.NEXT_PUBLIC_NODE_GATEWAY_HOST || 'http://localhost:4000/http-proxy');

// Gateway server configuration
export const GATEWAY_CONFIG = {
    host: process.env.NEXT_PUBLIC_CHAT_GATEWAY_HOST || 'localhost',
    port: parseInt(process.env.NEXT_PUBLIC_CHAT_GATEWAY_PORT || '4000'),
    protocol: (process.env.NEXT_PUBLIC_CHAT_GATEWAY_PROTOCOL || 'http') as 'http' | 'https',
    target: process.env.NEXT_PUBLIC_CHAT_GATEWAY_TARGET || '/oxen/e2ee-chat/lsrpc'
};

// API configuration
export const API_CONFIG = {
    timeout: 10000,
};
