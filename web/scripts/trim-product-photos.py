# One-off: trims each default product photo to the object, for the item page's
# ivory mat. Writes public/products/mat/<sku>.jpg next to the originals, which
# stay untouched (cards and the frame still use them). Run by hand when a photo
# is added or replaced:
#
#   python3 scripts/trim-product-photos.py            # every photo
#   python3 scripts/trim-product-photos.py 014 015    # just these
#
# Needs Pillow + numpy. Only the crop changes; the pixels of the object don't.

import sys
from pathlib import Path

import numpy as np
from PIL import Image

PAD = 0.06  # even margin left around the object, as a share of its longer side
ROOT = Path(__file__).resolve().parent.parent / 'public' / 'products'
OUT = ROOT / 'mat'
OUT.mkdir(exist_ok=True)

only = set(sys.argv[1:])
for src in sorted(ROOT.glob('*.jpg')):
    sku = src.stem
    if only and sku not in only:
        continue
    im = Image.open(src).convert('RGB')
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    # The backdrop is whatever colour runs round the border; the object is
    # everything that differs from it.
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, 0)
    ys, xs = np.where(np.abs(a - bg).max(2) > 28)
    y0, y1 = np.percentile(ys, [0.5, 99.5])
    x0, x1 = np.percentile(xs, [0.5, 99.5])
    m = PAD * max(x1 - x0, y1 - y0)
    box = (int(max(0, x0 - m)), int(max(0, y0 - m)), int(min(w, x1 + m)), int(min(h, y1 + m)))
    im.crop(box).save(OUT / f'{sku}.jpg', quality=88)
    print(f'{sku}: {w}x{h} -> {box[2] - box[0]}x{box[3] - box[1]}')
