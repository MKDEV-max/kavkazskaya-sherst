"""
Сборка страниц сайта «Кавказская шерсть».

Исходники — в src/: общий шаблон (layout.html), шапка, подвал, окна, иконки
и страницы (src/pages/*.html с заголовком-«шапкой» между строками ---).
Результат — готовые HTML-файлы в корне проекта и sitemap.xml.

Запуск из корня проекта:  python tools/build.py
Правьте src/, а не готовые HTML в корне: они перезаписываются при сборке.
"""
import datetime
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
SITE = 'https://mkdev-max.github.io/kavkazskaya-sherst/'
NAV = ('about', 'catalog', 'delivery', 'contacts')


def read(name):
    return (SRC / name).read_text(encoding='utf-8')


def parse(page):
    text = page.read_text(encoding='utf-8')
    m = re.match(r'---\n(.*?)\n---\n(.*)', text, re.S)
    if not m:
        raise SystemExit(f'{page.name}: нет заголовка ---')
    meta = {}
    for line in m.group(1).splitlines():
        key, _, value = line.partition(':')
        meta[key.strip()] = value.strip()
    return meta, m.group(2).strip()


def build():
    layout = read('layout.html')
    icons = read('icons.svg').replace('{{ridge_front}}', '#22343A')
    header_tpl, footer, dialogs = read('header.html'), read('footer.html'), read('dialogs.html')
    built = []
    for page in sorted((SRC / 'pages').glob('*.html')):
        meta, content = parse(page)
        slug, path = meta['slug'], meta.get('path', '')
        header = header_tpl
        for key in NAV:
            header = header.replace('{{cur_%s}}' % key, ' aria-current="page"' if key == slug else '')
        scripts = ''.join(f'<script src="js/{s.strip()}.js"></script>\n' for s in meta.get('scripts', '').split(',') if s.strip())
        html = layout
        for key, value in {
            'title': meta['title'], 'description': meta['description'],
            'canonical': SITE + path, 'site': SITE, 'slug': slug,
            'robots': meta.get('robots', 'index, follow'),
            'base': f'<base href="{meta["base"]}">\n' if meta.get('base') else '',
            'icons': icons, 'header': header, 'footer': footer, 'dialogs': dialogs,
            'content': content, 'scripts': scripts,
        }.items():
            html = html.replace('{{%s}}' % key, value)
        left = re.findall(r'\{\{\w+\}\}', html)
        if left:
            raise SystemExit(f'{page.name}: не заполнены {left}')
        out = ROOT / (path or 'index.html')
        out.write_text(html, encoding='utf-8', newline='\n')
        built.append((path, meta.get('robots', '')))
        print('  ok', out.name)

    today = datetime.date.today().isoformat()
    urls = ''.join(
        f'  <url><loc>{SITE}{p}</loc><lastmod>{today}</lastmod></url>\n'
        for p, robots in built if 'noindex' not in robots
    )
    (ROOT / 'sitemap.xml').write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '</urlset>\n',
        encoding='utf-8', newline='\n')
    print('  ok sitemap.xml')


if __name__ == '__main__':
    build()
