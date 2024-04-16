export interface ActionInput {
    filePaths: string[];
    fileEncoding: FileEncoding;
    tokenPrefix: string;
    tokenSuffix: string;
    variables: Record<string, string>;
}

export type FileEncoding = 'auto' | Extract<BufferEncoding, 'ascii' | 'utf-8' | 'utf-16le'>;
