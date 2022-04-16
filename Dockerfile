FROM node:16
COPY . /app
WORKDIR /app
RUN npm install
RUN npm run build
# RUN npm prune --production
ENV NODE_ENV=production
ENTRYPOINT [ "npm" ]
CMD [ "run", "serve" ]