###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:22-alpine As development

# Create app directory
WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

RUN yarn install

COPY --chown=node:node . .

USER node

###################
# BUILD FOR PRODUCTION
###################

FROM node:22-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

RUN yarn build

# ENV NODE_ENV production

RUN yarn install --only=production && yarn cache clean --force

USER node

###################
# PRODUCTION
###################

FROM node:22-alpine As production

WORKDIR /usr/src/app
ENV NODE_ENV production
ENV TZ=UTC

RUN apk add --no-cache dumb-init

# --- FIX 1: Copy package.json to the final image ---
COPY --chown=node:node package*.json ./

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Careful with this path. If your code expects config at dist/src/config, keep it.
# If your code expects dist/config, you might need to adjust this.
COPY --chown=node:node --from=build /usr/src/app/src/config/env ./dist/src/config/env

USER node

EXPOSE 3000
ENV PORT 3000

ENTRYPOINT ["dumb-init", "--"]

# --- FIX 2: Correct path to main.js (Removed /src/) ---
CMD [ "node", "dist/main.js" ]