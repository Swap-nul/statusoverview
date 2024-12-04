export interface Builds {
  build_id: string,
  app_id: string,
  image: string,
  tag: string,
  git_sha: string,
  docker_sha: string,
  branch: string,
  created_at: string,
  commitmessage: string,
  commitby: string,
}
