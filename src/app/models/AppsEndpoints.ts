import { Envs } from "./Envs"

export interface AppsEndpoints {
  name: string,
  hostname: Envs,
  endpoints: {
    healthCheck: {
      endpoint: string,
      status: Envs
    }
  }
}
