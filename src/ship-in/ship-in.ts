import { Node, NodeDef, NodeInitializer, NodeMessage } from 'node-red';

import { Destructors } from '@starwards/core';
import { Event } from 'colyseus-events';
import { StarwardsConfigNode } from '../starwards-config/starwards-config';

export interface ShipInOptions {
    configNode: string;
    shipId: string;
    pattern: string;
}
export interface ShipInNode extends Node {
    configNode: StarwardsConfigNode;
    destructors: Destructors;
}

async function nodeLogic(node: ShipInNode, { pattern, shipId }: ShipInOptions) {
    try {
        const shipDriver = await node.configNode.driver.getShipDriver(shipId);
        node.status({});

        const handleStateEvent = (e: Event) => {
            node.send({ topic: e.path, payload: e.op === 'remove' ? undefined : e.value } as NodeMessage);
        };
        node.destructors.add(() => shipDriver.events.off(pattern, handleStateEvent));
        shipDriver.events.on(pattern, handleStateEvent);
    } catch (e) {
        if (e instanceof Error) {
            node.status({ fill: 'red', shape: 'dot', text: 'err:' + e.message });
        } else {
            node.status({ fill: 'red', shape: 'dot', text: JSON.stringify(e) });
        }
    }
}

const nodeInit: NodeInitializer = (RED): void => {
    function ShipInNodeConstructor(this: ShipInNode, config: NodeDef & ShipInOptions): void {
        RED.nodes.createNode(this, config);
        this.destructors = new Destructors();
        this.on('close', () => this.destructors.destroy());
        const configNode = RED.nodes.getNode(config.configNode) as StarwardsConfigNode | undefined;
        if (configNode) {
            this.configNode = configNode;
            void nodeLogic(this, config);
        } else {
            this.status({ fill: 'red', shape: 'ring', text: 'Server config missing or inactive' });
        }
    }

    RED.nodes.registerType('ship-in', ShipInNodeConstructor);
};

export default nodeInit;
