# Run: python3 design/badges/generate.py. Writes one SVG per badge beside this file.
# Code Reps badges, v2: an enamel-pin finish on the logo's tile. viewBox 72 so tags and stacks have room.
import os, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
DESK_TOP='#3B4C43'; DESK_BOT='#27342D'; EDGE='#1E2A24'; HILITE='#FFFFFF'
BRACKET='#B2C9BD'; LIME='#BCE57B'; LIME_HI='#D8F2A8'; INK='#293E33'; OPEN='#5B6F62'; REST='#94A88C'

def defs(uid):
    return (f'<defs>'
            f'<linearGradient id="enamel{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{DESK_TOP}"/><stop offset="1" stop-color="{DESK_BOT}"/></linearGradient>'
            f'<radialGradient id="glow{uid}" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="{LIME}" stop-opacity="0.32"/><stop offset="1" stop-color="{LIME}" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="bar{uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{LIME_HI}"/><stop offset="0.55" stop-color="{LIME}"/></linearGradient>'
            f'</defs>')

# The tile sits at (8,9) 64x64 inside an 80x80 badge, leaving room for stacked cards above and a tag below.
X, Y, S = 8, 9, 64
def tile(uid, round_=False, kept=False, glow=False):
    r = S/2 if round_ else 16
    out = f'<rect id="Tile" x="{X}" y="{Y}" width="{S}" height="{S}" rx="{r}" fill="url(#enamel{uid})" stroke="{EDGE}" stroke-width="1.5"/>'
    # A thin highlight just inside the top edge: the enamel catching light.
    out += f'<rect id="Highlight" x="{X+1.5}" y="{Y+1.5}" width="{S-3}" height="{S-3}" rx="{r-1.5}" fill="none" stroke="{HILITE}" stroke-opacity="0.10" stroke-width="1"/>'
    if glow:
        out += f'<circle id="Glow" cx="{X+32}" cy="{Y+32}" r="24" fill="url(#glow{uid})"/>'
    if kept:
        out += f'<rect id="Kept rim" x="{X+2.25}" y="{Y+2.25}" width="{S-4.5}" height="{S-4.5}" rx="{r-2}" fill="none" stroke="{LIME}" stroke-width="2.5"/>'
    return out
def stack(n, uid):
    # Cards behind the tile, peeking above it: one for five kept skills, two for ten.
    out = ''
    for i in range(n, 0, -1):
        inset = 5*i
        out += f'<rect id="Stack {i}" x="{X+inset}" y="{Y-4*i}" width="{S-2*inset}" height="{S}" rx="14" fill="{DESK_BOT}" stroke="{LIME}" stroke-opacity="{0.6 if i==1 else 0.35}" stroke-width="1.5"/>'
    return out
def brackets():
    return f'<path id="Brackets" d="M{X+12} {Y+19} {X} {Y+32}l12 13M{X+32+10} {Y+19}l12 13-12 13" transform="translate(0 0)" fill="none" stroke="{BRACKET}" stroke-linecap="round" stroke-linejoin="round" stroke-width="5"/>'.replace(f'M{X+12} {Y+19} {X} {Y+32}', f'M{X+22} {Y+19} {X+10} {Y+32}')
BARS={'top':(28,36,23),'mid':(26,38,32),'bot':(28,36,41)}
def lit(name, uid):
    a,b,y=BARS[name]
    # Solid lime, with a fine lighter stroke along the top so the rung reads as lit.
    return (f'<g id="Bar {name}"><path d="M{X+a} {Y+y}h{b-a}" stroke="{LIME}" stroke-linecap="round" stroke-width="5"/>'
            f'<path d="M{X+a} {Y+y-1.2}h{b-a}" stroke="{LIME_HI}" stroke-linecap="round" stroke-width="1.4"/></g>')
def unlit(name, dashed=False):
    a,b,y=BARS[name]
    dash=' stroke-dasharray="2.2 2"' if dashed else ''
    return f'<rect id="Bar {name} {"rest" if dashed else "open"}" x="{X+a-2.5}" y="{Y+y-2.5}" width="{b-a+5}" height="5" rx="2.5" fill="none" stroke="{REST if dashed else OPEN}" stroke-width="1.4"{dash}/>'
