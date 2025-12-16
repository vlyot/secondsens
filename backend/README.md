# SecondSense Backend

Go monolith backend for the SecondSense recommendation engine.

## Prerequisites

- Go 1.21 or later
- Git

## Installation

Clone the repository and download dependencies:

```bash
cd backend
go mod download
```

## Configuration

Copy the environment template and set your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your:
- `ANTHROPIC_API_KEY` - Your Anthropic API key for Claude
- `LLM_MODEL` - Claude model to use (default: claude-3-5-sonnet-20241022)
- `PORT` - Server port (default: 8080)

## Running

Start the development server:

```bash
go run src/main.go
```

Server will start on `http://localhost:8080`

## Testing

Run all tests:

```bash
go test ./...
```

Run tests with verbose output:

```bash
go test ./... -v
```

## API Endpoints

### Health Check
```
GET /health
```
Response: `{"status":"ok"}`

### Recommendation (Stub)
```
POST /api/recommend
Content-Type: application/json

{
  "item": "Logitech G Pro X Superlight",
  "preferences": {
    "budget_flexibility": 7,
    "condition_standards": 6,
    "hassle_tolerance": 8
  }
}
```

Response: `{"message":"Not implemented yet"}`

## Building

Create a binary:

```bash
go build -o secondsense src/main.go
./secondsense
```

## Project Structure

- `src/main.go` - HTTP server entry point
- `src/shared/` - Shared infrastructure (config, types)
- `src/products/` - Product matching module
- `src/prices/` - Price search module
- `src/recommendations/` - Recommendation generation module
- `data/products.yaml` - Product catalog

## Architecture

Modular monolith with clean separation of concerns:
- Single Go binary
- Three business modules (products, prices, recommendations)
- Shared infrastructure for config, types, HTTP
- All modules communicate via function calls, not HTTP
