from dataclasses import fields, is_dataclass, asdict
from typing import get_type_hints
from enum import Enum

def deserialize(cls, data):
    if not data:
        return None
    kwargs = {}
    type_hints = get_type_hints(cls)
    for f in fields(cls):
        field_name = f.name
        field_type = type_hints.get(field_name)
        val = data.get(field_name)

        if isinstance(val, dict) and hasattr(field_type, '__dataclass_fields__'):
            kwargs[field_name] = deserialize(field_type, val)
        elif isinstance(val, list) and hasattr(field_type.__args__[0], '__dataclass_fields__'):
            kwargs[field_name] = [deserialize(field_type.__args__[0], v) for v in val]
        elif isinstance(field_type, type) and issubclass(field_type, Enum):
            kwargs[field_name] = field_type(val)
        else:
            kwargs[field_name] = val
    return cls(**kwargs)

def serialize(obj):
    if is_dataclass(obj):
        return serialize(asdict(obj))
    elif isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize(v) for v in obj]
    elif isinstance(obj, Enum):
        return obj.value
    else:
        return obj