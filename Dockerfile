# 
# Copyright © 2024 The StatusOverview Authors

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

# 	http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# 

FROM node:lts-alpine3.18 AS build

WORKDIR /build

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare pnpm@9.14.4 --activate
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# stage nginx
FROM nginxinc/nginx-unprivileged:stable

WORKDIR /usr/share/nginx/html

COPY --from=build /build/dist/statusoverview/ .

COPY nginx.conf /etc/nginx/nginx.conf

USER root

RUN chown -R nginx /usr/share/nginx/html && \
    chown -R nginx /etc/nginx/nginx.conf

USER nginx
