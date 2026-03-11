import os

files_to_process = [
    r"c:\Users\aarons\.gemini\antigravity\scratch\the-artist-engine\frontend\src\App.tsx",
    r"c:\Users\aarons\.gemini\antigravity\scratch\the-artist-engine\frontend\src\components\Dashboard.tsx"
]

def replace_theme(content):
    # Change text colors back to red for vitality
    content = content.replace('text-sky-700', 'text-red-700')
    content = content.replace('text-sky-600', 'text-red-600')
    content = content.replace('text-sky-500', 'text-red-500')
    content = content.replace('text-sky-900', 'text-red-900')
    content = content.replace('text-sky-800', 'text-red-800')
    
    # Change borders and backgrounds for active elements back to red
    content = content.replace('border-sky-500', 'border-red-500')
    content = content.replace('border-sky-400', 'border-red-400')
    content = content.replace('border-sky-300', 'border-red-300')
    
    content = content.replace('bg-sky-500', 'bg-red-600')
    content = content.replace('bg-sky-400', 'bg-red-500')
    
    # Restore red glows in TSX strings
    content = content.replace('rgba(14,165,233', 'rgba(220,38,38')
    
    return content

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = replace_theme(content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Red undertones restored successfully")
