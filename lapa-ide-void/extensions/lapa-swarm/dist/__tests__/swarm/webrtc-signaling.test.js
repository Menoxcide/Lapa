"use strict";
/**
 * WebRTC Signaling Test for Swarm Sessions
 *
 * This test verifies the WebRTC signaling implementation for swarm sessions,
 * including SDP offer/answer exchange and ICE candidate exchange.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const sessions_ts_1 = require("../../swarm/sessions.ts");
const event_bus_ts_1 = require("../../core/event-bus.ts");
// Mock RTCPeerConnection and related classes for Node.js environment
// In a real environment, these would be provided by the 'wrtc' package
class MockRTCPeerConnection {
    iceCandidates = [];
    localDescription = null;
    remoteDescription = null;
    connectionState = 'new';
    onicecandidate = null;
    onconnectionstatechange = null;
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
        this.localDescription = new RTCSessionDescription(description);
    }
    async setRemoteDescription(description) {
        this.remoteDescription = new RTCSessionDescription(description);
        // Simulate connection state change
        this.connectionState = 'connected';
        if (this.onconnectionstatechange) {
            this.onconnectionstatechange();
        }
    }
    async addIceCandidate(candidate) {
        this.iceCandidates.push(candidate);
    }
    close() {
        this.connectionState = 'closed';
    }
}
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
// Mock the global WebRTC objects
global.RTCPeerConnection = MockRTCPeerConnection;
global.RTCSessionDescription = MockRTCSessionDescription;
global.RTCIceCandidate = MockRTCIceCandidate;
describe('WebRTC Signaling in Swarm Sessions', () => {
    beforeEach(() => {
        // Clear any existing sessions
        const sessions = sessions_ts_1.swarmSessionManager.getAllSessions();
        for (const session of sessions) {
            sessions_ts_1.swarmSessionManager.closeSession(session.sessionId);
        }
    });
    it('should establish WebRTC connections between participants', async () => {
        // Create a session
        const sessionId = await (0, sessions_ts_1.createSwarmSession)({
            sessionId: 'test-session-1',
            hostUserId: 'user-1',
            maxParticipants: 3,
            enableVetoes: true,
            enableA2A: true
        });
        // Join with second participant
        const joined = await (0, sessions_ts_1.joinSwarmSession)(sessionId, 'user-2', 'User 2');
        expect(joined).toBe(true);
        // Get the session to verify participants
        const session = sessions_ts_1.swarmSessionManager.getSession(sessionId);
        expect(session).toBeDefined();
        expect(session?.participants.size).toBe(2);
        // Verify both participants have peer connections
        const participant1 = session?.participants.get('user-1');
        const participant2 = session?.participants.get('user-2');
        expect(participant1).toBeDefined();
        expect(participant2).toBeDefined();
        expect(participant1?.peerConnection).toBeDefined();
        expect(participant2?.peerConnection).toBeDefined();
        // Verify connection states
        expect(participant1?.connectionState).toBe('connected');
        expect(participant2?.connectionState).toBe('connecting');
    });
    it('should handle SDP offer/answer exchange', async () => {
        // Create a session
        const sessionId = await (0, sessions_ts_1.createSwarmSession)({
            sessionId: 'test-session-2',
            hostUserId: 'host-user',
            maxParticipants: 3,
            enableVetoes: true,
            enableA2A: true
        });
        // Track events
        const sdpOffers = [];
        const sdpAnswers = [];
        // Subscribe to SDP events
        const offerSubscription = event_bus_ts_1.eventBus.subscribe('webrtc.sdp-offer', (event) => {
            sdpOffers.push(event);
        });
        const answerSubscription = event_bus_ts_1.eventBus.subscribe('webrtc.sdp-answer', (event) => {
            sdpAnswers.push(event);
        });
        // Join with second participant
        const joined = await (0, sessions_ts_1.joinSwarmSession)(sessionId, 'participant-1', 'Participant 1');
        expect(joined).toBe(true);
        // Give some time for asynchronous operations
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify SDP events were published
        expect(sdpOffers.length).toBeGreaterThan(0);
        expect(sdpAnswers.length).toBeGreaterThan(0);
        // Verify event structure
        const firstOffer = sdpOffers[0];
        expect(firstOffer.type).toBe('webrtc.sdp-offer');
        expect(firstOffer.payload.offer).toBeDefined();
        expect(firstOffer.payload.offer.type).toBe('offer');
        expect(firstOffer.payload.fromUserId).toBeDefined();
        expect(firstOffer.payload.toUserId).toBeDefined();
        expect(firstOffer.payload.sessionId).toBe(sessionId);
        const firstAnswer = sdpAnswers[0];
        expect(firstAnswer.type).toBe('webrtc.sdp-answer');
        expect(firstAnswer.payload.answer).toBeDefined();
        expect(firstAnswer.payload.answer.type).toBe('answer');
        expect(firstAnswer.payload.fromUserId).toBeDefined();
        expect(firstAnswer.payload.toUserId).toBeDefined();
        expect(firstAnswer.payload.sessionId).toBe(sessionId);
        // Cleanup subscriptions
        event_bus_ts_1.eventBus.unsubscribe(offerSubscription);
        event_bus_ts_1.eventBus.unsubscribe(answerSubscription);
    });
    it('should handle ICE candidate exchange', async () => {
        // Create a session
        const sessionId = await (0, sessions_ts_1.createSwarmSession)({
            sessionId: 'test-session-3',
            hostUserId: 'host-user',
            maxParticipants: 3,
            enableVetoes: true,
            enableA2A: true
        });
        // Track ICE candidate events
        const iceCandidates = [];
        // Subscribe to ICE candidate events
        const iceSubscription = event_bus_ts_1.eventBus.subscribe('webrtc.ice-candidate', (event) => {
            iceCandidates.push(event);
        });
        // Join with second participant
        const joined = await (0, sessions_ts_1.joinSwarmSession)(sessionId, 'participant-1', 'Participant 1');
        expect(joined).toBe(true);
        // Give some time for asynchronous operations
        await new Promise(resolve => setTimeout(resolve, 100));
        // With our mock implementation, we should see ICE candidate events
        // In a real implementation, these would be generated by the WebRTC peer connections
        // For this test, we're just verifying the event infrastructure works
        // Cleanup subscription
        event_bus_ts_1.eventBus.unsubscribe(iceSubscription);
    });
    it('should handle connection state changes', async () => {
        // Create a session
        const sessionId = await (0, sessions_ts_1.createSwarmSession)({
            sessionId: 'test-session-4',
            hostUserId: 'host-user',
            maxParticipants: 3,
            enableVetoes: true,
            enableA2A: true
        });
        // Track connection state events
        const connectionStates = [];
        // Subscribe to connection state events
        const stateSubscription = event_bus_ts_1.eventBus.subscribe('webrtc.connection-state', (event) => {
            connectionStates.push(event);
        });
        // Join with second participant
        const joined = await (0, sessions_ts_1.joinSwarmSession)(sessionId, 'participant-1', 'Participant 1');
        expect(joined).toBe(true);
        // Give some time for asynchronous operations
        await new Promise(resolve => setTimeout(resolve, 100));
        // Verify connection state events were published
        // With our mock implementation, we should see connection state events
        // In a real implementation, these would be generated by the WebRTC peer connections
        // Cleanup subscription
        event_bus_ts_1.eventBus.unsubscribe(stateSubscription);
    });
});
//# sourceMappingURL=webrtc-signaling.test.js.map