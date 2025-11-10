import React from 'react';
import { Agent } from '../state';
interface AgentAvatarsProps {
    agents: Agent[];
    onAgentClick?: (agentId: string) => void;
}
declare const AgentAvatars: React.FC<AgentAvatarsProps>;
export default AgentAvatars;
