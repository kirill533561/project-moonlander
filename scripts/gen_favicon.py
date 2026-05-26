from PIL import Image, ImageDraw

# 32x32 favicon — 8-bit star shape
size = 32
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))

# Pixel grid (4px per "pixel" = 8x8 grid)
p = 4
cyan = (0, 255, 255, 255)
white = (255, 255, 255, 255)
gold = (255, 215, 0, 255)
dark = (0, 255, 255, 100)

# 8-bit star pattern (8x8 grid)
# . . . X . . . .
# . . X X X . . .
# . X X X X X . .
# X X X * X X X .   (* = gold center)
# . X X X X X . .
# . . X X X . . .
# . . . X . . . .
# . . . . . . . .
star = [
    "...X....",
    "..XXX...",
    ".XXXXX..",
    "XXX*XXX.",
    ".XXXXX..",
    "..XXX...",
    "...X....",
    "........",
]

for y, row in enumerate(star):
    for x, ch in enumerate(row):
        if ch == "X":
            img.paste(cyan, (x * p, y * p, x * p + p, y * p + p))
        elif ch == "*":
            img.paste(gold, (x * p, y * p, x * p + p, y * p + p))

# Add subtle glow pixels
glow = (0, 255, 255, 60)
for pos in [(2, 0), (4, 0), (0, 2), (6, 2), (0, 4), (6, 4), (2, 6), (4, 6)]:
    x, y = pos
    img.paste(glow, (x * p, y * p, x * p + p, y * p + p))

img.save(r"C:\Users\kiril\Desktop\project-moonlander\public\favicon.ico", format="ICO", sizes=[(32, 32)])
print("Favicon saved!")

# Also save as PNG for other uses
img.save(r"C:\Users\kiril\Desktop\project-moonlander\public\favicon-32.png")
print("PNG saved!")
