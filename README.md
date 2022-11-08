# DeerSoftware // Hellion

Hellion (previously Hellion Warden) is a Discord bot created by Nashira Deer to play videos from YouTube in a voice chat, but after DeerSoftware has taken the development, the features of Hellion have been extended to play songs from other media, play minigames, and has an economic system.

## Building

Hellion can be built using Docker or Node.js directly, the Docker way is recommended because is the method used by DeerSoftware in production, Node.js method is still supported to be used with VS Code debugger or other debugging tools.

### Node.js

1. Download and install Node.js v16
2. Install the packages using ``npm ci``
3. Build the TypeScript source using ``npm run build``
4. Run with ``npm start``

### Docker

1. Build an image using ``docker build -t hellion:latest .``
2. Create a ``.env`` file containing the necessary variables.
3. Run the container using ``docker run --env-file .env hellion:latest``

## Lifecycle

| Version | Discord.js | Node.js | Supported          |
| ------- | ---------- | ------- | ------------------ |
| 1.0     | 13         | 16      | :x:                |
| 1.1     | 13         | 16      | :white_check_mark: |

## Licensing

(c) 2022 DeerSoftware. All Rights Reserved.  
Proprietary software, licensed under DeerSoftware Internals 1.0.0, you can't redistribute, modify, fork, or use without the needed permissions from the copyright holder.
