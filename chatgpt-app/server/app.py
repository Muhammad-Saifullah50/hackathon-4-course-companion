from src.main import get_app

mcp = get_app()
app = mcp.http_app(path="/mcp", stateless_http=True)
