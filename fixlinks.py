import re
with open('index.html', 'r') as f:
    content = f.read()

content = re.sub(r'\[([A-Za-z0-9_.]+)\]\(http://[A-Za-z0-9_.]+\)', r'\1', content)

with open('index.html', 'w') as f:
    f.write(content)

print("Done")
