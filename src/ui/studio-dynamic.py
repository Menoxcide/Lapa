"""
Dynamic Studio UI for LAPA v1.2 Protocol-Resonant Nexus — Phase 13

This module implements a dynamic Studio UI using Streamlit and AutoGen Studio
for real-time agent-to-UI communication and generative component rendering.

Based on AutoGen Studio and MCP-UI specifications.
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import streamlit as st
import websockets
from websockets.server import WebSocketServerProtocol
import aiohttp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Studio configuration
STUDIO_CONFIG = {
    "host": "localhost",
    "port": 8080,
    "websocket_port": 8081,
    "enable_mcp": True,
    "enable_openjson_ui": True,
    "enable_realtime": True,
}

class DynamicStudio:
    """
    Dynamic Studio UI manager for LAPA agents.
    
    Handles real-time UI updates, MCP-UI component rendering,
    and AutoGen Studio integration.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = {**STUDIO_CONFIG, **(config or {})}
        self.components: Dict[str, Dict[str, Any]] = {}
        self.event_stream: List[Dict[str, Any]] = []
        self.websocket_clients: List[WebSocketServerProtocol] = []
        self.is_running = False
        
    async def start(self):
        """Start the Studio server."""
        if self.is_running:
            logger.warning("Studio is already running")
            return
        
        self.is_running = True
        logger.info(f"Starting Dynamic Studio on {self.config['host']}:{self.config['port']}")
        
        # Start WebSocket server
        await asyncio.create_task(
            websockets.serve(
                self.handle_websocket,
                self.config["host"],
                self.config["websocket_port"]
            )
        )
        
        logger.info("Dynamic Studio started")
    
    async def stop(self):
        """Stop the Studio server."""
        if not self.is_running:
            return
        
        self.is_running = False
        
        # Close all WebSocket connections
        for client in self.websocket_clients:
            await client.close()
        
        self.websocket_clients.clear()
        logger.info("Dynamic Studio stopped")
    
    async def handle_websocket(self, websocket: WebSocketServerProtocol, path: str):
        """Handle WebSocket connections."""
        self.websocket_clients.append(websocket)
        logger.info(f"New WebSocket connection: {websocket.remote_address}")
        
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"WebSocket connection closed: {websocket.remote_address}")
        finally:
            self.websocket_clients.remove(websocket)
    
    async def handle_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(message)
            message_type = data.get("type")
            
            if message_type == "ui.studio.update":
                await self.handle_ui_update(data.get("component"))
            elif message_type == "ui.mcp.tool.call":
                await self.handle_mcp_tool_call(data.get("tool"), data.get("args"))
            elif message_type == "ui.component.create":
                await self.handle_component_create(data.get("component"))
            elif message_type == "ui.component.update":
                await self.handle_component_update(data.get("componentId"), data.get("props"))
            elif message_type == "ui.component.delete":
                await self.handle_component_delete(data.get("componentId"))
            else:
                logger.warning(f"Unknown message type: {message_type}")
        
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing message: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def handle_ui_update(self, component: Dict[str, Any]):
        """Handle UI component update."""
        component_id = component.get("id")
        if component_id:
            self.components[component_id] = component
            await self.broadcast_message({
                "type": "ui.studio.update",
                "component": component,
                "timestamp": datetime.now().isoformat(),
            })
            logger.info(f"Updated UI component: {component_id}")
    
    async def handle_mcp_tool_call(self, tool: str, args: Dict[str, Any]):
        """Handle MCP tool call."""
        logger.info(f"MCP tool call: {tool} with args: {args}")
        
        # TODO: Implement actual MCP tool call
        # This would typically involve calling the MCP connector
        # and receiving a response with UI components
        
        response = {
            "success": True,
            "tool": tool,
            "data": {},
            "components": [],
        }
        
        await self.broadcast_message({
            "type": "ui.mcp.tool.response",
            "response": response,
            "timestamp": datetime.now().isoformat(),
        })
    
    async def handle_component_create(self, component: Dict[str, Any]):
        """Handle component creation."""
        component_id = component.get("id") or component.get("componentId")
        if component_id:
            self.components[component_id] = component
            await self.broadcast_message({
                "type": "ui.component.create",
                "component": component,
                "timestamp": datetime.now().isoformat(),
            })
            logger.info(f"Created component: {component_id}")
    
    async def handle_component_update(self, component_id: str, props: Dict[str, Any]):
        """Handle component update."""
        if component_id in self.components:
            self.components[component_id].update(props)
            await self.broadcast_message({
                "type": "ui.component.update",
                "componentId": component_id,
                "props": props,
                "timestamp": datetime.now().isoformat(),
            })
            logger.info(f"Updated component: {component_id}")
    
    async def handle_component_delete(self, component_id: str):
        """Handle component deletion."""
        if component_id in self.components:
            del self.components[component_id]
            await self.broadcast_message({
                "type": "ui.component.delete",
                "componentId": component_id,
                "timestamp": datetime.now().isoformat(),
            })
            logger.info(f"Deleted component: {component_id}")
    
    async def broadcast_message(self, message: Dict[str, Any]):
        """Broadcast message to all connected WebSocket clients."""
        message_json = json.dumps(message)
        disconnected_clients = []
        
        for client in self.websocket_clients:
            try:
                await client.send(message_json)
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.append(client)
        
        # Remove disconnected clients
        for client in disconnected_clients:
            self.websocket_clients.remove(client)
    
    def render_component(self, component: Dict[str, Any]) -> None:
        """
        Render a component in Streamlit.
        
        This is a placeholder for actual Streamlit rendering.
        In a real implementation, this would convert MCP-UI components
        to Streamlit components and render them.
        """
        component_type = component.get("type", "card")
        component_id = component.get("id") or component.get("componentId")
        props = component.get("props", {})
        children = component.get("children", [])
        
        # Render based on component type
        if component_type == "card":
            with st.container():
                st.markdown(f"### {props.get('title', 'Card')}")
                if props.get("content"):
                    st.markdown(props["content"])
                
                # Render children
                for child in children:
                    self.render_component(child)
        
        elif component_type == "button":
            if st.button(props.get("label", "Button"), key=component_id):
                # Handle button click
                asyncio.create_task(self.handle_button_click(component_id))
        
        elif component_type == "input":
            value = st.text_input(
                props.get("label", "Input"),
                value=props.get("value", ""),
                key=component_id
            )
            if value != props.get("value"):
                asyncio.create_task(self.handle_input_change(component_id, value))
        
        elif component_type == "text":
            st.markdown(props.get("content", ""))
        
        elif component_type == "progress":
            progress = props.get("progress", 0)
            st.progress(progress)
        
        elif component_type == "chart":
            # TODO: Implement chart rendering
            st.markdown(f"Chart: {props.get('type', 'line')}")
        
        else:
            st.markdown(f"Unknown component type: {component_type}")
    
    async def handle_button_click(self, component_id: str):
        """Handle button click event."""
        await self.broadcast_message({
            "type": "ui.event",
            "eventType": "click",
            "componentId": component_id,
            "timestamp": datetime.now().isoformat(),
        })
    
    async def handle_input_change(self, component_id: str, value: str):
        """Handle input change event."""
        await self.broadcast_message({
            "type": "ui.event",
            "eventType": "change",
            "componentId": component_id,
            "value": value,
            "timestamp": datetime.now().isoformat(),
        })


