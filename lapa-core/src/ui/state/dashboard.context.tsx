import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Types
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

// State
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

// Actions
export type DashboardAction =
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'ADD_AGENT'; payload: Agent }
  | { type: 'UPDATE_AGENT_STATUS'; payload: { id: string; status: Agent['status'] } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'ADD_NODE'; payload: GraphNode }
  | { type: 'ADD_EDGE'; payload: GraphEdge }
  | { type: 'UPDATE_METRICS'; payload: Partial<DashboardState['metrics']> }
  | { type: 'RESET_DASHBOARD' };

// Initial state
const initialState: DashboardState = {
  isRunning: true,
  agents: [],
  messages: [],
  nodes: [],
  edges: [],
  metrics: {
    tasksCompleted: 0,
    successRate: 0,
    activeAgents: 0,
    avgResponseTime: 0,
  },
};

// Reducer
export const dashboardReducer = (
  state: DashboardState,
  action: DashboardAction
): DashboardState => {
  switch (action.type) {
    case 'SET_RUNNING':
      return { ...state, isRunning: action.payload };
    
    case 'ADD_AGENT':
      return { ...state, agents: [...state.agents, action.payload] };
    
    case 'UPDATE_AGENT_STATUS':
      return {
        ...state,
        agents: state.agents.map(agent =>
          agent.id === action.payload.id
            ? { ...agent, status: action.payload.status }
            : agent
        ),
      };
    
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    
    case 'ADD_NODE':
      return { ...state, nodes: [...state.nodes, action.payload] };
    
    case 'ADD_EDGE':
      return { ...state, edges: [...state.edges, action.payload] };
    
    case 'UPDATE_METRICS':
      return { ...state, metrics: { ...state.metrics, ...action.payload } };
    
    case 'RESET_DASHBOARD':
      return initialState;
    
    default:
      return state;
  }
};

// Context
interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  pauseSwarm: () => void;
  resumeSwarm: () => void;
  redirectTask: () => void;
  resetSwarm: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Action handlers
  const pauseSwarm = () => {
    dispatch({ type: 'SET_RUNNING', payload: false });
    // In a real implementation, this would call the backend
    console.log('Pausing swarm...');
  };

  const resumeSwarm = () => {
    dispatch({ type: 'SET_RUNNING', payload: true });
    // In a real implementation, this would call the backend
    console.log('Resuming swarm...');
  };

  const redirectTask = () => {
    // In a real implementation, this would open a dialog and call the backend
    console.log('Redirecting task...');
  };

  const resetSwarm = () => {
    dispatch({ type: 'RESET_DASHBOARD' });
    // In a real implementation, this would call the backend
    console.log('Resetting swarm...');
  };

  const value = {
    state,
    dispatch,
    pauseSwarm,
    resumeSwarm,
    redirectTask,
    resetSwarm,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Hook
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};