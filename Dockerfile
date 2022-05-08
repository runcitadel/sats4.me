FROM node:18-bullseye-slim as build-dependencies-helper

# Create app directory
WORKDIR /app

# The current working directory
COPY . . 

# Install dependencies
RUN yarn workspaces focus -A --production

# Delete TypeScript code to further reduce image size
RUN find /app/node_modules | grep ".\.ts" | xargs rm

# TS Build Stage
FROM node:18-bullseye-slim as builder

# Change directory to '/app'
WORKDIR /app

# The current working directory
COPY . . 

# Install dependencies
RUN yarn install

# Build TS code
RUN yarn build

# Delete everyhing we don't need in the next stage
RUN rm -rf node_modules tsconfig.tsbuildinfo *.ts **/*.ts .eslint* .git* .prettier* .vscode* tsconfig.json .yarn* yarn.lock

# Final image
FROM node:18-bullseye-slim AS manager

# Copy built code from build stage to '/app' directory
COPY --from=builder /app/lib /app/lib

# Copy node_modules
COPY --from=build-dependencies-helper /app/node_modules /app/node_modules

# Copy package.json so node knows this is an ES module
COPY package.json /app/

# Copy static files
COPY public /app/public

# Change directory to '/app'
WORKDIR /app

CMD [ "node", "lib/server.js" ]
