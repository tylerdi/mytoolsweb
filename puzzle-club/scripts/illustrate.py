"""Draw the puzzle illustrations and crop the clues (Pillow)."""
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

def colander(image):
    shadow(image, (136, 394, 685, 499))
    d = ImageDraw.Draw(image)
    for left, right in [(116, 229), (572, 685)]:
        d.rounded_rectangle((left, 272, right, 351), 22, outline="#4d626b", width=12)
        d.rounded_rectangle((left + 1, 268, right - 1, 343), 22, outline="#e1eaed", width=7)
    d.ellipse((208, 230, 601, 461), fill="#566c78", outline="#405662", width=5)
    d.ellipse((186, 202, 622, 396), fill="#8197a2", outline="#455a66", width=5)
    d.ellipse((189, 195, 616, 381), fill="#e0e8e9", outline="#f3f8f5", width=5)
    d.ellipse((206, 209, 600, 368), fill="#a3b4ba", outline="#637a88", width=6)
    d.ellipse((243, 235, 563, 364), fill="#c0cdd0")
    for y, radius, total in [(248, 149, 9), (275, 172, 11), (311, 162, 11), (340, 121, 9)]:
        for j in range(total):
            x = 403 + (j / (total - 1) * 2 - 1) * radius
            offset = int((x - 403)**2 / 2800)
            d.ellipse((x - 5, y - offset - 4, x + 5, y - offset + 5), fill="#4d626b", outline="#ecf2ec", width=1)
    d.arc((201, 217, 609, 388), 24, 166, fill="#f2f5f3", width=5)
    d.arc((241, 320, 575, 446), 18, 147, fill="#9db1b9", width=4)

def lint_roller(image):
    shadow(image, (122, 351, 682, 490))
    d = ImageDraw.Draw(image)
    d.line((491, 309, 573, 317, 604, 379), fill="#667277", width=22)
    d.line((492, 304, 573, 313, 607, 377), fill="#d4dedd", width=9)
    round_rect(d, (568, 358, 702, 428), "#b64e25", 29)
    round_rect(d, (568, 352, 699, 410), "#e67e48", 27)
    round_rect(d, (584, 362, 674, 374), "#f5a679", 5)
    d.rounded_rectangle((146, 205, 507, 379), 73, fill="#b1b3b0", outline="#747d81", width=4)
    d.rounded_rectangle((141, 196, 497, 360), 69, fill="#f6efe1", outline="#aeb5b5", width=4)
    d.ellipse((390, 196, 518, 374), fill="#d5d5ce", outline="#87938f", width=4)
    d.ellipse((398, 204, 507, 357), fill="#fffaf0", outline="#bdc6bd", width=4)
    d.ellipse((432, 239, 477, 326), fill="#d1c7b2", outline="#b9a88b", width=4)
    d.line((218, 197, 298, 361), fill="#a9aba5", width=5)
    d.line((225, 197, 305, 356), fill="#fffdf6", width=4)
    for y in range(230, 330, 21):
        d.line((157, y, 192, y + 2), fill="#d8d7cb", width=2)

def binder(image):
    shadow(image, (158, 379, 661, 469))
    d = ImageDraw.Draw(image)
    d.polygon([(203, 314), (309, 216), (545, 238), (618, 367), (515, 429), (224, 404)], fill="#263644", outline="#212932", width=5)
    d.polygon([(203, 314), (309, 216), (391, 358), (224, 404)], fill="#455161", outline="#334052", width=4)
    d.polygon([(309, 216), (545, 238), (618, 367), (391, 358)], fill="#303940")
    d.line((223, 397, 515, 420, 609, 367), fill="#677384", width=5)
    for shift in (0, 69):
        line=[(286+shift,335), (258+shift,249), (272+shift,179), (319+shift,155), (373+shift,161), (393+shift,187), (382+shift,221), (334+shift,250), (348+shift,322)]
        d.line(line, fill="#5b707c", width=19, joint="curve")
        d.line([(x-2,y-2) for x,y in line], fill="#dce6e3", width=12, joint="curve")
    round_rect(d, (255, 316, 475, 357), "#202931", 13, "#64717b", 3)
    d.line((266, 330, 464, 341), fill="#7f8b90", width=3)

