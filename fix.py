content = open('index.html').read()
content = content.replace('#aab-export-panel.open', '#aab-export-panel.open')
# Find and fix the corrupted CSS selector
import re
content = re.sub(r'#\[aab-export-panel\.open\]\(http://aab-export-panel\.open\)', '#aab-export-panel.open', content)
open('index.html', 'w').write(content)
print('Fixed. Count:', content.count('#aab-export-panel.open'))