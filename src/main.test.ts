import * as core from '@actions/core';

import * as main from './main';
import * as parseActionInput from './utils/parse-action-input';
import * as replaceTokens from './utils/replace-tokens';

import type { ActionInput } from './utils/common/types';

const runMock = jest.spyOn(main, 'run');

const parseActionInputMock = jest.spyOn(parseActionInput, 'parseActionInput');
const replaceTokensMock = jest.spyOn(replaceTokens, 'replaceTokens');

let debugMock: jest.SpiedFunction<typeof core.debug>;
let warningMock: jest.SpiedFunction<typeof core.warning>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;

const defaultInput: ActionInput = {
    filePaths: ['./test.txt'],
    fileEncoding: 'auto',
    tokenPrefix: '${{',
    tokenSuffix: '}}',
    variables: {}
};

describe('run', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        debugMock = jest.spyOn(core, 'debug').mockImplementation();
        warningMock = jest.spyOn(core, 'warning').mockImplementation();
        setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation();
    });

    it('when error thrown, then sets a failed status', async () => {
        const expectedErrorMessage = 'oops...';

        parseActionInputMock.mockImplementation(() => {
            throw new Error(expectedErrorMessage);
        });

        await main.run();

        expect(runMock).toHaveReturned();
        expect(replaceTokensMock).not.toHaveBeenCalled();

        expect(warningMock).not.toHaveBeenCalled();
        expect(setFailedMock).toHaveBeenNthCalledWith(1, expectedErrorMessage);
    });

    it('when no replacement data, then writes warning and stops execution', async () => {
        parseActionInputMock.mockImplementation(async () => ({ ...defaultInput }));

        await main.run();

        expect(runMock).toHaveReturned();
        expect(replaceTokensMock).not.toHaveBeenCalled();

        expect(debugMock).toHaveBeenNthCalledWith(1, 'The input has been parsed');
        expect(warningMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/no replacement data was found/i));

        expect(setFailedMock).not.toHaveBeenCalled();
    });

    it('when replacement data is present, then replaces tokens', async () => {
        const input: ActionInput = {
            ...defaultInput,
            tokenPrefix: '{{',
            tokenSuffix: '}}',
            variables: {
                variable0: 'test-0',
                secret1: 'test-1'
            }
        };

        parseActionInputMock.mockImplementation(async () => input);
        replaceTokensMock.mockResolvedValue();

        await main.run();

        expect(runMock).toHaveReturned();
        expect(replaceTokensMock).toHaveBeenCalledWith(input);

        expect(debugMock).toHaveBeenCalledTimes(2);

        expect(debugMock.mock.calls[0]).toStrictEqual(['The input has been parsed']);
        expect(debugMock.mock.calls[1]).toStrictEqual(['All tokens have been replaced']);

        expect(warningMock).not.toHaveBeenCalled();
        expect(setFailedMock).not.toHaveBeenCalled();
    });
});
