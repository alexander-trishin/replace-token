import * as core from '@actions/core';
import * as main from './main';

const runMock = jest.spyOn(main, 'run');

let debugMock: jest.SpiedFunction<typeof core.debug>;
let errorMock: jest.SpiedFunction<typeof core.error>;
let getInputMock: jest.SpiedFunction<typeof core.getInput>;
let setFailedMock: jest.SpiedFunction<typeof core.setFailed>;

describe('action', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        debugMock = jest.spyOn(core, 'debug').mockImplementation();
        errorMock = jest.spyOn(core, 'error').mockImplementation();
        getInputMock = jest.spyOn(core, 'getInput').mockImplementation();
        setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation();
    });

    it('writes a debug message', async () => {
        getInputMock.mockImplementation(name => {
            switch (name) {
                case 'message':
                    return 'bingo!';
                default:
                    return '';
            }
        });

        await main.run();
        expect(runMock).toHaveReturned();

        expect(debugMock).toHaveBeenNthCalledWith(1, 'bingo!');

        expect(errorMock).not.toHaveBeenCalled();
        expect(setFailedMock).not.toHaveBeenCalled();
    });

    it('sets a failed status', async () => {
        getInputMock.mockImplementation(() => {
            throw new Error('oops...');
        });

        await main.run();
        expect(runMock).toHaveReturned();

        expect(errorMock).not.toHaveBeenCalled();
        expect(setFailedMock).toHaveBeenNthCalledWith(1, 'oops...');
    });
});
