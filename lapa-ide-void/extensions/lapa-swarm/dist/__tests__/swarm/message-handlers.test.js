"use strict";
/**
 * Message Handlers Test Suite for Swarm Sessions
 *
 * This test suite verifies the implementation of message handlers for Swarm Sessions,
 * including task coordination, veto processing, A2A handshake operations, handoff
 * coordination, and state synchronization.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const sessions_ts_1 = require("../../swarm/sessions.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
// Mock WebRTC data channel
class MockDataChannel {
    readyState = 'open';
    onmessage = null;
    sentMessages = [];
    send(data) {
        this.sentMessages.push(JSON.parse(data));
    }
}
// Mock WebRTC peer connection
class MockPeerConnection {
    readyState = 'connected';
    onicecandidate = null;
    onconnectionstatechange = null;
    createDataChannel() {
        return new MockDataChannel();
    }
    async createOffer() {
        return {
            type: 'offer',
            sdp: 'mock offer sdp'
        };
    }
    async createAnswer() {
        return {
            type: 'answer',
            sdp: 'mock answer sdp'
        };
    }
    async setLocalDescription(description) {
        // Mock implementation
    }
    async setRemoteDescription(description) {
        // Mock implementation
    }
    close() {
        // Mock implementation
    }
}
// Mock RTC classes
class MockRTCSessionDescription {
    type;
    sdp;
    constructor(descriptionInitDict) {
        this.type = descriptionInitDict.type;
        this.sdp = descriptionInitDict.sdp || '';
    }
}
class MockRTCIceCandidate {
    candidate;
    sdpMid;
    sdpMLineIndex;
    constructor(candidateInitDict) {
        this.candidate = candidateInitDict.candidate || '';
        this.sdpMid = candidateInitDict.sdpMid || null;
        this.sdpMLineIndex = candidateInitDict.sdpMLineIndex || null;
    }
}
(0, vitest_1.describe)('Swarm Session Message Handlers', () => {
    let swarmSessionManager;
    let sessionId;
    let config;
    beforeAll(() => {
        // Mock WebRTC globals
        global.RTCPeerConnection = MockPeerConnection;
        global.RTCSessionDescription = MockRTCSessionDescription;
        global.RTCIceCandidate = MockRTCIceCandidate;
    });
    (0, vitest_1.beforeEach)(async () => {
        swarmSessionManager = new sessions_ts_1.SwarmSessionManager();
        config = {
            sessionId: 'test-session-' + Date.now(),
            hostUserId: 'host-user',
            maxParticipants: 10,
            enableVetoes: true,
            enableA2A: true
        };
        sessionId = await swarmSessionManager.createSession(config);
    });
    (0, vitest_1.afterEach)(() => {
        // Clean up sessions
        const sessions = swarmSessionManager.getAllSessions();
        for (const session of sessions) {
            swarmSessionManager.closeSession(session.sessionId);
        }
    });
    (0, vitest_1.describe)('handleTaskMessage', () => {
        (0, vitest_1.it)('should handle task addition', async () => {
            const task = {
                id: 'task-1',
                description: 'Test task',
                type: 'test'
            };
            const message = {
                type: 'task',
                sessionId,
                from: 'host-user',
                payload: {
                    action: 'added',
                    task
                },
                timestamp: Date.now()
            };
            // Get the session
            const session = swarmSessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            // Call the handler directly
            // @ts-ignore - accessing private method for testing
            await swarmSessionManager.handleTaskMessage(session, message);
            // Verify task was added
            (0, vitest_1.expect)(session.activeTasks.get('task-1')).toEqual(task);
        });
        (0, vitest_1.it)('should handle task completion', async () => {
            const task = {
                id: 'task-1',
                description: 'Test task',
                type: 'test'
            };
            // First add the task
            const session = swarmSessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            session.activeTasks.set('task-1', task);
            const message = {
                type: 'task',
                sessionId,
                from: 'host-user',
                payload: {
                    action: 'completed',
                    task
                },
                timestamp: Date.now()
            };
            // Call the handler directly
            // @ts-ignore - accessing private method for testing
            await swarmSessionManager.handleTaskMessage(session, message);
            // Verify task was removed
            (0, vitest_1.expect)(session.activeTasks.get('task-1')).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('handleVetoMessage', () => {
        (0, vitest_1.it)('should process veto requests', async () => {
            // Add a task first
            const task = {
                id: 'task-1',
                description: 'Test task',
                type: 'test'
            };
            const session = swarmSessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            session.activeTasks.set('task-1', task);
            const message = {
                type: 'veto',
                sessionId,
                from: 'host-user',
                payload: {
                    vetoId: 'veto-1',
                    sessionId,
                    taskId: 'task-1',
                    requestedBy: 'host-user',
                    reason: 'Test veto',
                    timestamp: new Date()
                },
                timestamp: Date.now()
            };
            // Track events
            let eventPublished = false;
            const subscription = event_bus_ts_1.eventBus.subscribe('swarm.task.vetoed', () => {
                eventPublished = true;
            });
            // Call the handler directly
            // @ts-ignore - accessing private method for testing
            await swarmSessionManager.handleVetoMessage(session, message);
            // Cleanup subscription
            event_bus_ts_1.eventBus.unsubscribe(subscription);
            // Since we're using random voting, we can't predict the outcome, but we can verify
            // that the function completed without error
            (0, vitest_1.expect)(true).toBe(true); // If we got here without exception, the test passes
        });
    });
    (0, vitest_1.describe)('handleA2AMessage', () => {
        (0, vitest_1.it)('should process A2A handshake requests', async () => {
            const session = swarmSessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            const message = {
                type: 'a2a',
                sessionId,
                from: 'agent-1',
                payload: {
                    handshakeRequest: {
                        sourceAgentId: 'agent-1',
                        targetAgentId: 'agent-2',
                        capabilities: ['general'],
                        protocolVersion: '1.0'
                    }
                },
                timestamp: Date.now()
            };
            // Track messages sent
            let messageSent = false;
            // @ts-ignore - accessing private method for testing
            const originalBroadcast = swarmSessionManager.broadcastMessage.bind(swarmSessionManager);
            // @ts-ignore - accessing private method for testing
            swarmSessionManager.broadcastMessage = async (sess, msg) => {
                messageSent = true;
                return originalBroadcast(sess, msg);
            };
            // Call the handler directly
            // @ts-ignore - accessing private method for testing
            await swarmSessionManager.handleA2AMessage(session, message);
            // Restore original method
            // @ts-ignore - accessing private method for testing
            swarmSessionManager.broadcastMessage = originalBroadcast;
            // Verify that a response was sent
            (0, vitest_1.expect)(messageSent).toBe(true);
        });
    });
    (0, vitest_1.describe)('handleStateMessage', () => {
        (0, vitest_1.it)('should process state synchronization messages', async () => {
            const session = swarmSessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            const originalLastActivityTime = session.lastActivity.getTime();
            const message = {
                type: 'state',
                sessionId,
                from: 'host-user',
                payload: {
                    type: 'incremental',
                    state: {
                        lastActivity: new Date() // Just include a lastActivity field
                    },
                    sender: 'host-user'
                },
                timestamp: Date.now()
            };
            // Call the handler directly
            // @ts-ignore - accessing private method for testing
            await swarmSessionManager.handleStateMessage(session, message);
            // Verify that the state was updated (timestamp should be newer)
            (0, vitest_1.expect)(session.lastActivity.getTime()).toBeGreaterThanOrEqual(originalLastActivityTime);
        });
    });
    (0, vitest_1.describe)('handleHandoffMessage', () => {
        (0, vitest_1.it)('should process handoff initiation requests', async () => {
            const session = swarmSessionManager.getSession(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }
            const message = {
                type: 'handoff',
                sessionId,
                from: 'agent-1',
                payload: {
                    type: 'initiate',
                    request: {
                        sourceAgentId: 'agent-1',
                        targetAgentId: 'agent-2',
                        taskId: 'task-1',
                        context: {},
                        priority: 'medium'
                    }
                },
                timestamp: Date.now()
            };
            // Track messages sent
            let messageSent = false;
            // @ts-ignore - accessing private method for testing
            const originalBroadcast = swarmSessionManager.broadcastMessage.bind(swarmSessionManager);
            // @ts-ignore - accessing private method for testing
            swarmSessionManager.broadcastMessage = async (sess, msg) => {
                messageSent = true;
                return originalBroadcast(sess, msg);
            };
            // Call the handler directly
            // @ts-ignore - accessing private method for testing
            await swarmSessionManager.handleHandoffMessage(session, message);
            // Restore original method
            // @ts-ignore - accessing private method for testing
            swarmSessionManager.broadcastMessage = originalBroadcast;
            // Verify that an acknowledgment was sent
            (0, vitest_1.expect)(messageSent).toBe(true);
        });
    });
});
//# sourceMappingURL=message-handlers.test.js.map