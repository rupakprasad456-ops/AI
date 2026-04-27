# Pest & Scheme MCP Server

An MCP (Model Context Protocol) server providing tools for agricultural pests and government schemes with LangSmith observability.

## Features

- **Pests Tool**: Search and filter agricultural pest information
- **Schemes Tool**: Search and filter government agricultural schemes
- **API Key Management**: Set and retrieve API keys for authentication
- **LangSmith Observability**: Full tracing and monitoring via LangSmith

## Tools

### 1. get_pests
Search and filter agricultural pest information.

**Parameters:**
- `search` (optional): Search term to filter pests by name or category
- `category` (optional): Filter by pest category (Insect, Arachnid, Nematode)

### 2. get_schemes
Search and filter government agricultural schemes.

**Parameters:**
- `search` (optional): Search term to filter schemes by name or type
- `type` (optional): Filter by scheme type (Central, State)

### 3. set_api_key
Set the API key for authentication.

**Parameters:**
- `api_key` (required): The API key to store

### 4. get_api_key
Get the current API key status.

## Installation

### Option 1: Python (Recommended for deployment)
```bash
pip install -r requirements.txt
```

### Option 2: Node.js
```bash
npm install
```

## Configuration

1. Update the environment variables in `.env`:
- `LANGCHAIN_API_KEY`: Your LangSmith API key
- `LANGCHAIN_PROJECT`: Your project name in LangSmith
- `API_KEY`: Your service API key

## Running

### Python Server
```bash
python server.py
```

### Node.js Server
```bash
npm start
```

## API Endpoints

After running the server, the following endpoints are available:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Server info |
| GET | `/health` | Health check |
| POST | `/tools/get_pests` | Get pests (body: {search?, category?}) |
| POST | `/tools/get_schemes` | Get schemes (body: {search?, type?}) |
| POST | `/tools/set_api_key` | Set API key (body: {api_key}) |
| GET | `/tools/get_api_key` | Get API key status |

## LangSmith Observability

This server integrates with LangSmith for full observability:
- All tool calls are traced
- Input/output data is logged
- Errors are captured and reported

To enable LangSmith:
1. Get your API key from [LangSmith](https://smith.langchain.com)
2. Set `LANGCHAIN_API_KEY` in your `.env` file
3. All traces will appear in your LangSmith dashboard

## Deployment

### Local Deployment
```bash
python server.py
```
Server runs on `http://localhost:8000`

### Deploy to Render/Railway/Heroku
1. Push code to GitHub
2. Connect repository to deployment platform
3. Set environment variables:
   - `LANGCHAIN_API_KEY`: Your LangSmith API key
   - `API_KEY`: Your service API key
4. Set start command: `python server.py`

### Deploy using ngrok for testing
```bash
pip install fastapi uvicorn
python server.py
# In another terminal:
ngrok http 8000
```

## Example API Calls

### Get all pests
```bash
curl -X POST http://localhost:8000/tools/get_pests \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Search for insect pests
```bash
curl -X POST http://localhost:8000/tools/get_pests \
  -H "Content-Type: application/json" \
  -d '{"search": "insect"}'
```

### Get all schemes
```bash
curl -X POST http://localhost:8000/tools/get_schemes \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Search for PM-KISAN scheme
```bash
curl -X POST http://localhost:8000/tools/get_schemes \
  -H "Content-Type: application/json" \
  -d '{"search": "PM-KISAN"}'
```

### Set API key
```bash
curl -X POST http://localhost:8000/tools/set_api_key \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-api-key"}'
```

### Check API key status
```bash
curl http://localhost:8000/tools/get_api_key
```

## License

MIT