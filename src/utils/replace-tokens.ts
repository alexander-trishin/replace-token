import { promises as fs } from 'fs';

import { detectEncoding } from './detect-encoding';

import type { ActionInput, FileEncoding } from './common/types';

interface Token {
    pattern: RegExp;
    value: string;
}

const replaceTokens = async (input: ActionInput): Promise<void> => {
    const tokens = getTokens(input);

    await Promise.all(input.filePaths.map(async filePath => await updateFile(filePath, input.fileEncoding, tokens)));
};

const getTokens = (input: Omit<ActionInput, 'filePaths' | 'fileEncoding'>): readonly Token[] => {
    const prefix = escapeRegexString(input.tokenPrefix);
    const suffix = escapeRegexString(input.tokenSuffix);

    return Object.entries(input.variables).map(([key, value]) => ({
        pattern: new RegExp(`${prefix}\\s*${escapeRegexString(key)}\\s*${suffix}`, 'gi'),
        value
    }));
};

const escapeRegexString = (value: string): string => {
    return value.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
};

const updateFile = async (filePath: string, fileEncoding: FileEncoding, tokens: readonly Token[]): Promise<void> => {
    const encoding = await detectEncoding(filePath, fileEncoding);

    let data = await fs.readFile(filePath, { encoding });

    for (const { pattern, value } of tokens) {
        data = data.replace(pattern, value);
    }

    await fs.writeFile(filePath, data, { encoding });
};

export { replaceTokens };
