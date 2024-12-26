import { EnvDeployment } from './env-deployment';
export interface App {
  portfolio: string,
  parent: string,
  app_name: string,
  app_repo: string,
  envs: EnvDeployment,
  updated_on: string
}
