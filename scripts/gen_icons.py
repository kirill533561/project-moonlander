from PIL import Image, ImageDraw

def make_icon(size, padding_pct=0.2):
    img = Image.new("RGBA", (size, size), (10, 10, 26, 255))
    draw = ImageDraw.Draw(img)

    pad = int(size * padding_pct)
    inner = size - pad * 2
    cx, cy = size // 2, size // 2

    # Rocket body
    p = max(2, inner // 16)

    # Draw a simple pixel rocket
    cyan = (0, 255, 255, 255)
    white = (230, 230, 230, 255)
    red = (255, 68, 68, 255)
    gold = (255, 215, 0, 255)
    orange = (255, 136, 68, 255)

    def px(x, y, color):
        draw.rectangle([cx + x * p - p // 2, cy + y * p - p // 2, cx + x * p + p // 2, cy + y * p + p // 2], fill=color)

    # Nose cone
    px(0, -4, red)
    px(-1, -3, red); px(0, -3, red); px(1, -3, red)

    # Body
    for dy in [-2, -1, 0, 1]:
        px(-2, dy, white if dy < 0 else (192, 192, 192, 255))
        px(-1, dy, white)
        px(0, dy, cyan if dy == -1 else white)
        px(1, dy, white)
        px(2, dy, white if dy < 0 else (192, 192, 192, 255))

    # Fins
    px(-3, 2, red); px(-2, 2, red)
    px(2, 2, red); px(3, 2, red)

    # Exhaust
    px(-1, 2, gold); px(0, 2, gold); px(1, 2, gold)
    px(-1, 3, orange); px(0, 3, gold); px(1, 3, orange)
    px(0, 4, (255, 68, 68, 150))

    return img

icon_192 = make_icon(192)
icon_512 = make_icon(512)

icon_192.save(r"C:\Users\kiril\Desktop\project-moonlander\public\icon-192.png")
icon_512.save(r"C:\Users\kiril\Desktop\project-moonlander\public\icon-512.png")
print("Icons regenerated with maskable safe zone!")
