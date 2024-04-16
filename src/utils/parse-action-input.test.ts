import * as core from '@actions/core';
import * as glob from '@actions/glob';

import { ActionInputNames } from './common/constants';
import { parseActionInput } from './parse-action-input';

import type { FileEncoding } from './common/types';

let inputMock: jest.SpiedFunction<typeof core.getInput>;
let booleanInputMock: jest.SpiedFunction<typeof core.getBooleanInput>;
let multilineInputMock: jest.SpiedFunction<typeof core.getMultilineInput>;

let warningMock: jest.SpiedFunction<typeof core.warning>;

const createGlobberMock = jest.spyOn(glob, 'create');

const mockGlob = (
    options: {
        target?: string;
        filePaths?: string[];
        followSymbolicLinks?: boolean;
        onGetInput?: (name: string) => string;
    } = {}
): void => {
    const { target = './test*.txt', filePaths = ['./testfile.txt'], followSymbolicLinks = false, onGetInput } = options;

    inputMock.mockImplementation(name => (name === ActionInputNames.Target ? target : onGetInput?.(name) ?? ''));
    booleanInputMock.mockImplementation(name => name === ActionInputNames.FollowSymbolicLinks && followSymbolicLinks);

    createGlobberMock.mockImplementation(async (patterns, globOptions) => {
        if (patterns === target && globOptions?.followSymbolicLinks === followSymbolicLinks) {
            return {
                getSearchPaths: jest.fn(),
                glob: jest.fn().mockImplementation(async () => filePaths),
                globGenerator: jest.fn()
            };
        }

        throw new Error('unexpected input parameters');
    });
};

