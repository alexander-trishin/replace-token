import * as core from '@actions/core';

import { parseActionInput } from './utils/parse-action-input';
import { replaceTokens } from './utils/replace-tokens';

export const run = async (): Promise<void> => {
    try {
        const input = await parseActionInput();
        core.debug('The input has been parsed');

        if (Object.keys(input.variables).length === 0) {
            core.warning(
                'No replacement data was found. ' +
                    'Make sure that you have defined at least one of the following input parameters: ' +
                    'variables, variables-json, variables-secret-json'
            );

            return;
        }

        await replaceTokens(input);
        core.debug('All tokens have been replaced');
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
};
