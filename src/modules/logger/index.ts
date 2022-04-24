export * from './base';
export * from './logger';

import { HellionColorizeFormatter } from './formatters/ColorizeFormatter';
import { HellionJSONFormatter } from './formatters/JSONFormatter';
export const formatters = {
    HellionColorizeFormatter,
    HellionJSONFormatter
};

import { HellionConsoleTransporter } from './transporters/HellionConsoleTransporter';
import { HellionFileTransporter } from './transporters/HellionFileTransporter';
export const transporters = {
    HellionConsoleTransporter,
    HellionFileTransporter
}