# Streamlit app
def main():
    """Main Streamlit app."""
    st.set_page_config(
        page_title="LAPA Dynamic Studio",
        page_icon="🤖",
        layout="wide",
    )
    
    st.title("LAPA Dynamic Studio")
    st.markdown("Real-time agent-to-UI communication and generative component rendering")
    
    # Initialize Studio
    if "studio" not in st.session_state:
        st.session_state.studio = DynamicStudio()
        asyncio.create_task(st.session_state.studio.start())
    
    studio = st.session_state.studio
    
    # Render components
    if studio.components:
        st.sidebar.markdown("## Components")
        for component_id, component in studio.components.items():
            if st.sidebar.button(component_id, key=f"component_{component_id}"):
                st.session_state.selected_component = component_id
        
        # Render selected component
        if "selected_component" in st.session_state:
            selected_id = st.session_state.selected_component
            if selected_id in studio.components:
                studio.render_component(studio.components[selected_id])
    else:
        st.info("No components available. Connect agents to see UI updates.")
    
    # Event stream
    if st.sidebar.checkbox("Show Event Stream"):
        st.sidebar.markdown("## Event Stream")
        for event in studio.event_stream[-10:]:  # Show last 10 events
            st.sidebar.json(event)


if __name__ == "__main__":
    main()

