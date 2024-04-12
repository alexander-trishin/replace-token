import * as core from '@actions/core';

export const run = async (): Promise<void> => {
    try {
        const message = core.getInput('message');

        core.debug(message);
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
};
