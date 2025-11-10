import React, { ReactNode } from 'react';
export interface Agent {
    id: string;
    name: string;
    role: string;
    status: 'idle' | 'working' | 'paused' | 'completed';
    avatarColor: string;
}
export interface Message {
    id: string;
    agentId: string;
    agentName: string;
    content: string;
    timestamp: Date;
    type: 'thought' | 'action' | 'result';
}
export interface GraphNode {
    id: string;
    label: string;
    x: number;
    y: number;
    color: string;
}
export interface GraphEdge {
    source: string;
    target: string;
}
export interface DashboardState {
    isRunning: boolean;
    agents: Agent[];
    messages: Message[];
    nodes: GraphNode[];
    edges: GraphEdge[];
    metrics: {
        tasksCompleted: number;
        successRate: number;
        activeAgents: number;
        avgResponseTime: number;
    };
}
export type DashboardAction = {
    type: 'SET_RUNNING';
    payload: boolean;
} | {
    type: 'ADD_AGENT';
    payload: Agent;
} | {
    type: 'UPDATE_AGENT_STATUS';
    payload: {
        id: string;
        status: Agent['status'];
    };
} | {
    type: 'ADD_MESSAGE';
    payload: Message;
} | {
    type: 'ADD_NODE';
    payload: GraphNode;
} | {
    type: 'ADD_EDGE';
    payload: GraphEdge;
} | {
    type: 'UPDATE_METRICS';
    payload: Partial<DashboardState['metrics']>;
} | {
    type: 'RESET_DASHBOARD';
};
export declare const dashboardReducer: (state: DashboardState, action: DashboardAction) => DashboardState;
interface DashboardProviderProps {
    children: ReactNode;
}
export declare const DashboardProvider: React.FC<DashboardProviderProps>;
export declare const useDashboard: () => any;
export {};
