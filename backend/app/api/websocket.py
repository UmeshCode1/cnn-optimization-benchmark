"""
WebSocket API Endpoint for Real-Time Experiment Progress Streaming.
"""

import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..workers.runner import register_ws_subscriber, unregister_ws_subscriber

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/experiment/{exp_id}")
async def experiment_progress_websocket(websocket: WebSocket, exp_id: str):
    """Real-time streaming channel broadcasting benchmark progress to frontend."""
    await websocket.accept()
    queue = asyncio.Queue()
    register_ws_subscriber(exp_id, queue)
    
    try:
        # Send initial connected ack
        await websocket.send_json({"event": "CONNECTED", "experiment_id": exp_id})
        
        while True:
            # Wait for event from runner or ping
            msg = await queue.get()
            await websocket.send_json(msg)
    except WebSocketDisconnect:
        unregister_ws_subscriber(exp_id, queue)
    except Exception:
        unregister_ws_subscriber(exp_id, queue)
