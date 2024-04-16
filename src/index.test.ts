import * as main from './main';

const runMock = jest.spyOn(main, 'run').mockImplementation();

describe('index', () => {
    it('when imported, then calls run function', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../src/index');

        expect(runMock).toHaveBeenCalled();
    });
});
