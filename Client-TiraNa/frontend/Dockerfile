FROM node:18-alpine

WORKDIR /app

# Kopyahin ang package.json at package-lock.json (kung meron)
COPY package*.json ./

# I-install ang dependencies (galing sa package.json)
RUN npm install

# Kopyahin ang lahat ng source code
COPY . .

# Expose ang port
EXPOSE 5173

# Start ang development server
CMD ["npm", "run", "dev"]