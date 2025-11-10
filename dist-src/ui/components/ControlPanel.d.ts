import React from 'react';
interface ControlPanelProps {
    isRunning: boolean;
    onPause?: () => void;
    onResume?: () => void;
    onRedirect?: () => void;
    onReset?: () => void;
}
declare const ControlPanel: React.FC<ControlPanelProps>;
export default ControlPanel;
