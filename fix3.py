import re
with open('index.html', 'r') as f:
    content = f.read()

# Fix all [x.style](http://x.style) corruptions
content = re.sub(r'\[([a-zA-Z_][a-zA-Z0-9_]*)\.style\]\(http://[a-zA-Z_][a-zA-Z0-9_]*\.style\)', r'\1.style', content)

# Fix all [x.y](http://x.y) corruptions  
content = re.sub(r'\[([a-zA-Z_][a-zA-Z0-9_.]+)\]\(http://[a-zA-Z0-9_.]+\)', r'\1', content)

with open('index.html', 'w') as f:
    f.write(content)
print("Done")
