import { EnvAppInfo } from "./env-app-info";

export interface EnvironmentByParent {
  parent: string,
  envs: EnvAppInfo;
}
