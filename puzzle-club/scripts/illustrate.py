"""Draw the six puzzle illustrations and crop the clues (Pillow)."""
from pathlib import Path
from random import Random
from math import cos, sin, pi
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parents[1] / "public" / "assets"
OUT.mkdir(parents=True, exist_ok=True)
SIZE = (800, 600)

def backdrop(color, seed):
    rng = Random(seed)
    image = Image.new("RGB", SIZE)
    pixels = []
    for y in range(SIZE[1]):
        for x in range(SIZE[0]):
            light = 12 - .00012 * ((x - 230) ** 2 + (y - 130) ** 2)
            grain = rng.gauss(0, 2)
            pixels.append(tuple(max(0, min(255, int(c + light + grain))) for c in color))
    image.putdata(pixels)
    return image

def shadow(image, box):
    layer = Image.new("L", SIZE)
    ImageDraw.Draw(layer).ellipse(box, fill=86)
    image.paste((26, 26, 27), (0, 0), layer.filter(ImageFilter.GaussianBlur(26)))

def round_rect(d, box, color, radius=20, outline=None, width=2):
    d.rounded_rectangle(box, radius, fill=color, outline=outline, width=width)

def tape(image):
    shadow(image, (112, 386, 692, 490))
    d = ImageDraw.Draw(image)
    d.polygon([(131,391),(182,278),(255,245),(502,270),(650,315),(670,418),(185,459)], fill="#172c57")
    round_rect(d,(133,393,670,459),"#18284b",30)
    d.polygon([(134,392),(200,306),(269,269),(485,271),(637,309),(649,385),(209,429)],fill="#385dba")
    d.line([(147,390),(215,323),(269,295)],fill="#7596e5",width=6)
    d.ellipse((215,142,483,401),fill="#d2a15d",outline="#946d3c",width=5)
    d.ellipse((227,142,495,394),fill="#edc886",outline="#fae4b4",width=5)
    for inset in (6, 12, 19, 27):
        d.arc((229+inset,145+inset,492-inset,391-inset),188,350,fill="#fff0c8",width=3)
    d.ellipse((291,203,427,333),fill="#876242")
    d.ellipse((306,210,426,324),fill="#253d7e")
    d.polygon([(460,213),(641,294),(620,321),(455,250)], fill="#f9dc9f")
    d.line([(461,215),(639,295)],fill="#fff3cf",width=5)
    d.polygon([(582,313),(632,296),(654,313),(604,331)],fill="#33434e")
    for k in range(8):
        x=585+k*7
        y=313-k*2
        d.polygon([(x,y),(x+5,y-9),(x+9,y-2)],fill="#bfc8c5",outline="#52626a")
    d.line([(206,429),(641,391)],fill="#1a3273",width=5)

def pin(image):
    shadow(image,(138,369,654,468))
    d=ImageDraw.Draw(image)
    upper=[(146,248),(309,217),(365,244),(625,181),(654,241),(412,313),(364,290),(171,332)]
    lower=[(166,374),(349,343),(387,308),(621,357),(621,424),(385,387),(352,410),(165,441)]
    d.polygon(lower, fill="#a56d40")
    d.polygon([(165,378),(349,347),(389,317),(617,366),(614,408),(386,375),(354,399),(168,427)],fill="#deb077")
    d.polygon(upper, fill="#9c5d34")
    d.polygon([(145,248),(309,217),(365,244),(625,181),(638,224),(407,292),(361,271),(163,309)],fill="#e8bc82")
    d.line([(177,264),(308,236),(363,261),(614,200)], fill="#f9dbac",width=5)
    d.line([(172,394),(357,367),(395,342),(600,382)], fill="#efc896",width=4)
    d.line([(375,295),(441,255)],fill="#504d4c",width=14)
    d.line([(387,333),(458,391)],fill="#504d4c",width=14)
    for x in [372,384,396,408]:
        d.ellipse((x-27,276,x+30,348),outline="#444b51",width=6)
        d.arc((x-27,276,x+30,348),185,356,fill="#e5e1d7",width=3)
    for x in range(190,280,22):
        d.line([(x,294),(x+6,314)],fill="#b27e51",width=3)

def juicer(image):
    shadow(image,(136,365,670,505))
    d=ImageDraw.Draw(image)
    round_rect(d,(558,279,682,350),"#9f4e16",32)
    round_rect(d,(560,270,675,328),"#ffa347",28)
    d.ellipse((121,230,661,479), fill="#a74812")
    d.ellipse((121,200,661,451), fill="#f68e31",outline="#aa4f17",width=5)
    d.ellipse((150,227,633,422), fill="#bb5d20",outline="#ffc062",width=7)
    d.ellipse((181,241,601,396), fill="#e7812e")
    d.polygon([(130,280),(102,309),(173,340),(224,299)],fill="#ffad53",outline="#b66121")
    d.ellipse((270,252,525,372),fill="#a3521c")
    d.polygon([(274,318),(334,202),(363,135),(388,120),(411,136),(442,199),(518,320)],fill="#ffac46")
    d.ellipse((274,277,518,363),fill="#f99a35")
    for points in [[(388,126),(354,194),(301,316)],[(392,128),(375,204),(354,343)],[(395,128),(407,199),(414,337)],[(397,129),(430,190),(483,321)]]:
        d.line(points,fill="#c76824",width=15,joint="curve")
        d.line([(x-3,y-2) for x,y in points],fill="#ffd579",width=4,joint="curve")
    for x,y in [(276,363),(306,379),(345,390),(389,394),(434,390),(477,378),(518,361)]:
        d.ellipse((x-6,y-3,x+6,y+3),fill="#853e17")

