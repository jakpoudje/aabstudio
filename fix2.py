with open('index.html', 'r') as f:
    content = f.read()

content = content.replace('[c.style](http://c.style)', 'c.style')
content = content.replace('[el.style](http://el.style)', 'el.style')
content = content.replace('[h.style](http://h.style)', 'h.style')

old = "};\n// ── GSAP-style hardware-accelerated transition helper"
new = "};\n}, 500); // end nav override defer\n// ── GSAP-style hardware-accelerated transition helper"
content = content.replace(old, new, 1)

with open('index.html', 'w') as f:
    f.write(content)
print("Done")
