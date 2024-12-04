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

FROM node:lts-alpine3.18 as npm

WORKDIR /build
COPY package.json .
RUN npm install
RUN npm install -g @angular/cli@8.0.6
ENV PATH=${PATH}:./node_modules/.bin
ENV NODE_PATH=/build/node_modules

# stage node
FROM npm as ng
WORKDIR /build
COPY / .
RUN ng build

# stage nginx
FROM nginxinc/nginx-unprivileged:stable

WORKDIR /usr/share/nginx/html

COPY --from=ng /build/dist/statusoverview/ .

COPY nginx.conf /etc/nginx/nginx.conf

USER root

RUN chown -R nginx /usr/share/nginx/html && \
    chown -R nginx /etc/nginx/nginx.conf

USER nginx