def watering_can(image):
    shadow(image, (124, 365, 693, 478))
    d = ImageDraw.Draw(image)
    d.arc((385, 166, 661, 423), 278, 82, fill="#254d46", width=49)
    d.arc((385, 161, 655, 415), 280, 79, fill="#579984", width=34)
    d.polygon([(297, 342), (148, 197), (122, 221), (277, 395)], fill="#3d7d69", outline="#2b5548", width=5)
    d.line((148, 211, 284, 352), fill="#7cbea6", width=8)
    d.ellipse((91, 155, 192, 229), fill="#806c34", outline="#4d5c43", width=5)
    d.ellipse((88, 145, 187, 214), fill="#d7bd77", outline="#8a763e", width=5)
    for x,y in [(112,178), (129,165), (148,165), (166,174), (124,189), (146,190), (155,204)]:
        d.ellipse((x-3,y-3,x+3,y+3),fill="#655d3d")
    round_rect(d, (251, 248, 562, 439), "#326558", 57, "#234b45", 5)
    round_rect(d, (250, 234, 557, 414), "#639f89", 53, "#2c6252", 4)
    d.ellipse((270, 219, 539, 295), fill="#2e6351", outline="#92c6ad", width=7)
    d.arc((269, 249, 541, 413), 55, 163, fill="#9ccbb2", width=5)

def bike_bell(image):
    shadow(image, (212, 378, 626, 471))
    d = ImageDraw.Draw(image)
    d.ellipse((306, 310, 511, 491), outline="#222e3b", width=36)
    d.arc((317, 323, 502, 477), 40, 157, fill="#677484", width=7)
    round_rect(d, (282, 313, 538, 387), "#2d3a49", 32, "#1b252f", 4)
    d.line((489, 339, 599, 312), fill="#1b2834", width=32)
    round_rect(d, (574, 281, 644, 323), "#273542", 13, "#1a242d", 4)
    for x in range(585, 632, 9):
        d.line((x, 290, x-3, 312), fill="#596676", width=3)
    d.ellipse((243, 167, 567, 354), fill="#78909c", outline="#415762", width=6)
    d.ellipse((247, 151, 563, 332), fill="#c7d8d8", outline="#8298a2", width=6)
    d.ellipse((279, 176, 535, 305), fill="#d7e5e0")
    d.arc((261, 164, 552, 332), 191, 303, fill="#f4f8e9", width=9)
    d.ellipse((388, 199, 419, 226), fill="#9ab0b4", outline="#708b97", width=3)

def hole_punch(image):
    shadow(image, (109, 361, 691, 479))
    d = ImageDraw.Draw(image)
    d.polygon([(140, 342), (628, 321), (671, 370), (643, 438), (140, 461), (116, 418)], fill="#25354d", outline="#1f2c40", width=6)
    d.polygon([(135, 343), (589, 320), (658, 363), (629, 400), (147, 429), (121, 394)], fill="#567eab")
    d.polygon([(170, 279), (249, 276), (249, 392), (170, 405)], fill="#23374d")
    d.polygon([(521, 264), (589, 264), (594, 373), (519, 384)], fill="#23374d")
    for x, y in [(315, 314), (462, 305)]:
        d.ellipse((x-19, y+52, x+23, y+63), fill="#21364b", outline="#9bbed7", width=3)
        d.rounded_rectangle((x-12, y, x+14, y+39), 7, fill="#cad9d8", outline="#5f7485", width=3)
        d.line((x-7, y+4, x-7, y+27), fill="#ecf2e9", width=4)
    d.polygon([(124, 237), (576, 198), (657, 221), (640, 271), (160, 317), (118, 287)], fill="#254768", outline="#23334b", width=5)
    d.polygon([(125, 224), (577, 185), (651, 209), (631, 250), (153, 293), (119, 268)], fill="#608fbe", outline="#325a83", width=5)
    d.line((148, 236, 575, 199), fill="#94bada", width=6)

objects=[
    ("tape", (204,169,127), tape, (618,305)),
    ("peg", (142,178,165), pin, (391,317)),
    ("juicer", (176,156,200), juicer, (396,215)),
    ("plug", (210,175,124), plug, (557,272)),
    ("whisk", (198,156,146), whisk, (531,184)),
    ("timer", (123,166,193), timer, (440,164)),
    ("colander", (174,156,198), colander, (510,325)),
    ("lint-roller", (133,170,152), lint_roller, (262,288)),
    ("binder", (211,175,129), binder, (353,255)),
    ("watering-can", (202,155,145), watering_can, (153,178)),
    ("bike-bell", (149,164,209), bike_bell, (559,308)),
    ("hole-punch", (185,171,130), hole_punch, (352,326)),
]
for seed, (name, background, draw, (x,y)) in enumerate(objects):
    full=backdrop(background, seed)
    draw(full)
    full.save(OUT / f"{name}-full.webp", quality=87)
    for step, (w,h) in enumerate([(108,81),(257,193)],1):
        crop=full.crop((x-w//2,y-h//2,x-w//2+w,y-h//2+h))
        crop.save(OUT / f"{name}-{step}.webp", quality=89)
