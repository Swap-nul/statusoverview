export interface DeployDetails {
  tag: string,
  branch: string,
  status: string,
  cluster: string,
  commitby: string,
  commit_id: string,
  namespace: string,
  previous_tag: string,
  commitmessage: string,
  image_created_at: string,
  image_deployed_at: string,
  image_deployed_by: string,
  latest_build_tag: string
}
