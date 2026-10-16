# Run: python3 design/badges/generate.py. Writes one SVG per badge beside this file.
# Generates the Code Reps badge glyphs on the logo's 64-unit tile.
import os
OUT=os.path.dirname(os.path.abspath(__file__))
TILE='#303F38'; EDGE='#55685B'; BRACKET='#B2C9BD'; LIME='#BCE57B'; INK='#293E33'; REST='#94A88C'
def tile(round_=False, kept=False):
    r = 32 if round_ else 16
    # A retained badge keeps a lime rim: evidence that stayed with you.
    edge = f'<rect id="Kept rim" x="1.5" y="1.5" width="61" height="61" rx="{r-1.5}" fill="none" stroke="{LIME}" stroke-width="2"/>' if kept else ''
    return f'<rect id="Tile" width="64" height="64" rx="{r}" fill="{TILE}" stroke="{EDGE}" stroke-width="1"/>{edge}'
BRACKETS=f'<path id="Brackets" d="M22 19 10 32l12 13M42 19l12 13-12 13" fill="none" stroke="{BRACKET}" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/>'
BARS={'top':(28,36,23),'mid':(26,38,32),'bot':(28,36,41)}
def lit(name):
    a,b,y=BARS[name]
    return f'<path id="Bar {name} lit" d="M{a} {y}h{b-a}" stroke="{LIME}" stroke-linecap="round" stroke-width="5"/>'
def unlit(name, dashed=False):
    a,b,y=BARS[name]
    dash=f' stroke-dasharray="2.2 2"' if dashed else ''
    col = REST if dashed else EDGE
    return f'<rect id="Bar {name} {"rest" if dashed else "open"}" x="{a-2.5}" y="{y-2.5}" width="{b-a+5}" height="5" rx="2.5" fill="none" stroke="{col}" stroke-width="1.4"{dash}/>'
def tab(label, w=None):
    w = w or (12 + 5*len(label))
    x = 32 - w/2
    return (f'<g id="Count tab"><rect x="{x}" y="50.5" width="{w}" height="11" rx="5.5" fill="{LIME}"/>'
            f'<text x="32" y="58.6" text-anchor="middle" font-family="Source Sans 3" font-weight="700" font-size="8.5" fill="{INK}">{label}</text></g>')
def svg(name, body):
    s=f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><title>{name}</title>{body}</svg>'
    open(os.path.join(OUT, name+'.svg'),'w').write(s)
dots=''.join(f'<circle cx="{x}" cy="{y}" r="1.7" fill="{LIME}"/>' for x in (26,30,34,38) for y in (25,32,39))
trail=(f'<path d="M27.5 22.5c9 2 9 7 4.5 9.5s-4.5 7.5 4.5 9.5" fill="none" stroke="{BRACKET}" stroke-width="1.6" stroke-linecap="round"/>' +
       ''.join(f'<circle cx="{x}" cy="{y}" r="3.3" fill="{LIME}" stroke="{TILE}" stroke-width="1.4"/>' for x, y in ((27.5,22.5),(32,32),(36.5,41.5))))
badges = {
 '01 Independent': tile()+BRACKETS+unlit('top')+lit('mid')+lit('bot'),
 '02 Retained': tile(kept=True)+BRACKETS+lit('top')+lit('mid')+lit('bot'),
 '03 Five retained': tile(kept=True)+BRACKETS+lit('top')+lit('mid')+lit('bot')+tab('5'),
 '04 Ten retained': tile(kept=True)+BRACKETS+lit('top')+lit('mid')+lit('bot')+tab('10'),
 '05 Held for a month': tile(kept=True)+BRACKETS+lit('top')+lit('mid')+lit('bot')+tab('30d'),
 '06 Four steady weeks': tile()+BRACKETS+f'<g id="Weeks">{dots}</g>',
 '07 Welcome back': tile()+BRACKETS+lit('top')+unlit('mid', dashed=True)+lit('bot'),
 '08 Stage independently': tile()+BRACKETS+f'<g id="Trail">{trail}</g>',
 # Completion badges, refreshed: the round tile is completion; the square tile is evidence.
 'C1 First rep': tile(True)+BRACKETS+unlit('top')+unlit('mid')+lit('bot'),
 'C2 Stage complete': tile(True)+BRACKETS+f'<path d="M26.5 32.5l4 4 7.5-8.5" fill="none" stroke="{LIME}" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>',
 'C3 Track complete': tile(True)+BRACKETS+f'<path d="M28 42V22m0 1h9l-2.5 4 2.5 4h-9" fill="none" stroke="{LIME}" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2"/>',
}
for name, body in badges.items(): svg(name, body)
print('\n'.join(sorted(os.listdir(OUT))))
