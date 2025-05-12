import { createClient } from "agora-rtc-react";


const appId = "00665878d69249609feb882d133088f8";
const token = null;
export const config = { mode: "rtc", codec: "vp8", appId: appId, token: token };
export const useClient = createClient(config);