describe('parse-action-input', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        inputMock = jest.spyOn(core, 'getInput').mockImplementation();
        booleanInputMock = jest.spyOn(core, 'getBooleanInput').mockImplementation(() => false);
        multilineInputMock = jest.spyOn(core, 'getMultilineInput').mockImplementation(() => []);

        warningMock = jest.spyOn(core, 'warning').mockImplementation();
    });

    describe(`${ActionInputNames.Target}`, () => {
        it('when files not found, then throws error', async () => {
            mockGlob({ target: './not-exists.txt', filePaths: [] });

            await expect(parseActionInput).rejects.toThrowErrorMatchingInlineSnapshot(
                '"Input \'target\': no files were found"'
            );
        });

        it('when file exists, then returns file path', async () => {
            const expectedFilePaths = ['./test-0.txt', './test-1.txt'];

            mockGlob({ target: './test-*.txt', filePaths: expectedFilePaths });

            const actual = await parseActionInput();

            expect(actual.filePaths).toBe(expectedFilePaths);
        });
    });

    describe(`${ActionInputNames.Encoding}`, () => {
        it('when encoding provided, then returns that encoding', async () => {
            const expectedEncoding: FileEncoding = 'utf-8';

            mockGlob({ onGetInput: name => (name === ActionInputNames.Encoding ? expectedEncoding : '') });

            const actual = await parseActionInput();

            expect(actual.fileEncoding).toBe(expectedEncoding);
        });
    });

    describe(`${ActionInputNames.FollowSymbolicLinks}`, () => {
        it('when enabled, then uses provided flag', async () => {
            mockGlob({ followSymbolicLinks: true });

            const actual = await parseActionInput();

            expect(actual.filePaths).not.toHaveLength(0);

            expect(booleanInputMock).toHaveBeenCalledTimes(1);
        });
    });

    describe(`${ActionInputNames.TokenPrefix}`, () => {
        it('when not provided, then returns default value', async () => {
            mockGlob();

            const actual = await parseActionInput();

            expect(actual.tokenPrefix).toBe('');
        });

        it('when provided, then returns same value', async () => {
            mockGlob({ onGetInput: name => (name === ActionInputNames.TokenPrefix ? '%' : '') });

            const actual = await parseActionInput();

            expect(actual.tokenPrefix).toBe('%');
        });
    });

    describe(`${ActionInputNames.TokenSuffix}`, () => {
        it('when not provided, then returns default value', async () => {
            mockGlob();

            const actual = await parseActionInput();

            expect(actual.tokenSuffix).toBe('');
        });

        it('when provided, then returns same value', async () => {
            mockGlob({ onGetInput: name => (name === ActionInputNames.TokenSuffix ? '*' : '') });

            const actual = await parseActionInput();

            expect(actual.tokenSuffix).toBe('*');
        });
    });

    describe(`${ActionInputNames.Variables}`, () => {
        it('when not provided, then returns empty object', async () => {
            mockGlob();

            const actual = await parseActionInput();

            expect(actual.variables).toStrictEqual({});
        });

        it('when provided, then creates a whole new map', async () => {
            mockGlob();

            multilineInputMock.mockImplementation(name => {
                if (name === ActionInputNames.Variables) {
                    return [
                        '- var0:0',
                        '- var1 : space',
                        '- var2: https://test.com',
                        '-var3 :a b c',
                        '- var4: ',
                        '- var5: ""',
                        "- var6: ''",
                        "- var7: \\'\\'",
                        '- var8: \\"\\"',
                        '- var9',
                        '- : ',
                        'var10: missing prefix'
                    ];
                }

                return [];
            });

            const actual = await parseActionInput();

            expect(actual.variables).toStrictEqual({
                var0: '0',
                var1: 'space',
                var2: 'https://test.com',
                var3: 'a b c',
                var4: '',
                var5: '',
                var6: '',
                var7: "''",
                var8: '""'
            });

            expect(warningMock).toHaveBeenCalledTimes(3);

            expect(warningMock.mock.calls[0][0]).toMatch(/'- var9'.+?not\svalid.+?skipped/i);
            expect(warningMock.mock.calls[1][0]).toMatch(/invalid token key.+?'- : '/i);
            expect(warningMock.mock.calls[2][0]).toMatch(/'var10: missing prefix'.+?not\svalid.+?skipped/i);
        });
    });

    describe(`${ActionInputNames.VariablesJson}`, () => {
        it('when not provided, then returns empty object', async () => {
            mockGlob();

            const actual = await parseActionInput();

            expect(actual.variables).toStrictEqual({});
        });

        it('when JSON is not valid, then throws error', async () => {
            mockGlob({ onGetInput: name => (name === ActionInputNames.VariablesJson ? '}{' : '') });

            const snapshot = `"Input '${ActionInputNames.VariablesJson}': JSON is invalid"`;

            await expect(parseActionInput).rejects.toThrowErrorMatchingInlineSnapshot(snapshot);
        });

        it('when JSON array provided, then throws error', async () => {
            mockGlob({ onGetInput: name => (name === ActionInputNames.VariablesJson ? '[]' : '') });

            const snapshot = `"Input '${ActionInputNames.VariablesJson}': JSON is valid, but value is not an object"`;

            await expect(parseActionInput).rejects.toThrowErrorMatchingInlineSnapshot(snapshot);
        });

        it('when provided, then returns parsed map', async () => {
            const vars = '{ "var1": true, "var2": 2, "var3": "3" }';

            mockGlob({ onGetInput: name => (name === ActionInputNames.VariablesJson ? vars : '') });

            const actual = await parseActionInput();

            expect(actual.variables).toStrictEqual({ var1: 'true', var2: '2', var3: '3' });
        });
    });

    describe(`${ActionInputNames.VariablesSecretJson}`, () => {
        it('when not provided, then returns empty object', async () => {
            mockGlob();

            const actual = await parseActionInput();

            expect(actual.variables).toStrictEqual({});
        });

        it('when JSON is not valid, then throws error', async () => {
            mockGlob({ onGetInput: name => (name === ActionInputNames.VariablesSecretJson ? '][' : '') });

            const snapshot = `"Input '${ActionInputNames.VariablesSecretJson}': JSON is invalid"`;

            await expect(parseActionInput).rejects.toThrowErrorMatchingInlineSnapshot(snapshot);
        });

        it('when boolean provided, then throws error', async () => {
            mockGlob({ onGetInput: name => (name === ActionInputNames.VariablesSecretJson ? 'true' : '') });

            const snapshot = `"Input '${ActionInputNames.VariablesSecretJson}': JSON is valid, but value is not an object"`;

            await expect(parseActionInput).rejects.toThrowErrorMatchingInlineSnapshot(snapshot);
        });

        it('when provided, then returns parsed map', async () => {
            const secrets = '{ "api-key": "qwerty", "secret": null }';

            mockGlob({ onGetInput: name => (name === ActionInputNames.VariablesSecretJson ? secrets : '') });

            const actual = await parseActionInput();

            expect(actual.variables).toStrictEqual({ 'api-key': 'qwerty', secret: 'null' });
        });
    });
});
