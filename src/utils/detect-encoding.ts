import { detectFile } from 'chardet';

import type { FileEncoding } from './common/types';

const defaultEncoding: BufferEncoding = 'ascii';

const detectEncoding = async (filePath: string, fileEncoding: FileEncoding): Promise<BufferEncoding> => {
    if (fileEncoding !== 'auto') return fileEncoding;

    switch (await detectFile(filePath)) {
        case 'UTF-8':
            return 'utf-8';
        case 'UTF-16 LE':
            return 'utf-16le';
        default:
            return defaultEncoding;
    }
};

export { detectEncoding };
