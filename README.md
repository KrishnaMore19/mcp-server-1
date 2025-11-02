# MCP File Search Server

A Model Context Protocol (MCP) server for searching keywords in files.

## Features

- Search for keywords in text files
- Case-sensitive and case-insensitive search options
- Returns matching lines with line numbers
- Error handling for file access issues

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/mcp-file-search-server.git
cd mcp-file-search-server
yarn install
```

## Usage

Run with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node index.js
```

## Tool: search_file

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| filePath | string | Yes | Path to the file to search |
| keyword | string | Yes | Keyword to search for |
| caseSensitive | boolean | No | Case-sensitive search (default: false) |

### Example Input

```json
{
  "filePath": "./sample.txt",
  "keyword": "Hello",
  "caseSensitive": false
}
```

### Example Output

```json
{
  "success": true,
  "filePath": "C:\\Users\\krish\\Desktop\\mcp\\mcp-file-search-server\\sample.txt",
  "keyword": "Hello",
  "caseSensitive": false,
  "totalMatches": 8,
  "matches": [
    {
      "lineNumber": 1,
      "content": "Hello World"
    },
    {
      "lineNumber": 3,
      "content": "Hello again from line 3"
    }
  ]
}
```

## Technologies

- Node.js
- @modelcontextprotocol/sdk v1.20.2
- Zod for validation

## License

MIT