def tag(label):
    # A medal tag hanging across the tile's bottom edge.
    w = 14 + 5.4*len(label); x = 40 - w/2
    return (f'<g id="Tag"><rect x="{x}" y="{Y+S-7}" width="{w}" height="13" rx="6.5" fill="{LIME}" stroke="{EDGE}" stroke-width="1.5"/>'
            f'<text x="40" y="{Y+S+2.6}" text-anchor="middle" font-family="Source Sans 3" font-weight="800" font-size="9" fill="{INK}">{label}</text></g>')
def moon():
    # A crescent in the top-right corner: a month of keeping it.
    return f'<path id="Moon" d="M{X+53} {Y+7.5}a5.5 5.5 0 1 0 4.2 9.2 4.4 4.4 0 1 1-4.2-9.2z" fill="{LIME}"/>'
def sunrise():
    return f'<path id="Sunrise" d="M{X+25.5} {Y+55}a6.5 6.5 0 0 1 13 0" fill="none" stroke="{LIME}" stroke-width="2" stroke-linecap="round"/><path d="M{X+21} {Y+55}h22" stroke="{BRACKET}" stroke-width="1.6" stroke-linecap="round"/>'
def weeks():
    return '<g id="Weeks">' + ''.join(f'<circle cx="{X+x}" cy="{Y+y}" r="1.8" fill="{LIME}"/>' for x in (25.5,29.8,34.2,38.5) for y in (25,32,39)) + '</g>'
def trail():
    return (f'<g id="Trail"><path d="M{X+27.5} {Y+22.5}c9 2 9 7 4.5 9.5s-4.5 7.5 4.5 9.5" fill="none" stroke="{BRACKET}" stroke-width="1.6" stroke-linecap="round"/>' +
            ''.join(f'<circle cx="{X+x}" cy="{Y+y}" r="3.4" fill="{LIME}" stroke="{DESK_BOT}" stroke-width="1.4"/>' for x,y in ((27.5,22.5),(32,32),(36.5,41.5))) + '</g>')
def check():
    return f'<path id="Check" d="M{X+26.5} {Y+32.5}l4 4 7.5-8.5" fill="none" stroke="{LIME}" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"/>'
def flag():
    return f'<path id="Flag" d="M{X+28} {Y+42}V{Y+22}m0 1h9l-2.5 4 2.5 4h-9" fill="none" stroke="{LIME}" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2"/>'

def badge(name, uid, parts):
    body = defs(uid) + ''.join(parts)
    open(os.path.join(OUT, name + '.svg'), 'w').write(f'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><title>{name}</title>{body}</svg>')

L = lambda *names, uid: [lit(n, uid) for n in names]
set_ = {
 '01 Independent':        lambda u: [tile(u, glow=True), brackets(), unlit('top'), *L('mid','bot', uid=u)],
 '02 Retained':           lambda u: [tile(u, kept=True, glow=True), brackets(), *L('top','mid','bot', uid=u)],
 '03 Five retained':      lambda u: [stack(1,u), tile(u, kept=True, glow=True), brackets(), *L('top','mid','bot', uid=u), tag('5')],
 '04 Ten retained':       lambda u: [stack(2,u), tile(u, kept=True, glow=True), brackets(), *L('top','mid','bot', uid=u), tag('10')],
 '05 Held for a month':   lambda u: [tile(u, kept=True, glow=True), brackets(), *L('top','mid','bot', uid=u), moon(), tag('30d')],
 '06 Four steady weeks':  lambda u: [tile(u, glow=True), brackets(), weeks()],
 '07 Welcome back':       lambda u: [tile(u, glow=True), brackets(), lit('top', u), unlit('mid', dashed=True), lit('bot', u), sunrise()],
 '08 Stage independently':lambda u: [tile(u, glow=True), brackets(), trail()],
 'C1 First rep':          lambda u: [tile(u, round_=True), brackets(), unlit('top'), unlit('mid'), lit('bot', u)],
 'C2 Stage complete':     lambda u: [tile(u, round_=True, glow=True), brackets(), check()],
 'C3 Track complete':     lambda u: [tile(u, round_=True, glow=True), brackets(), flag()],
}
for i, (name, make) in enumerate(set_.items()):
    badge(name, f'b{i}', make(f'b{i}'))
print(len(set_))
