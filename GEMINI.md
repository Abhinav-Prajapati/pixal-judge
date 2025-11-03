## Global Coding Guidelines

These rules are critical and must be followed for all code generation and modification.

### 1. No `print()` Statements
Do not use `print()` for debugging or informational messages in Python applications. All output must be directed through the standard `logging` module.

```python
# Correct
import logging
logging.info("This is an informational message.")
logging.warning("This is a warning.")

# Incorrect
print("This is a warning.")