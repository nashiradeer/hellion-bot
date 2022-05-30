export * from './player';

export const resolvers = {
    playDl: async () => {
        return await import('./resolvers/play-dl');
    },
    ytdl: async () => {
        return await import('./resolvers/ytdl');
    }
}
