import * as dotenv from 'dotenv'

dotenv.config()

export const CTP_PROJECT_KEY= process.env.CTP_PROJECT_KEY ?? ""
export const CTP_CLIENT_SECRET= process.env.CTP_CLIENT_SECRET ?? ""
export const CTP_CLIENT_ID=process.env.CTP_CLIENT_ID ?? ""
export const CTP_AUTH_URL=process.env.CTP_AUTH_URL ?? ""
export const CTP_API_URL=process.env.CTP_API_URL ?? ""
export const CTP_SCOPES=process.env.CTP_SCOPES ?? ""
