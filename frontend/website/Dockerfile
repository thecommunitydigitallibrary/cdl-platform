# FROM node:14-alpine AS development
# ENV NODE_ENV development
FROM node
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
ENV REACT_APP_NAME=cdlWebsite
EXPOSE 80
RUN npm run build
CMD ["npx", "next", "start", "-p", "80"]