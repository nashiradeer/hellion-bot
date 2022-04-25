export * from './player';

import { HellionYtdlResolver } from './resolvers/HellionYtdlResolver';
import { HellionYtplResolver } from './resolvers/HellionYtplResolver';
import { HellionYtsrResolver } from './resolvers/HellionYtsrResolver';
import { HellionYoutubedlResolver } from './resolvers/HellionYoutubedlResolver';
export const resolvers = {
    HellionYtdlResolver, HellionYtplResolver, HellionYtsrResolver, HellionYoutubedlResolver
};