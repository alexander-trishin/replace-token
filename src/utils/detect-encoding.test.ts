import * as chardet from 'chardet';

import { detectEncoding } from './detect-encoding';

import type { FileEncoding } from './common/types';

const detectFileMock = jest.spyOn(chardet, 'detectFile');

describe('detect-encoding', () => {
    it.each(['ascii', 'utf-8', 'utf-16le'] as FileEncoding[])(
        'when file encoding is not auto (%s), then returns that encoding',
        async expected => expect(await detectEncoding('./test.txt', expected)).toBe(expected)
    );

    it.each([
        ['UTF-8', 'utf-8'],
        ['UTF-16 LE', 'utf-16le'],
        ['ASCII', 'ascii'],
        ['ISO-8859-1', 'ascii']
    ] as [string, BufferEncoding][])(
        'when file encoding is auto (%s), then returns detected encoding (%s)',
        async (detected, expected) => {
            const filePath = './test.txt';

            detectFileMock.mockImplementation(async path => (path === filePath ? detected : null));

            const actual = await detectEncoding('./test.txt', 'auto');

            expect(actual).toBe(expected);
        }
    );
});
