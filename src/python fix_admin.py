import shutil
import os

# Read the current AdminPage
src = open('src/pages/AdminPage.jsx', 'r', encoding='utf-8').read()

# Fix the broken filtered declaration if present
broken = """  }, [authed, adminRole]);
    const q = search.toLowerCase();"""

fixed = """  }, [authed, adminRole]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();"""

if broken in src:
    src = src.replace(broken, fixed)
    print("Fixed broken filtered declaration")
else:
    print("filtered looks OK")

# Write back
open('src/pages/AdminPage.jsx', 'w', encoding='utf-8').write(src)
print("Done! File saved.")