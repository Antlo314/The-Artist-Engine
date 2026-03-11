import os

files_to_process = [
    r"c:\Users\aarons\.gemini\antigravity\scratch\the-artist-engine\frontend\src\App.tsx",
    r"c:\Users\aarons\.gemini\antigravity\scratch\the-artist-engine\frontend\src\components\Dashboard.tsx"
]

def replace_theme(content):
    # Colors
    content = content.replace('bg-[#a5b5ba]', 'bg-slate-50')
    content = content.replace('text-red-700', 'text-sky-700')
    content = content.replace('text-red-600', 'text-sky-600')
    content = content.replace('bg-red-600', 'bg-sky-500')
    content = content.replace('border-red-600', 'border-sky-500')
    content = content.replace('bg-red-500', 'bg-sky-400')
    content = content.replace('text-red-500', 'text-sky-500')
    content = content.replace('border-red-500', 'border-sky-400')
    content = content.replace('bg-red-100', 'bg-sky-50')
    content = content.replace('text-red-900', 'text-sky-900')
    content = content.replace('bg-red-900', 'bg-sky-800')
    content = content.replace('bg-red-50', 'bg-sky-50')
    content = content.replace('border-red-300', 'border-sky-300')
    content = content.replace('text-red-800', 'text-sky-800')
    content = content.replace('rgba(220,38,38', 'rgba(14,165,233')
    content = content.replace('rgba(239,68,68', 'rgba(14,165,233')
    return content

for file_path in files_to_process:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Custom edits for App.tsx
    if 'App.tsx' in file_path:
        # replace video
        video_block = """<video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none z-0 invert mix-blend-color-burn"
            >
                <source src="/data_dust.mp4" type="video/mp4" />
            </video>"""
        img_block = """<img
                src="/site/light_abstract_bg_1773233140940.png"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0 mix-blend-normal"
            />"""
        content = content.replace(video_block, img_block)
        
        # ambient background glows adjustments
        glow1 = 'bg-white/10 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-soft-light'
        new_glow1 = 'bg-sky-200/40 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-normal'
        content = content.replace(glow1, new_glow1)
        
        glow2 = 'bg-red-500/10 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-soft-light'
        new_glow2 = 'bg-white/60 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-normal'
        content = content.replace(glow2, new_glow2)

    if 'Dashboard.tsx' in file_path:
        # hero art replacement
        bg_art = """<div
                    className="absolute inset-0 bg-cover bg-center opacity-40 z-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none mix-blend-color-burn"
                    style={{ backgroundImage: "url('/cmd_center.png')" }}
                />"""
        new_bg_art = """<div
                    className="absolute inset-0 bg-cover bg-center opacity-70 z-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-normal"
                    style={{ backgroundImage: "url('/site/dashboard_hero_art_1773233156229.png')" }}
                />"""
        content = content.replace(bg_art, new_bg_art)
        
    content = replace_theme(content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Replacement successful")
