from mcp.types import ToolAnnotations
from pydantic import BaseModel

ERROR_SCHEMA = {
    "type": "object",
    "required": ["error"],
    "properties": {
        "error": {
            "type": "object",
            "required": ["message"],
            "properties": {
                "message": {"type": "string"},
            },
            "additionalProperties": True,
        }
    },
    "additionalProperties": True,
}

READ_ONLY_ANNOTATIONS = ToolAnnotations(
    readOnlyHint=True,
    destructiveHint=False,
    idempotentHint=True,
    openWorldHint=False,
)

MUTATING_ANNOTATIONS = ToolAnnotations(
    readOnlyHint=False,
    destructiveHint=False,
    idempotentHint=False,
    openWorldHint=False,
)


def output_schema(model: type[BaseModel]) -> dict[str, object]:
    """Build an object schema accepting either success data or an error."""
    success_schema = model.model_json_schema()
    definitions = success_schema.pop("$defs", None)
    schema: dict[str, object] = {
        "type": "object",
        "anyOf": [success_schema, ERROR_SCHEMA],
    }
    if definitions:
        schema["$defs"] = definitions
    return schema
