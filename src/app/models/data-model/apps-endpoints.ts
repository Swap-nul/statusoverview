import { Envs } from "./envs"

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
