import { EnvAppInfo } from "./EnvAppInfo";

export interface EnvironmentByParent {
  parent: string,
  envs: EnvAppInfo;
}
