import testHelper, { TestFlowsItem } from 'node-red-node-test-helper';
import transformTextNode, { TransformTextNodeDef } from './transform-text';

import { TransformTextOperation } from './shared/types';

type FlowsItem = TestFlowsItem<TransformTextNodeDef>;
type Flows = Array<FlowsItem>;

describe('transform-text node', () => {
    beforeEach((done) => {
        testHelper.startServer(done);
    });

    afterEach(async () => {
        await testHelper.unload();
        await new Promise<void>((res) => testHelper.stopServer(res));
    });

    it('should be loaded', async () => {
        const flows: Flows = [{ id: 'n1', type: 'transform-text', name: 'transform-text' }];
        await testHelper.load(transformTextNode, flows);
        const n1 = testHelper.getNode('n1');
        expect(n1).toBeTruthy();
        expect(n1.name).toEqual('transform-text');
    });

    describe('in upper-case mode', () => {
        let flows: Flows = [];
        beforeEach(() => {
            flows = [
                {
                    id: 'n1',
                    type: 'transform-text',
                    name: 'transform-text',
                    operation: TransformTextOperation.UpperCase,
                    wires: [['n2']],
                },
                { id: 'n2', type: 'helper' },
            ];
        });
        it("should make payload upper case, if it's a string", async () => {
            await testHelper.load(transformTextNode, flows);
            const n2 = testHelper.getNode('n2');
            const n1 = testHelper.getNode('n1');
            const msgPromise = new Promise((res) => n2.on('input', res));
            n1.receive({ payload: 'UpperCase' });
            const msg = await msgPromise;
            expect(msg).toBeTruthy();
            expect(msg).toMatchObject({ payload: 'UPPERCASE' });
        });

        it('should just pass a message, if payload is not a string', async () => {
            await testHelper.load(transformTextNode, flows);
            const n2 = testHelper.getNode('n2');
            const n1 = testHelper.getNode('n1');
            const msgPromise = new Promise((res) => n2.on('input', res));
            n1.receive({ payload: { str: 'UpperCase' } });
            const msg = await msgPromise;
            expect(msg).toBeTruthy();
            expect(msg).toMatchObject({ payload: { str: 'UpperCase' } });
        });
    });
    describe('in lower-case mode', () => {
        let flows: Flows = [];
        beforeEach(() => {
            flows = [
                {
                    id: 'n1',
                    type: 'transform-text',
                    name: 'transform-text',
                    operation: TransformTextOperation.LowerCase,
                    wires: [['n2']],
                },
                { id: 'n2', type: 'helper' },
            ];
        });
        it("should make payload lower case, if it's a string", async () => {
            await testHelper.load(transformTextNode, flows);
            const n2 = testHelper.getNode('n2');
            const n1 = testHelper.getNode('n1');
            const msgPromise = new Promise((res) => n2.on('input', res));
            n1.receive({ payload: 'LowerCase' });
            const msg = await msgPromise;
            expect(msg).toBeTruthy();
            expect(msg).toMatchObject({ payload: 'lowercase' });
        });

        it('should just pass a message, if payload is not a string', async () => {
            await testHelper.load(transformTextNode, flows);
            const n2 = testHelper.getNode('n2');
            const n1 = testHelper.getNode('n1');
            const msgPromise = new Promise((res) => n2.on('input', res));
            n1.receive({ payload: { str: 'LowerCase' } });
            const msg = await msgPromise;
            expect(msg).toBeTruthy();
            expect(msg).toMatchObject({ payload: { str: 'LowerCase' } });
        });
    });
});
