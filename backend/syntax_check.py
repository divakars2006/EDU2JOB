import py_compile
try:
    py_compile.compile('app.py', doraise=True)
    print("app.py syntax is valid.")
    py_compile.compile('db.py', doraise=True)
    print("db.py syntax is valid.")
except Exception as e:
    print(f"Syntax error: {e}")
