# Factoria Font Files

Place your Factoria font files here. The CSS expects these filenames:

| Weight | WOFF2 | WOFF | OTF (fallback) |
|--------|-------|------|----------------|
| Medium (500) | `Factoria-Medium.woff2` | `Factoria-Medium.woff` | `Factoria-Medium.otf` |
| SemiBold (600) | `Factoria-SemiBold.woff2` | `Factoria-SemiBold.woff` | `Factoria-SemiBold.otf` |
| Bold (700) | `Factoria-Bold.woff2` | `Factoria-Bold.woff` | `Factoria-Bold.otf` |

At minimum, you need the **Bold** weight — that's what the main hero title and
section headings use. SemiBold is used for subheadings and nav. Medium for
smaller display text.

If your files have different names, rename them to match the table above,
or update the `@font-face` declarations at the top of `css/styles.css`.

Tip: if you only have `.otf` files, those work fine as the third fallback source.
Just drop them here and the browser will pick them up.
