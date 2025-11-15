/**
 * Swarm Control Toolbar Component
 * 
 * Provides UI controls for LAPA Swarm operations (start, stop, pause, resume, status, configure).
 * Can be integrated into chat interfaces or as a standalone toolbar.
 */

import React from 'react';
import { Play, Square, Pause, PlayCircle, Settings, Activity } from 'lucide-react';

interface SwarmControlToolbarProps {
	onStart?: () => void;
	onStop?: () => void;
	onPause?: () => void;
	onResume?: () => void;
	onStatus?: () => void;
	onConfigure?: () => void;
	disabled?: boolean;
	isRunning?: boolean;
	isPaused?: boolean;
	className?: string;
	size?: 'sm' | 'md' | 'lg';
}

export const SwarmControlToolbar: React.FC<SwarmControlToolbarProps> = ({
	onStart,
	onStop,
	onPause,
	onResume,
	onStatus,
	onConfigure,
	disabled = false,
	isRunning = false,
	isPaused = false,
	className = '',
	size = 'sm'
}) => {
	const sizeClasses = {
		sm: 'h-7 px-2 text-xs',
		md: 'h-8 px-3 text-sm',
		lg: 'h-10 px-4 text-base'
	};

	const iconSizes = {
		sm: 14,
		md: 16,
		lg: 18
	};

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			{!isRunning && !isPaused && onStart && (
				<button
					onClick={onStart}
					disabled={disabled}
					className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
					title="Start Swarm"
				>
					<Play size={iconSizes[size]} />
					<span>Start</span>
				</button>
			)}

			{isRunning && !isPaused && (
				<>
					{onPause && (
						<button
							onClick={onPause}
							disabled={disabled}
							className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-yellow-600 hover:bg-yellow-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
							title="Pause Swarm"
						>
							<Pause size={iconSizes[size]} />
							<span>Pause</span>
						</button>
					)}
					{onStop && (
						<button
							onClick={onStop}
							disabled={disabled}
							className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
							title="Stop Swarm"
						>
							<Square size={iconSizes[size]} />
							<span>Stop</span>
						</button>
					)}
				</>
			)}

			{isPaused && (
				<>
					{onResume && (
						<button
							onClick={onResume}
							disabled={disabled}
							className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
							title="Resume Swarm"
						>
							<PlayCircle size={iconSizes[size]} />
							<span>Resume</span>
						</button>
					)}
					{onStop && (
						<button
							onClick={onStop}
							disabled={disabled}
							className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
							title="Stop Swarm"
						>
							<Square size={iconSizes[size]} />
							<span>Stop</span>
						</button>
					)}
				</>
			)}

			{onStatus && (
				<button
					onClick={onStatus}
					disabled={disabled}
					className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
					title="Swarm Status"
				>
					<Activity size={iconSizes[size]} />
					<span>Status</span>
				</button>
			)}

			{onConfigure && (
				<button
					onClick={onConfigure}
					disabled={disabled}
					className={`flex items-center gap-1 ${sizeClasses[size]} rounded bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
					title="Configure Swarm"
				>
					<Settings size={iconSizes[size]} />
					<span>Configure</span>
				</button>
			)}
		</div>
	);
};

export default SwarmControlToolbar;

