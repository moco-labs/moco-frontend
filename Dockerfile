FROM node:21-alpine AS build

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

FROM nginx:alpine AS runtime

RUN mkdir -p /tmp/nginx/client_body \
    /tmp/nginx/proxy \
    /tmp/nginx/fastcgi \
    /tmp/nginx/uwsgi \
    /tmp/nginx/scgi \
    /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp \
    && chown -R nginx:nginx /tmp/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && chmod -R 755 /tmp/nginx \
    && chmod -R 755 /var/cache/nginx

COPY deploy/nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
