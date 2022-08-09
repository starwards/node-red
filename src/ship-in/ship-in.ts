import { Node, NodeDef, NodeInitializer, NodeMessage } from 'node-red';

import { Driver } from '@starwards/core';
import { ShipInOptions } from './shared/types';

export interface ShipInNodeDef extends NodeDef, ShipInOptions {}
export type ShipInNode = Node;

const nodeInit: NodeInitializer = (RED): void => {
    function ShipInNodeConstructor(this: ShipInNode, config: ShipInNodeDef): void {
        RED.nodes.createNode(this, config);
        void (async () => {
            try {
                const driver = new Driver({ protocol: 'http', host: 'host.docker.internal' });
                const shipDriver = await driver.getShipDriver(config.shipId);
                shipDriver.events.on(config.pattern, (e) => {
                    this.send({ topic: e.path, payload: e.op === 'remove' ? undefined : e.value } as NodeMessage);
                });
            } catch (e) {
                if (e instanceof Error) {
                    // eslint-disable-next-line no-console
                    console.error(`error`, e, e?.stack);
                } else {
                    // eslint-disable-next-line no-console
                    console.error(`error`, e);
                }
            }
        })();
    }

    RED.nodes.registerType('ship-in', ShipInNodeConstructor);
};

export default nodeInit;