def plug(image):
    shadow(image,(167,359,658,489))
    d=ImageDraw.Draw(image)
    d.arc((16,214,471,471), 233, 25,fill="#172746",width=38)
    d.arc((16,207,471,464), 234, 19,fill="#5c75a5",width=9)
    round_rect(d,(300,314,381,406),"#293e64",16)
    round_rect(d,(343,246,538,421),"#273a68",39)
    round_rect(d,(353,237,539,395),"#5879c5",36,outline="#192f5b",width=5)
    d.polygon([(514,242),(563,256),(558,388),(515,396)],fill="#344f8e")
    for y in (267,344):
        round_rect(d,(548,y,661,y+25),"#a09487",8,outline="#596477",width=3)
        round_rect(d,(553,y-3,657,y+12),"#ddd1b9",5)
    for x in (315,329,345):
        d.line((x,336,x,386),fill="#5f739d",width=5)
    d.arc((370,250,510,367),198,325,fill="#8ba8e5",width=5)

def whisk(image):
    shadow(image,(103,323,682,534))
    d=ImageDraw.Draw(image)
    loops=[
        [(594,173),(541,131),(465,139),(404,172),(409,240),(480,301),(558,347)],
        [(594,173),(555,119),(493,112),(438,153),(452,216),(500,290),(558,347)],
        [(594,173),(604,136),(554,108),(507,140),(491,216),(511,290),(558,347)],
        [(594,173),(650,163),(654,206),(621,266),(595,305),(558,347)],
        [(594,173),(666,169),(689,228),(658,292),(607,327),(558,347)],
    ]
    def bezier(points):
        chain=[]
        for j in range(0,6,3):
            p=points[j:j+4]
            for i in range(32):
                t=i/31
                w=[(1-t)**3,3*(1-t)**2*t,3*(1-t)*t*t,t**3]
                chain.append(tuple(sum(point[k]*weight for point,weight in zip(p,w)) for k in (0,1)))
        return chain
    for pts in loops:
        chain=bezier(pts)
        d.line(chain, fill="#424c56",width=10)
        d.line([(x-1,y-2) for x,y in chain],fill="#f7ead1",width=4)
    d.line([(348,467),(562,341)],fill="#5d5960",width=47)
    d.line([(344,462),(560,335)],fill="#d7c4ae",width=28)
    d.line([(171,538),(452,402)], fill="#123d36",width=75)
    d.ellipse((130,493,210,574),fill="#123d36")
    d.ellipse((409,359,487,441),fill="#123d36")
    d.line([(174,526),(447,390)],fill="#27725b",width=66)
    d.ellipse((140,493,207,559),fill="#27725b")
    d.ellipse((410,355,481,423),fill="#27725b")
    d.line([(185,506),(430,384)],fill="#61a68d",width=6)

def timer(image):
    shadow(image,(175,357,629,508))
    d=ImageDraw.Draw(image)
    round_rect(d,(175,130,607,456),"#813631",55)
    round_rect(d,(174,111,606,430),"#d26252",55,outline="#873a36",width=5)
    d.ellipse((254,120,526,411),fill="#a7453a")
    d.ellipse((255,131,525,401),fill="#f0d7af",outline="#762f2c",width=6)
    for i in range(60):
        angle=2*pi*(i/60)-pi/2
        outer=116
        inner=96 if i%5==0 else 108
        d.line((390+inner*cos(angle),266+inner*sin(angle),390+outer*cos(angle),266+outer*sin(angle)),fill="#614842",width=4 if i%5==0 else 2)
    d.ellipse((322,198,458,334),fill="#98473c",outline="#744036",width=5)
    d.ellipse((323,191,453,321),fill="#be5b4b",outline="#e8a38b",width=5)
    d.polygon([(381,248),(427,204),(404,266)],fill="#ffe4ba")
    d.ellipse((380,241,403,264),fill="#e7a08b")
    d.line([(213,153),(229,137),(252,129)],fill="#f19c86",width=5)

objects=[
    ("tape", (204,169,127), tape, (618,305)),
    ("peg", (142,178,165), pin, (391,317)),
    ("juicer", (176,156,200), juicer, (396,215)),
    ("plug", (210,175,124), plug, (557,272)),
    ("whisk", (198,156,146), whisk, (531,184)),
    ("timer", (123,166,193), timer, (440,164)),
]
for seed, (name, background, draw, (x,y)) in enumerate(objects):
    full=backdrop(background, seed)
    draw(full)
    full.save(OUT / f"{name}-full.webp", quality=87)
    for step, (w,h) in enumerate([(108,81),(257,193)],1):
        crop=full.crop((x-w//2,y-h//2,x-w//2+w,y-h//2+h))
        crop.save(OUT / f"{name}-{step}.webp", quality=89)
