import * as core from '@actions/core';
import * as glob from '@actions/glob';

import { ActionInputNames } from './common/constants';

import type { ActionInput, FileEncoding } from './common/types';

const parseActionInput = async (): Promise<Readonly<ActionInput>> => ({
    filePaths: await getFilePaths(),
    fileEncoding: core.getInput(ActionInputNames.Encoding, { required: true }) as FileEncoding,
    tokenPrefix: core.getInput(ActionInputNames.TokenPrefix, { required: true }),
    tokenSuffix: core.getInput(ActionInputNames.TokenSuffix, { required: true }),
    variables: {
        ...getJsonVariables(ActionInputNames.VariablesJson),
        ...getJsonVariables(ActionInputNames.VariablesSecretJson),
        ...getYamlVariables(ActionInputNames.Variables)
    }
});

const getFilePaths = async (): Promise<string[]> => {
    const patterns = core.getInput(ActionInputNames.Target, { required: true });
    const followSymbolicLinks = core.getBooleanInput(ActionInputNames.FollowSymbolicLinks, { required: true });

    const globber = await glob.create(patterns, { followSymbolicLinks, matchDirectories: false });
    const result = await globber.glob();

    return result.length > 0 ? result : throwInputError(ActionInputNames.Target, 'no files were found');
};

const getYamlVariables = (inputName: ActionInputNames): Record<string, string> | undefined => {
    const variables = core.getMultilineInput(inputName);

    if (!variables || variables.length === 0) return;

    const empty = ['""', "''"];
    const emptyEscaped = ['\\"\\"', "\\'\\'"];

    const result: Record<string, string> = {};

    for (let i = 0; i < variables.length; i++) {
        const current = variables[i];

        if (!current.startsWith('-') || !current.includes(':')) {
            core.warning(`Variable '${current}' is not valid and will be skipped. Example: - VARIABLE${i}: YOUR_VALUE`);
            continue;
        }

        const [rawKey, rawValue] = variables[i].slice(1).split(/:(.*)/s);
        const key = rawKey?.trim();

        if (!key) {
            core.warning(`Invalid token key in variable '${current}'`);
            continue;
        }

        const value = rawValue?.trim();

        result[key] =
            !value || empty.includes(value) ? '' : emptyEscaped.includes(value) ? value.replaceAll('\\', '') : value;
    }

    return result;
};

const getJsonVariables = (inputName: ActionInputNames): Record<string, string> | undefined => {
    const variables = core.getInput(inputName);

    if (!variables || ['', '""', "''", 'null'].includes(variables)) return;

    try {
        const result = JSON.parse(variables);

        if (!result || result.constructor?.name !== 'Object') {
            throwInputError(inputName, 'JSON is valid, but value is not an object', 'parsing');
        }

        for (const key in result) {
            if (typeof result[key] === 'string') continue;

            result[key] = String(result[key]);
        }

        return result;
    } catch (error) {
        if (error instanceof Error && error.cause) throw error;

        throwInputError(inputName, 'JSON is invalid');
    }
};

const throwInputError = (inputName: ActionInputNames, message: string, cause?: unknown): never => {
    throw new Error(`Input '${inputName}': ${message}`, { cause });
};

export { parseActionInput };
