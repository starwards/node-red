import { Destructors, ShipDriver } from '@starwards/core';
import { Node, NodeDef, NodeInitializer, NodeMessage } from 'node-red';

import { ErrorCode } from 'colyseus.js';
import { Event } from 'colyseus-events';
import { StarwardsConfigNode } from '../starwards-config/starwards-config';
import { TaskLoop } from '../shared/task-loop';
import { isCoded } from '../shared/errors';

export interface ShipInOptions {
    configNode: string;
    shipId: string;
    pattern: string;
}
export interface ShipInNode extends Node {
    configNode: StarwardsConfigNode;
    destructors: Destructors;
    listeningOnEvents: boolean;
    disconnected: boolean;
    lastGameError: unknown;
}

function handleError(node: ShipInNode) {
    const e = node.lastGameError;
    if (isCoded(e)) {
        if (e.code in ErrorCode) {
            node.status({ fill: 'red', shape: 'ring', text: ErrorCode[e.code] });
        } else {
            node.status({ fill: 'red', shape: 'ring', text: `code ${e.code}` });
        }
    } else if (e instanceof Error) {
        node.status({ fill: 'red', shape: 'ring', text: 'err:' + e.message });
    } else {
        node.status({ fill: 'red', shape: 'ring', text: JSON.stringify(e) });
    }
}

function nodeLogic(node: ShipInNode, { pattern, shipId }: ShipInOptions) {
    try {
        node.status({});
        const handleStateEvent = (e: Event) => {
            node.send({ topic: e.path, payload: e.op === 'remove' ? undefined : e.value } as NodeMessage);
        };
        const statusLoop = new TaskLoop(async () => {
            const activeGame = await node.configNode.driver.isActiveGame();
            if (!activeGame) {
                node.status({ fill: 'red', shape: 'dot', text: 'no active game' });
                node.disconnected = true;
                return;
            }
            const shipFound = await (async () => {
                for (const id of await node.configNode.driver.getCurrentShipIds()) {
                    if (shipId === id) return true;
                }
                return false;
            })();
            if (!shipFound) {
                node.status({ fill: 'red', shape: 'ring', text: 'no ship found' });
                node.disconnected = true;
                return;
            }
            if (node.listeningOnEvents) {
                if (node.disconnected) {
                    node.status({ fill: 'red', shape: 'dot', text: 'no reconnect: need to re-deploy flow' });
                }
                return;
            }
            const shipDriver = await node.configNode.driver.getShipDriver(shipId).catch((e: unknown) => {
                node.lastGameError = e;
            });
            if (!shipDriver) {
                handleError(node);
                return;
            }
            node.destructors.add(() => shipDriver.events.off(pattern, handleStateEvent));
            shipDriver.events.on(pattern, handleStateEvent);
            node.listeningOnEvents = true;
            node.disconnected = false;
            node.status({ fill: 'green', shape: 'dot', text: 'connected' });
        }, 1000);

        statusLoop.start();
        node.destructors.add(statusLoop.stop);
    } catch (e) {
        node.lastGameError = e;
        handleError(node);
    }
}

const nodeInit: NodeInitializer = (RED): void => {
    function ShipInNodeConstructor(this: ShipInNode, config: NodeDef & ShipInOptions): void {
        RED.nodes.createNode(this, config);
        this.disconnected = true;
        this.listeningOnEvents = false;
        this.destructors = new Destructors();
        this.on('close', () => this.destructors.destroy());
        const configNode = RED.nodes.getNode(config.configNode) as StarwardsConfigNode | undefined;
        if (configNode) {
            this.configNode = configNode;
            nodeLogic(this, config);
        } else {
            this.status({ fill: 'red', shape: 'ring', text: 'Server config missing or inactive' });
        }
    }

    RED.nodes.registerType('ship-in', ShipInNodeConstructor);
};

export default nodeInit;
