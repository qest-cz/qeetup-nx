# There are newer versions of node (17 is tle latest)
FROM node:18 AS build-stage

WORKDIR /tmp-app

COPY . .

RUN npm install

RUN npm run build <%= name %>

FROM node:18 AS run-stage

# nonroot user
# USER 65534:65534

WORKDIR /usr/nonrootuser

COPY --chown=65534:65534 --from=build-stage /tmp-app .

CMD ["npm", "run", "start", "<%= name %>"]
