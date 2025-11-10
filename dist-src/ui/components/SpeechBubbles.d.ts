import React from 'react';
import { Message } from '../state';
interface SpeechBubblesProps {
    messages: Message[];
    onMessageClick?: (messageId: string) => void;
}
declare const SpeechBubbles: React.FC<SpeechBubblesProps>;
export default SpeechBubbles;
