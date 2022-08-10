import { Node, NodeDef, NodeInitializer, NodeMessage } from 'node-red';

import { StarwardsConfigNode } from '../starwards-config/starwards-config';

export interface ShipInOptions {
    configNode: string;
    shipId: string;
    pattern: string;
}
export interface ShipInNode extends Node {
    configNode: StarwardsConfigNode;
}

const nodeInit: NodeInitializer = (RED): void => {
    function ShipInNodeConstructor(this: ShipInNode, config: NodeDef & ShipInOptions): void {
        RED.nodes.createNode(this, config);
        const configNode = RED.nodes.getNode(config.configNode) as StarwardsConfigNode | undefined;
        if (configNode) {
            this.configNode = configNode;
            void (async () => {
                try {
                    const shipDriver = await this.configNode.driver.getShipDriver(config.shipId);
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
        } else {
            // eslint-disable-next-line no-console
            console.error(`No config node configured`);
        }
    }

    RED.nodes.registerType('ship-in', ShipInNodeConstructor);
};

export default nodeInit;
