import { promises as fs } from 'fs';

import * as detectEncoding from './detect-encoding';
import { replaceTokens } from './replace-tokens';

import type { ActionInput } from './common/types';

jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn()
    }
}));

const detectEncodingMock = jest.spyOn(detectEncoding, 'detectEncoding');

const readFileMock = fs.readFile as unknown as jest.SpiedFunction<typeof fs.readFile>;
const writeFileMock = fs.writeFile as unknown as jest.SpiedFunction<typeof fs.writeFile>;

const defaultInput: ActionInput = {
    filePaths: ['./test-file.txt'],
    fileEncoding: 'auto',
    tokenPrefix: '${{',
    tokenSuffix: '}}',
    variables: {}
};

describe('replace-tokens', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('when single simple template provided, then replaces tokens in file', async () => {
        const input: ActionInput = {
            ...defaultInput,
            fileEncoding: 'utf-8',
            variables: {
                USERNAME: 'John Doe',
                PASSWORD: 'qwerty123'
            }
        };

        const filePath = input.filePaths[0];
        const encoding = input.fileEncoding;

        const content = 'Hi, ${{ USERNAME }}. Your password is: ${{ PASSWORD }}.';
        const expectedContent = 'Hi, John Doe. Your password is: qwerty123.';

        detectEncodingMock.mockResolvedValue(input.fileEncoding as BufferEncoding);
        readFileMock.mockImplementation(async path => (path === filePath ? content : ''));

        await replaceTokens(input);

        expect(writeFileMock).toHaveBeenCalledWith(filePath, expectedContent, { encoding });
    });

    it('when encoding is set to auto and not resolved by chardet, then replaces tokens in file using default encoding', async () => {
        const defaultEncoding: BufferEncoding = 'ascii';

        const input: ActionInput = {
            ...defaultInput,
            variables: {
                TEST_VAR: 'REPLACED'
            }
        };

        const filePath = input.filePaths[0];

        const content = 'Before. ${{ TEST_VAR }}. After.';
        const expectedContent = 'Before. REPLACED. After.';

        readFileMock.mockImplementation(async path => (path === filePath ? content : ''));
        detectEncodingMock.mockImplementation(async (_, encoding) => {
            if (encoding === input.fileEncoding) return defaultEncoding;

            throw new Error('Unexpected file encoding');
        });

        await replaceTokens(input);

        expect(writeFileMock).toHaveBeenCalledWith(filePath, expectedContent, { encoding: defaultEncoding });
    });

    it('when encoding is set to auto and resolved by chardet, then replaces tokens in file using resolved encoding', async () => {
        const input: ActionInput = {
            ...defaultInput,
            variables: {
                TEST_VAR: 'REPLACED'
            }
        };

        const filePath = input.filePaths[0];

        const content = 'Some text before. ${{ TEST_VAR }}. Some text after.';
        const expectedContent = 'Some text before. REPLACED. Some text after.';
        const expectedEncoding: BufferEncoding = 'utf-8';

        readFileMock.mockImplementation(async path => (path === filePath ? content : ''));
        detectEncodingMock.mockImplementation(async (_, encoding) => {
            if (encoding === input.fileEncoding) return expectedEncoding;

            throw new Error('Unexpected file encoding');
        });

        await replaceTokens(input);

        expect(writeFileMock).toHaveBeenCalledWith(filePath, expectedContent, { encoding: expectedEncoding });
    });

    it('when custom token pattern provided, then replaces tokens in file', async () => {
        const input: ActionInput = {
            ...defaultInput,
            fileEncoding: 'utf-16le',
            tokenPrefix: '#',
            tokenSuffix: '&',
            variables: {
                TEST_TOKEN: 'pew'
            }
        };

        const filePath = input.filePaths[0];
        const expectedEncoding = input.fileEncoding as BufferEncoding;

        const content = '# tEsT_tOkEn & #TEST_TOKEN& #  TEST_TOKEN  & #  TEST_TOKEN& #TEST_TOKEN  &';
        const expectedContent = 'pew pew pew pew pew';

        readFileMock.mockImplementation(async path => (path === filePath ? content : ''));
        detectEncodingMock.mockImplementation(async (_, encoding) => {
            if (encoding === input.fileEncoding) return expectedEncoding;

            throw new Error('Unexpected file encoding');
        });

        await replaceTokens(input);

        expect(writeFileMock).toHaveBeenCalledWith(filePath, expectedContent, { encoding: expectedEncoding });
    });

    it('when multiple templates provided, then replaces tokens in all file', async () => {
        const input: ActionInput = {
            ...defaultInput,
            filePaths: ['./test-0.txt', './test-1.txt'],
            fileEncoding: 'ascii',
            variables: {
                NAME: 'Alex',
                AGE: '31',
                TITLE: 'Software Engineer'
            }
        };

        const template0 = 'Employee: ${{ NAME }}. Title: ${{ TITLE }}.';
        const template1 = 'Hi ${{ NAME }}. Your age is: ${{ AGE }}. There are N employees aged ${{ AGE }}.';

        const expectedContent0 = 'Employee: Alex. Title: Software Engineer.';
        const expectedContent1 = 'Hi Alex. Your age is: 31. There are N employees aged 31.';

        readFileMock.mockImplementation(async path => {
            switch (path) {
                case './test-0.txt':
                    return template0;
                case './test-1.txt':
                    return template1;
                default:
                    return '';
            }
        });

        detectEncodingMock.mockImplementation(async (_, encoding) => {
            if (encoding === input.fileEncoding) return input.fileEncoding as BufferEncoding;

            throw new Error('Unexpected file encoding');
        });

        await replaceTokens(input);

        expect(writeFileMock).toHaveBeenCalledWith('./test-0.txt', expectedContent0, { encoding: input.fileEncoding });
        expect(writeFileMock).toHaveBeenCalledWith('./test-1.txt', expectedContent1, { encoding: input.fileEncoding });
    });
});
