#!/usr/bin/env python3
"""
MentorMaze-2B: Real Local Inference Server (OpenAI-compatible)
Brand: AI Tathastu / MentorMaze (https://mentormaze.aitathastu.com)
Unified Mentor: Dr. Aarav Mehta

Serves the genuinely loaded Qwen3.5-2B-Base model with the MentorMaze-2B LoRA SFT adapter
on Apple Silicon MPS (or CPU fallback).
Provides:
  - GET  /v1/health
  - GET  /v1/models
  - POST /v1/chat/completions
"""

import sys
import os
import json
import time
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import torch

PORT = int(os.environ.get("PORT", "8000"))
BASE_MODEL_ID = "Qwen/Qwen3.5-2B-Base"
ADAPTER_PATH = Path("training/adapters/mentormaze-2b-sft-v1")

print("=" * 70)
print("MENTORMAZE-2B LOCAL INFERENCE SERVER")
print(f"Base Model: {BASE_MODEL_ID}")
print(f"Adapter:    {ADAPTER_PATH}")
print("=" * 70)

# 1. Device selection
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"[Device] Using accelerator: {device.upper()}")

# 2. Load Tokenizer & Model into memory
t0 = time.time()
print("[Model] Loading tokenizer...")
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

tokenizer = AutoTokenizer.from_pretrained(str(ADAPTER_PATH), trust_remote_code=True)
print(f"[Model] Tokenizer loaded (vocab: {len(tokenizer):,})")

print("[Model] Loading base model weights...")
base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL_ID,
    torch_dtype=torch.bfloat16 if device == "mps" else torch.float32,
    trust_remote_code=True
).to(device)

print(f"[Model] Base model loaded in {time.time()-t0:.2f}s. Attaching LoRA adapter...")
model = PeftModel.from_pretrained(base_model, str(ADAPTER_PATH))
model.eval()
print(f"[Model] Ready for live inference on {device.upper()} in {time.time()-t0:.2f}s total.")

class MentorMazeInferenceHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Override to keep logs clean
        sys.stderr.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {args[0]} {args[1]} {args[2]}\n")

    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]

        if path in ["/health", "/v1/health"]:
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            resp = {
                "status": "ready",
                "service": "mentormaze-2b-inference",
                "base_model": BASE_MODEL_ID,
                "adapter": str(ADAPTER_PATH),
                "adapter_status": "EVALUATED_INTERMEDIATE",
                "training_steps": 25,
                "effective_batch_size": 8,
                "device": device,
                "trainable_parameters": 16819200,
                "total_parameters": 1898644288,
                "uptime_seconds": round(time.time() - t0, 1)
            }
            self.wfile.write(json.dumps(resp).encode("utf-8"))
            return

        if path in ["/models", "/v1/models"]:
            self.send_response(200)
            self.send_cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            resp = {
                "object": "list",
                "data": [
                    {
                        "id": "mentormaze/mentormaze-2b-sft-v1",
                        "object": "model",
                        "created": int(time.time()),
                        "owned_by": "ai-tathastu",
                        "root": BASE_MODEL_ID,
                        "permission": []
                    }
                ]
            }
            self.wfile.write(json.dumps(resp).encode("utf-8"))
            return

        self.send_response(404)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": f"Endpoint {path} not found"}).encode("utf-8"))

    def do_POST(self):
        path = self.path.split("?")[0]

        if path in ["/chat/completions", "/v1/chat/completions"]:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            
            try:
                payload = json.loads(body_bytes.decode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Invalid JSON payload: {str(e)}"}).encode("utf-8"))
                return

            messages = payload.get("messages", [])
            max_new_tokens = min(int(payload.get("max_tokens", 256)), 512)
            temperature = float(payload.get("temperature", 0.3))

            # Apply chat template
            try:
                gen_t0 = time.time()
                prompt_text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                inputs = tokenizer([prompt_text], return_tensors="pt").to(device)
                prompt_tokens = inputs.input_ids.shape[1]

                with torch.inference_mode():
                    outputs = model.generate(
                        **inputs,
                        max_new_tokens=max_new_tokens,
                        temperature=temperature if temperature > 0 else 0.01,
                        do_sample=temperature > 0.05,
                        pad_token_id=tokenizer.eos_token_id
                    )

                completion_ids = outputs[0][prompt_tokens:]
                completion_text = tokenizer.decode(completion_ids, skip_special_tokens=True).strip()
                completion_tokens = len(completion_ids)
                total_tokens = prompt_tokens + completion_tokens
                elapsed = round(time.time() - gen_t0, 3)

                resp = {
                    "id": f"chatcmpl-2b-{int(time.time()*1000)}",
                    "object": "chat.completion",
                    "created": int(time.time()),
                    "model": "mentormaze/mentormaze-2b-sft-v1",
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": completion_text
                            },
                            "finish_reason": "stop"
                        }
                    ],
                    "usage": {
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                        "total_tokens": total_tokens
                    },
                    "latency_seconds": elapsed,
                    "inference_engine": "transformers+peft",
                    "device": device
                }

                self.send_response(200)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(resp).encode("utf-8"))
            except Exception as e:
                sys.stderr.write(f"[ERROR] Inference failed: {str(e)}\n")
                self.send_response(500)
                self.send_cors_headers()
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"Inference execution failed: {str(e)}"}).encode("utf-8"))
            return

        self.send_response(404)
        self.send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": f"Endpoint {path} not found"}).encode("utf-8"))

def run():
    server = HTTPServer(("127.0.0.1", PORT), MentorMazeInferenceHandler)
    print(f"[Server] MentorMaze-2B HTTP server listening on http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[Server] Shutting down...")
        server.server_close()

if __name__ == "__main__":
    run()
