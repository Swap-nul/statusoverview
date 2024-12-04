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