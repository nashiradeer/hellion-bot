# Nashira Deer // Hellion

**Warning: Hellion hasn't been maintained since 2023. If you're searching for a music bot, consider using [Hydrogen](https://github.com/nashiradeer/hydrogen-bot).**

Hellion (previously Hellion Warden) is a Discord bot created by Nashira Deer to play videos from YouTube, and other medias in a voice chat.

## Building

Hellion can be built using Docker or using Node.js directly, but the Docker way is recommended.

### Node.js

1. Download and install Node.js v16
2. Install the packages using ``npm ci``
3. Build the TypeScript source using ``npm run build``
4. Run with ``npm start``

### Docker

1. Build an image using ``docker build -t hellion:latest .``
2. Create a ``.env`` file containing the necessary variables.
3. Run the container using ``docker run --env-file .env hellion:latest``

## License

Created by [Nashira Deer](https://www.nashiradeer.com) and licensed under [General Public License v3.0](https://github.com/nashiradeer/hellion-bot/blob/main/LICENSE.txt).
