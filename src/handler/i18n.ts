import { Locale } from "discord.js"
import { readFile, readdir } from "fs/promises";
import { basename, join } from "path";

export type HellionTranslation = Partial<Record<string, string | null | undefined>>;
export type HellionCategory = Partial<Record<string, HellionTranslation | null | undefined>>;
export type HellionI18nCache = Partial<Record<Locale, HellionCategory | null | undefined>>;

export class HellionI18n {
    public languages: HellionI18nCache;
    public default: Locale;

    constructor(defaultLanguage: Locale = Locale.EnglishUS) {
        this.default = defaultLanguage;
        this.languages = {};
    }

    public async loadFile(path: string): Promise<void> {
        const filename = basename(path, '.json');
        const locale = filename as Locale;
        const content = JSON.parse(await readFile(path, { encoding: 'utf-8' }));
        this.languages[locale] = content;
    }

    public async loadDir(path: string): Promise<void> {
        for (const file of await readdir(path)) {
            if (file.endsWith(".json")) {
                const fullfile = join(path, file);
                await this.loadFile(fullfile);
            }
        }
    }

    public formatKey(category: string, key: string): string {
        return `${category}.${key}`;
    }

    public getIfExists(lang: Locale, category: string, key: string): string | null {
        const value = this.languages[lang]?.[category]?.[key];
        if (value) {
            return value;
        } else {
            return null;
        }
    }

    public getDefault(category: string, key: string, vars?: Record<string, string>): string {
        let value = this.languages[this.default]?.[category]?.[key];
        if (value) {
            for (const v in vars) {
                value = value.replace(`$${v}`, vars[v]);
            }
            return value;
        } else {
            return this.formatKey(category, key);
        }
    }

    public get(lang: Locale, category: string, key: string, vars?: Record<string, string>): string {
        let value = this.languages[lang]?.[category]?.[key];
        if (value) {
            for (const v in vars) {
                value = value.replace(`$${v}`, vars[v]);
            }
            return value;
        } else {
            return this.getDefault(category, key, vars);
        }
    }

    public getAll(category: string, key: string): Partial<Record<Locale, string>> {
        const langs: Partial<Record<Locale, string>> = {};
        for (const langString in Locale) {
            const lang = Locale[langString];
            const value = this.getIfExists(lang, category, key);
            if (value)
                langs[lang] = value;
        }
        return langs;
    }
}