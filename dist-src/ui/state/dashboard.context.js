import React, { createContext, useContext, useReducer } from 'react';
// Initial state
const initialState = {
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
export const dashboardReducer = (state, action) => {
    switch (action.type) {
        case 'SET_RUNNING':
            return { ...state, isRunning: action.payload };
        case 'ADD_AGENT':
            return { ...state, agents: [...state.agents, action.payload] };
        case 'UPDATE_AGENT_STATUS':
            return {
                ...state,
                agents: state.agents.map(agent => agent.id === action.payload.id
                    ? { ...agent, status: action.payload.status }
                    : agent),
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
const DashboardContext = createContext(undefined);
export const DashboardProvider = ({ children }) => {
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
    return (<DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>);
};
// Hook
export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
//# sourceMappingURL=dashboard.context.js.map