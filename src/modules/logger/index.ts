export * from './base';
export * from './logger';

import { HellionColorizeFormatter } from './formatters/ColorizeFormatter';
import { HellionJSONFormatter } from './formatters/JSONFormatter';
export const formatters = {
    HellionColorizeFormatter,
    HellionJSONFormatter
};

import { ConsoleTransporter } from './transporters/ConsoleTransporter';
import { FileTransporter } from './transporters/FileTransporter';
export const transporters = {
    ConsoleTransporter,
    FileTransporter
}